import fs from 'fs';
import path from 'path';

export class FileManager {
  createDirectory(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  removeDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  copyDirectory(source: string, destination: string): void {
    fs.cpSync(source, destination, { recursive: true });
  }

  copyFile(source: string, destination: string): void {
    fs.copyFileSync(source, destination);
  }

  readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }

  writeFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  readJSON<T>(filePath: string): T {
    const content = this.readFile(filePath);
    return JSON.parse(content);
  }

  writeJSON(filePath: string, data: unknown): void {
    const content = JSON.stringify(data, null, 2);
    this.writeFile(filePath, content);
  }

  getAllFiles(dirPath: string, extension?: string): string[] {
    const files = fs.readdirSync(dirPath, { recursive: true }) as string[];
    
    if (extension) {
      return files.filter((file) => file.endsWith(extension));
    }
    
    return files;
  }
}

