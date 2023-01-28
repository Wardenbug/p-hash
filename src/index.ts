const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

fs.readFile('./ana.jpg', (err: any, data: any) => {
    if (err) throw err;

    const rawImageData = jpeg.decode(data);
    const { width, height, data: imageData } = rawImageData;

    for (let i = 0; i < imageData.length; i += 4) {
        const avg = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        imageData[i] = avg;
        imageData[i + 1] = avg;
        imageData[i + 2] = avg;
    }

    const jpegImageData = jpeg.encode({ width, height, data: imageData }, 90);
    fs.writeFile('filename.jpg', jpegImageData.data, (err: any) => {
        if (err) throw err;
        console.log(`File saved as filename.jpg`);
    });
});




