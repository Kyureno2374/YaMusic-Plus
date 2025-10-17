import { promisify } from 'util';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const _7z = require('7zip-min');

export class ArchiveExtractor {
  async extract(archivePath: string, outputPath: string): Promise<void> {
    const unpack = promisify(_7z.unpack);
    await unpack(archivePath, outputPath);
  }
}

