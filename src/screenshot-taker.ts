// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import * as Puppeteer from 'puppeteer';

// Ours
import { CONSTS, TestCase } from './screenshot-consts';
import { calcTestCaseName, sleep, waitForNetworkIdle } from './util';

const DEFAULT_SELECTOR = 'body';

export interface ScreenshotOptions {
	destinationDir: string;
	captureLogs?: boolean;
	debug?: boolean;
}

export async function screenshotGraphic(
	page: Puppeteer.Page,
	{
		route,
		nameAppendix = '',
		selector = DEFAULT_SELECTOR,
		additionalDelay = 0,
		before,
		after,
		replicantPrefills,
	}: TestCase,
	{ destinationDir, captureLogs = false, debug = false }: ScreenshotOptions,
): Promise<void> {
	const url = `http://127.0.0.1:${CONSTS.PORT}/${route}`;
	const screenshotFilename = `${calcTestCaseName({ route, nameAppendix })}.png`;
	const screenshotPath = path.join(destinationDir, screenshotFilename);

	let delay = additionalDelay;
	if (process.env.CI && process.env.CI.toLowerCase() === 'true') {
		delay += 0;
	}

	const logs: string[] = [];
	if (captureLogs) {
		page.on('console', (msg: any) => logs.push(msg.text()));
	}

	page.goto(url);
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'load' }),
		page.waitForNavigation({ waitUntil: 'networkidle0' }),
	]);

	await page.waitForSelector(selector);
	const element = await page.$(selector);

	if (!element) {
		return;
	}

	await page.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		(window as any).nodecg.playSound = () => {};
	});

	if (replicantPrefills && Object.keys(replicantPrefills).length > 0) {
		const prefilledReplicants: { [key: string]: any } = {};
		Object.entries(replicantPrefills).forEach(([key, value]: [string, any]) => {
			if (value === undefined) {
				const filePath = path.resolve(
					CONSTS.BUNDLE_ROOT,
					'test/fixtures/replicants',
					`${encodeURIComponent(key)}.rep`,
				);
				const fileContents = fs.readFileSync(filePath, 'utf-8');
				prefilledReplicants[key] = JSON.parse(fileContents);
			} else {
				prefilledReplicants[key] = value;
			}
		});

		await page.evaluate(browserPrefilledReplicants => {
			Object.entries(browserPrefilledReplicants).forEach(([key, value]: [string, any]) => {
				// eslint-disable-next-line new-cap
				const replicant = (window as any).nodecg.Replicant(key);
				replicant.status = 'declared';
				replicant.value = value;
				console.log(`set ${key} to`, value);
				replicant.emit('change', value);
			});
		}, prefilledReplicants);
	}

	if (before) {
		await before(page, element);
	}

	if (delay > 0) {
		await sleep(delay);
	}

	await waitForNetworkIdle(page);

	await page.screenshot({
		path: screenshotPath,
		omitBackground: true,
	});

	if (after) {
		await after(page, element);
	}

	if (captureLogs) {
		const logPath = screenshotPath.replace(/\.png$/, '.log');
		fs.writeFileSync(logPath, logs.join('\n'));
	}

	if (!debug) {
		await page.close();
	}
}
