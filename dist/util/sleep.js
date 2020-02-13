"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function sleep(milliseconds) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}
exports.sleep = sleep;
//# sourceMappingURL=sleep.js.map