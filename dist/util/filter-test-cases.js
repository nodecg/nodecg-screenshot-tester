"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calc_test_case_name_1 = require("./calc-test-case-name");
function filterTestCases(testCases, pattern) {
    const filterRegExp = new RegExp(pattern);
    if (pattern) {
        console.log('Filter:', filterRegExp);
    }
    return testCases.filter(testCase => {
        const testCaseFileName = calc_test_case_name_1.calcTestCaseName(testCase);
        return filterRegExp.test(testCaseFileName);
    });
}
exports.filterTestCases = filterTestCases;
//# sourceMappingURL=filter-test-cases.js.map