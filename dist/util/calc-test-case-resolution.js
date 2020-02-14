"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function calcTestCaseResolution(testCase, consts) {
    let width = consts.DEFAULT_WIDTH;
    let height = consts.DEFAULT_HEIGHT;
    const graphicManifest = consts.BUNDLE_MANIFEST.nodecg.graphics.find((graphic) => {
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
exports.calcTestCaseResolution = calcTestCaseResolution;
//# sourceMappingURL=calc-test-case-resolution.js.map