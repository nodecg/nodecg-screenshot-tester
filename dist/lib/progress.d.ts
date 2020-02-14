import * as BaseProgressBar from 'progress';
export declare class ProgressBar extends BaseProgressBar {
    interrupt(message: string): void;
    render(tokens?: string[]): void;
    tick(): void;
}
