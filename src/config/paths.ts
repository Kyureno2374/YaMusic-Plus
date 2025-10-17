import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const SRC_DIR = path.resolve(ROOT_DIR, 'src');
export const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
export const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');

export const MOD_DIR = path.resolve(SRC_DIR, 'mod');
export const PATCHER_DIR = path.resolve(SRC_DIR, 'patcher');
export const UI_DIR = path.resolve(SRC_DIR, 'ui');

