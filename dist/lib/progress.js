"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Packages
const BaseProgressBar = require("progress");
class ProgressBar extends BaseProgressBar {
    interrupt(message) {
        if (process.stdout.isTTY) {
            return super.interrupt(message);
        }
        console.log(message);
    }
    render(tokens) {
        if (process.stdout.isTTY) {
            return super.render(tokens);
        }
    }
    tick() {
        if (process.stdout.isTTY) {
            return super.tick();
        }
    }
}
exports.ProgressBar = ProgressBar;
//# sourceMappingURL=progress.js.map