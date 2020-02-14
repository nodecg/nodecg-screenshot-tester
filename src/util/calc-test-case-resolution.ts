import { TestCase, ConstsInterface } from '../screenshot-consts';

export function calcTestCaseResolution(testCase: TestCase, consts: ConstsInterface): { width: number; height: number } {
	let width = consts.DEFAULT_WIDTH;
	let height = consts.DEFAULT_HEIGHT;

	const graphicManifest = consts.BUNDLE_MANIFEST.nodecg.graphics.find((graphic: any) => {
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
