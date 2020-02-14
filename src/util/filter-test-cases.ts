import { TestCase } from '../screenshot-consts';
import { calcTestCaseName } from './calc-test-case-name';

export function filterTestCases(testCases: TestCase[], pattern: string): TestCase[] {
	const filterRegExp = new RegExp(pattern);
	if (pattern) {
		console.log('Filter:', filterRegExp);
	}

	return testCases.filter(testCase => {
		const testCaseFileName = calcTestCaseName(testCase);
		return filterRegExp.test(testCaseFileName);
	});
}
