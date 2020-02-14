// Native
import * as fs from 'fs';

// Packages
import * as mkdirp from 'mkdirp';
import * as tmp from 'tmp';

type ReturnType = {
	tempDir: string;
	cleanupTempDir: () => void;
};

const noop = (): undefined => {
	return undefined;
};

export const makeTempDir = (): ReturnType => {
	if (process.env.TEST_SCREENSHOT_DIR) {
		if (!fs.existsSync(process.env.TEST_SCREENSHOT_DIR)) {
			mkdirp.sync(process.env.TEST_SCREENSHOT_DIR);
		}

		return {
			tempDir: process.env.TEST_SCREENSHOT_DIR,
			cleanupTempDir: noop,
		};
	}

	const tmpobj = tmp.dirSync({ keep: true, unsafeCleanup: true });
	return {
		tempDir: tmpobj.name,
		cleanupTempDir: () => {
			if (!process.env.CI || process.env.CI.toLowerCase() !== 'true') {
				tmpobj.removeCallback();
			}
		},
	};
};
