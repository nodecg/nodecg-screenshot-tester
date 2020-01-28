/* eslint-disable @typescript-eslint/no-var-requires */

// Native
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { Handler } from 'express';

let BUNDLE_ROOT;
try {
	BUNDLE_ROOT = findBundleRoot(__dirname);
} catch {
	BUNDLE_ROOT = findBundleRoot(process.cwd());
}

const constsFromBundle = require(path.join(BUNDLE_ROOT, 'test/helpers/screenshot-consts'));
const bundleManifest = require(path.join(BUNDLE_ROOT, 'package.json'));

export interface TestCase {
	route: string;
	nameAppendix?: string;
	selector?: string;
	additionalDelay?: number;
	entranceMethodName?: string;
	entranceMethodArgs?: any[];
	replicantPrefills?: { [key: string]: any };
	before?: (...args: any[]) => any;
	metadata?: { [key: string]: any };
}

export interface CustomRoute {
	method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
	route: string;
	handler: Handler;
}

export interface ConstsInterface {
	DEFAULT_WIDTH: number;
	DEFAULT_HEIGHT: number;
	PORT: number;
	BUNDLE_NAME: string;
	BUNDLE_ROOT: string;
	BUNDLE_MANIFEST: any;
	BUNDLE_CONFIG: { [keys: string]: any };
	FIXTURE_SCREENSHOTS_DIR: string;
	PUPPETEER_LAUNCH_OPTS: puppeteer.LaunchOptions;
	TEST_CASES: TestCase[];
	CUSTOM_ROUTES: CustomRoute[];
}

const baseConsts = {
	DEFAULT_WIDTH: 1920,
	DEFAULT_HEIGHT: 1080,
	PORT: 4000,
	BUNDLE_NAME: bundleManifest.name,
	BUNDLE_ROOT,
	BUNDLE_MANIFEST: bundleManifest,
	BUNDLE_CONFIG: {},
	FIXTURE_SCREENSHOTS_DIR: path.join(BUNDLE_ROOT, 'test/fixtures/screenshots'),
	PUPPETEER_LAUNCH_OPTS: {
		headless: true,
		args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
	},
};

export const CONSTS: ConstsInterface = {
	...baseConsts,
	...constsFromBundle,
};

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
