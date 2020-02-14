// Packages
import * as BaseProgressBar from 'progress';

export class ProgressBar extends BaseProgressBar {
	interrupt(message: string): void {
		if (process.stdout.isTTY) {
			return super.interrupt(message);
		}

		console.log(message);
	}

	render(tokens?: string[]): void {
		if (process.stdout.isTTY) {
			return super.render(tokens);
		}
	}

	tick(): void {
		if (process.stdout.isTTY) {
			return super.tick();
		}
	}
}
