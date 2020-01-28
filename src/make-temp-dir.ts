// Native
import * as fs from 'fs';

// Packages
import * as mkdirp from 'mkdirp';
import * as tmp from 'tmp';
import { TestInterface } from 'ava';

export const makeTempDir = (test: TestInterface): string => {
	if (process.env.TEST_SCREENSHOT_DIR) {
		if (!fs.existsSync(process.env.TEST_SCREENSHOT_DIR)) {
			mkdirp.sync(process.env.TEST_SCREENSHOT_DIR);
		}

		return process.env.TEST_SCREENSHOT_DIR;
	}

	const tmpobj = tmp.dirSync({ keep: true, unsafeCleanup: true });
	test.after('remove tmp dir', () => {
		if (!process.env.CI || process.env.CI.toLowerCase() !== 'true') {
			tmpobj.removeCallback();
		}
	});
	return tmpobj.name;
};
