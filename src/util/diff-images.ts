// Packages
import pixelmatch = require('pixelmatch');
import { PNG } from 'pngjs';

// We want to keep the pngjs dependency contained to this one file.

async function parsePng(buffer: Buffer): Promise<PNG> {
	return new Promise((resolve, reject) => {
		const tmp = new PNG();
		tmp.parse(buffer, (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}

export async function diffImages(a: Buffer, b: Buffer, threshold: number): Promise<Buffer | void> {
	const resultImage = await parsePng(a);
	const fixtureImage = await parsePng(b);

	// The images should be the same resolution.
	if (resultImage.width !== fixtureImage.width || resultImage.height !== fixtureImage.height) {
		throw new Error('Images are not the same resolution.');
	}

	// Do the visual diff.
	const diff = new PNG({
		width: resultImage.width,
		height: fixtureImage.height,
	});
	const numDiffPixels = pixelmatch(
		resultImage.data,
		fixtureImage.data,
		diff.data,
		resultImage.width,
		resultImage.height,
		{ threshold },
	);

	if (numDiffPixels > 0) {
		return PNG.sync.write(diff);
	}
}
