export function calcTestCaseName({ route, nameAppendix }: { route: string; nameAppendix?: string }): string {
	let testName = route.split('/').pop();

	if (testName) {
		testName = testName.split('?')[0];
	}

	if (nameAppendix) {
		testName += '-' + nameAppendix;
	}

	return testName ?? '';
}
