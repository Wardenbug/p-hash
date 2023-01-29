const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const Canvas = require('canvas');

const MAX_SIZE = 8;


const hammingDistance = (h1: string, h2: string): number => {
    if (h1.length !== h2.length) throw new Error('Hashes must be of equal length');

    let dist_counter = 0;

    for (let i = 0; i < h1.length; i++) {
        if (h1[i] !== h2[i]) dist_counter++;
    }

    return dist_counter;
};


const resizeImage = async (imageBuffer: Buffer, maxSize = MAX_SIZE) => {
    const image = new Canvas.Image();

    const width = maxSize
    const height = maxSize
    const canvas = new Canvas.Canvas(width, height);
    const ctx = canvas.getContext('2d');

    return new Promise((resolve, reject) => {
        image.onload = () => {
            ctx.drawImage(image, 0, 0, width, height);
            resolve(canvas.toBuffer('image/jpeg'));
        }
        image.onerror = () => {
            reject('error')
        }
        image.src = imageBuffer;
    })
};

const grayScaleImage = (imageBuffer: Buffer) => {
    const rawImageData = jpeg.decode(imageBuffer);
    const { data: imageData } = rawImageData;
    for (let i = 0; i < imageData.length; i += 4) {
        const avg = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        imageData[i] = avg;
        imageData[i + 1] = avg;
        imageData[i + 2] = avg;
        imageData[i + 3] = 255;
    }

    rawImageData.data = imageData;

    const jpegImageData = jpeg.encode({ width: 8, height: 8, data: imageData }, 90);

    return jpegImageData.data;
}

const toHash = (bits: any[]) => {
    const buffer = Buffer.alloc(8);

    for (let i = 0; i < 8; i++) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
            byte = (byte << 1) | bits[i * 8 + j];
        }
        buffer.writeUInt8(byte, i);
    }

    const hexString = buffer.toString("hex");

    return hexString;
}

function getImageFormat(imageBuffer: Buffer) {
    if (imageBuffer.readUInt16BE(0) === 0xffd8) {
        return "JPEG";
    } else if (imageBuffer.toString("hex", 0, 4) === "89504e47") {
        return "PNG";
    } else {
        return "Unknown";
    }
}

type ImageFormat = 'RGBA' | 'RGB' | 'BGR' | 'BGRA';

const getPixelColor = (buffer: Buffer, imageFormat: ImageFormat, x: number, y: number) => {
    let offset = 0;

    switch (imageFormat) {
        case "RGBA":
            offset = (y * MAX_SIZE + x) * 4;
            return {
                r: buffer.readUInt8(offset),
                g: buffer.readUInt8(offset + 1),
                b: buffer.readUInt8(offset + 2),
                a: buffer.readUInt8(offset + 3)
            };
        case "RGB":
            offset = (y * MAX_SIZE + x) * 3;
            return {
                r: buffer.readUInt8(offset),
                g: buffer.readUInt8(offset + 1),
                b: buffer.readUInt8(offset + 2)
            };
        case "BGR":
            offset = (y * MAX_SIZE + x) * 3;
            return {
                b: buffer.readUInt8(offset),
                g: buffer.readUInt8(offset + 1),
                r: buffer.readUInt8(offset + 2)
            };
        case "BGRA":
            offset = (y * MAX_SIZE + x) * 4;
            return {
                b: buffer.readUInt8(offset),
                g: buffer.readUInt8(offset + 1),
                r: buffer.readUInt8(offset + 2),
                a: buffer.readUInt8(offset + 3)
            };
        default:
            throw new Error(`Unsupported image format: ${imageFormat}`);
    }
};

const findAverage = async (imageBuffer: Buffer) => {
    await saveImage(imageBuffer, `test${+Date.now()}.jpg`);
    const pixels = [];
    for (let x = 0; x < MAX_SIZE; x++) {
        for (let y = 0; y < MAX_SIZE; y++) {
            const color = getPixelColor(imageBuffer, 'RGBA', x, y);
            pixels.push(color);
        }
    };

    const totalR = pixels.reduce((accumulator, value) => { return accumulator + value.r }, 0) / (MAX_SIZE * MAX_SIZE);
    const totalG = pixels.reduce((accumulator, value) => { return accumulator + value.g }, 0) / (MAX_SIZE * MAX_SIZE);
    const totalB = pixels.reduce((accumulator, value) => { return accumulator + value.b }, 0) / (MAX_SIZE * MAX_SIZE);


    const avg = (totalR + totalG + totalB) / 3;

    const bits: any = [];

    pixels.forEach((el) => {
        if (((el.r + el.g + el.b) / 3) < avg) {
            bits.push(0)
        } else {
            bits.push(1)
        }
    });

    return toHash(bits);
}


const readImage = (path: string) =>
    new Promise((resolve, reject) => {
        fs.readFile(path, (err: string, buffer: Buffer) => {
            if (err) reject(err);
            else resolve(buffer);
        });
    });


const saveImage = async (buffer: Buffer, path: string) =>
    new Promise((resolve, reject) => {
        fs.writeFile(path, buffer, (err: any) => {
            if (err) reject(err);
            else resolve(null);
        });
    });


const getHash = async (image: Buffer) => {
    const resized: any = await resizeImage(image);
    const grayImage: Buffer = await grayScaleImage(resized);
    const hash = await findAverage(grayImage);

    return hash;
};

(async () => {
    const image1: any = await readImage('./test.jpg');
    try {
        const hash1 = await getHash(image1);

        console.log(hash1);
    } catch (err) {
        console.log(err)
    }
})()