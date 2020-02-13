// Native
import * as fs from 'fs';
import * as path from 'path';

// Ours
import { CONSTS, TestCase } from './screenshot-consts';
import * as Puppeteer from 'puppeteer';

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
		entranceMethodName = '',
		entranceMethodArgs = [],
		additionalDelay = 0,
		before,
		replicantPrefills,
	}: TestCase,
	{ destinationDir, captureLogs = false, debug = false }: ScreenshotOptions,
): Promise<void> {
	const url = `http://127.0.0.1:${CONSTS.PORT}/${route}`;
	const screenshotFilename = `${computeFullTestCaseName({ route, nameAppendix })}.png`;
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

	if (entranceMethodName && selector !== DEFAULT_SELECTOR) {
		await element.click(); // Necessary to get media to play in some circumstances.
		await page.$eval(
			selector,
			async (el, browserEntranceMethodName, browserEntranceArgs) => {
				return new Promise(resolve => {
					const entranceMethod = el[browserEntranceMethodName as keyof Element];
					if (typeof entranceMethod !== 'function') {
						throw new Error(`Entrance method ${String(browserEntranceMethodName)} not found on element.`);
					}

					let entranceResult = (entranceMethod as any).apply(el, browserEntranceArgs);
					if (entranceResult.then && typeof entranceResult.then === 'function') {
						// Handle entrance methods which return a Promise.
						entranceResult.then(() => {
							resolve();
						});
					} else if (
						entranceResult instanceof (window as any).TimelineLite ||
						entranceResult instanceof (window as any).TimelineMax
					) {
						//  Handle entrance methods which return GSAP timeline.
						setTimeout(() => {
							entranceResult.call(() => {
								resolve();
							});
						}, 250);
					} else if (
						entranceResult instanceof (window as any).TweenLite ||
						entranceResult instanceof (window as any).TweenMax
					) {
						//  Handle entrance methods which return a GSAP tween.
						const tl = new (window as any).TimelineLite();
						tl.add(entranceResult);
						tl.call(() => {
							resolve();
						});
					} else {
						resolve();
					}
				});
			},
			entranceMethodName,
			entranceMethodArgs,
		);
	}

	if (delay > 0) {
		await sleep(delay);
	}

	await page.screenshot({
		path: screenshotPath,
		omitBackground: true,
	});

	if (captureLogs) {
		const logPath = screenshotPath.replace(/\.png$/, '.log');
		fs.writeFileSync(logPath, logs.join('\n'));
	}

	if (!debug) {
		await page.close();
	}
}

export function computeFullTestCaseName({ route, nameAppendix }: { route: string; nameAppendix?: string }): string {
	let testName = route.split('/').pop();

	if (testName) {
		testName = testName.split('?')[0];
	}

	if (nameAppendix) {
		testName += '-' + nameAppendix;
	}

	return testName ?? '';
}

export function computeTestCaseResolution(testCase: TestCase): { width: number; height: number } {
	let width = CONSTS.DEFAULT_WIDTH;
	let height = CONSTS.DEFAULT_HEIGHT;

	const graphicManifest = CONSTS.BUNDLE_MANIFEST.nodecg.graphics.find((graphic: any) => {
		if (!graphic || typeof graphic !== 'object') {
			return false;
		}

		return testCase.route.endsWith(graphic.file);
	});

	if (graphicManifest) {
		width = graphicManifest.width;
		height = graphicManifest.height;
	}

	return { width, height };
}

async function sleep(milliseconds: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, milliseconds);
	});
}
