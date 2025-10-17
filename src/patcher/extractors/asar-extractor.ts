import asar from 'asar';

export class AsarExtractor {
  extract(asarPath: string, outputPath: string): void {
    asar.extractAll(asarPath, outputPath);
  }

  pack(sourcePath: string, outputPath: string): void {
    asar.createPackage(sourcePath, outputPath);
  }
}

