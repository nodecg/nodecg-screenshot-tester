"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function calcTestCaseName({ route, nameAppendix }) {
    let testName = route.split('/').pop();
    if (testName) {
        testName = testName.split('?')[0];
    }
    if (nameAppendix) {
        testName += '-' + nameAppendix;
    }
    return (testName !== null && testName !== void 0 ? testName : '');
}
exports.calcTestCaseName = calcTestCaseName;
//# sourceMappingURL=calc-test-case-name.js.map