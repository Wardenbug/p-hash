const jpeg = require('jpeg-js');
const Canvas = require('canvas');

import { getRawPixelData } from "./jpeg-pixel";
import { readImage, saveImage } from "./utils";

const MAX_SIZE = 8;
type ImageFormat = 'RGBA' | 'RGB' | 'BGR' | 'BGRA';


const resizeImage = async (imageBuffer: Buffer, format: string, maxSize = MAX_SIZE) => {
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
    const buff = getRawPixelData(imageBuffer);

    const totalR = buff.reduce((accumulator, value) => { return accumulator + value.red }, 0) / (MAX_SIZE * MAX_SIZE);
    const totalG = buff.reduce((accumulator, value) => { return accumulator + value.green }, 0) / (MAX_SIZE * MAX_SIZE);
    const totalB = buff.reduce((accumulator, value) => { return accumulator + (value.blue || 0) }, 0) / (MAX_SIZE * MAX_SIZE);

    const avg = (totalR + totalG + totalB) / 3;

    const bits: any = [];

    buff.forEach((el) => {
        if (((el.red + el.green + el.blue) / 3) < avg) {
            bits.push(0)
        } else {
            bits.push(1)
        }
    });

    return toHash(bits);
}

const getHash = async (image: Buffer) => {
    const resized: any = await resizeImage(image, 'jpeg');
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