/// <reference types="node" />
import { Server } from 'http';
export declare const open: () => Promise<Server>;
export declare const close: () => void | Server;
