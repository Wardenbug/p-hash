const fs = require('fs');

export const hammingDistance = (h1: string, h2: string): number => {
    if (h1.length !== h2.length) throw new Error('Hashes must be of equal length');

    let dist_counter = 0;

    for (let i = 0; i < h1.length; i++) {
        if (h1[i] !== h2[i]) dist_counter++;
    }

    return dist_counter;
};


export function getImageFormat(imageBuffer: Buffer) {
    if (imageBuffer.readUInt16BE(0) === 0xffd8) {
        return "JPEG";
    } else if (imageBuffer.toString("hex", 0, 4) === "89504e47") {
        return "PNG";
    } else {
        return "Unknown";
    }
}

export const readImage = (path: string) =>
    new Promise((resolve, reject) => {
        fs.readFile(path, (err: string, buffer: Buffer) => {
            if (err) reject(err);
            else resolve(buffer);
        });
    });


export const saveImage = async (buffer: Buffer, path: string) =>
    new Promise((resolve, reject) => {
        fs.writeFile(path, buffer, (err: any) => {
            if (err) reject(err);
            else resolve(null);
        });
    });
