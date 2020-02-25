"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Packages
const pixelmatch = require("pixelmatch");
const pngjs_1 = require("pngjs");
// We want to keep the pngjs dependency contained to this one file.
async function parsePng(buffer) {
    return new Promise((resolve, reject) => {
        const tmp = new pngjs_1.PNG();
        tmp.parse(buffer, (error, data) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(data);
            }
        });
    });
}
async function diffImages(a, b, threshold) {
    const resultImage = await parsePng(a);
    const fixtureImage = await parsePng(b);
    // The images should be the same resolution.
    if (resultImage.width !== fixtureImage.width || resultImage.height !== fixtureImage.height) {
        throw new Error('Images are not the same resolution.');
    }
    // Do the visual diff.
    const diff = new pngjs_1.PNG({
        width: resultImage.width,
        height: fixtureImage.height,
    });
    const numDiffPixels = pixelmatch(resultImage.data, fixtureImage.data, diff.data, resultImage.width, resultImage.height, { threshold });
    if (numDiffPixels > 0) {
        return pngjs_1.PNG.sync.write(diff);
    }
}
exports.diffImages = diffImages;
//# sourceMappingURL=diff-images.js.map