declare type ReturnType = {
    tempDir: string;
    cleanupTempDir: () => void;
};
export declare const makeTempDir: () => ReturnType;
export {};
