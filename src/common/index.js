import path from 'path';
import { fileURLToPath } from 'url';
export const NOT_INITIALIZED = 0;
export const INITIALIZING = 1;
export const INITIALIZED = 2;

export const initStates = [NOT_INITIALIZED, INITIALIZING, INITIALIZED];

export const NOT_READY = 0;
export const GETTING_READY = 1;
export const READY = 2;

export const readyStates = [NOT_READY, GETTING_READY, READY];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectDir = path.resolve(__dirname, '../../');