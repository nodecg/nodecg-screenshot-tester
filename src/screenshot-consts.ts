'use strict';

// Native
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

let BUNDLE_ROOT;
try {
	BUNDLE_ROOT = findBundleRoot(__dirname);
} catch {
	BUNDLE_ROOT = findBundleRoot(process.cwd());
}

/* tslint:disable:no-var-requires */
const constsFromBundle = require(path.join(BUNDLE_ROOT, 'test/helpers/screenshot-consts'));
const bundlePackageJson = require(path.join(BUNDLE_ROOT, 'package.json'));
/* tslint:enable:no-var-requires */

export interface TestCase {
	route: string;
	nameAppendix?: string;
	selector?: string;
	additionalDelay?: number;
	entranceMethodName?: string;
	entranceMethodArgs?: any[];
	replicantPrefills?: {[key: string]: any};
	before?: Function;
}

export interface ConstsInterface {
	WIDTH: number;
	HEIGHT: number;
	PORT: number;
	BUNDLE_NAME: string;
	BUNDLE_ROOT: string;
	BUNDLE_CONFIG: {[keys: string]: any};
	FIXTURE_SCREENSHOTS_DIR: string;
	PUPPETEER_LAUNCH_OPTS: puppeteer.LaunchOptions;
	TEST_CASES: TestCase[];
}

const baseConsts = {
	WIDTH: 1920,
	HEIGHT: 1080,
	PORT: 4000,
	BUNDLE_NAME: bundlePackageJson.name,
	BUNDLE_ROOT,
	BUNDLE_CONFIG: {},
	FIXTURE_SCREENSHOTS_DIR: path.join(BUNDLE_ROOT, 'test/fixtures/screenshots'),
	PUPPETEER_LAUNCH_OPTS: {
		headless: true,
		args: [
			'--disable-gpu',
			'--autoplay-policy=no-user-gesture-required'
		]
	}
};

export const CONSTS = {
	...baseConsts,
	...constsFromBundle
} as ConstsInterface;

function findBundleRoot(dir: string): string {
	const packageJsonPath = path.join(dir, 'package.json');
	if (fs.existsSync(packageJsonPath)) {
		const packageJson = require(packageJsonPath);
		if (packageJson.nodecg) {
			return path.dirname(packageJsonPath);
		}
	}

	const nextDir = path.resolve(dir, '..');
	if (nextDir === dir) {
		throw new Error('could not find bundle root');
	}

	return findBundleRoot(nextDir);
}
