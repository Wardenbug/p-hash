export const getRawPixelData = (buf: Buffer) => {
    let pos = 0;
    let marker;
    let length = 0;

    while (pos < buf.length) {
        if (buf[pos] !== 0xff) {
            throw new Error('Not a valid JPEG file');
        }

        marker = buf[pos + 1];
        length = buf.readUInt16BE(pos + 2) + 2;
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
            break;
        }

        pos += length;
    }

    const bitsPerSample = buf[pos + 4];
    const height = buf.readUInt16BE(pos + 5);
    const width = buf.readUInt16BE(pos + 7);
    const numComponents = buf[pos + 9];

    const bytesPerPixel = bitsPerSample / 8 * numComponents;

    const rawData = buf.slice(pos + 10, pos + length);

    const map = []
    for (let i = 0; i < rawData.length; i += bytesPerPixel) {
        const red = rawData[i];
        const green = rawData[i + 1];
        const blue = rawData[i + 2];
        const x = (i / bytesPerPixel) % width;
        const y = Math.floor((i / bytesPerPixel) / width);

        map.push({ x, y, red, green, blue });

        console.log(`Pixel at (${x}, ${y}) has RGB value (${red}, ${green}, ${blue})`);
    }

    return map;
}