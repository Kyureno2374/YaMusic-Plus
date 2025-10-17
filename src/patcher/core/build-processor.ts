import path from 'path';
import { FileManager } from './file-manager';
import { ArchiveExtractor } from '../extractors/archive-extractor';
import { AsarExtractor } from '../extractors/asar-extractor';
import { ConfigPatcher } from '../injectors/config-patcher';
import { CodeInjector } from '../injectors/code-injector';
import { BuildInfo, downloadBuild } from './yandex-api';

export class BuildProcessor {
  private fileManager: FileManager;
  private archiveExtractor: ArchiveExtractor;
  private asarExtractor: AsarExtractor;
  private configPatcher: ConfigPatcher;
  private codeInjector: CodeInjector;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.fileManager = new FileManager();
    this.archiveExtractor = new ArchiveExtractor();
    this.asarExtractor = new AsarExtractor();
    this.configPatcher = new ConfigPatcher(this.fileManager);
    this.codeInjector = new CodeInjector(this.fileManager);
  }

  async process(build: BuildInfo): Promise<void> {
    const buildDir = path.join(this.projectRoot, '.versions', build.version);
    const tempDir = path.join(buildDir, 'temp');
    const buildBinaryPath = path.join(tempDir, 'build.bin');
    const extractDir = path.join(tempDir, 'extracted');
    const buildSourceDir = path.join(buildDir, 'src');
    const buildModdedDir = path.join(buildDir, 'mod');

    this.setupDirectories(buildDir, tempDir, extractDir, buildSourceDir, buildModdedDir);

    console.log(`[1/8] Скачивание сборки ${build.version}`);
    await this.downloadBuildFile(build, buildBinaryPath);

    console.log(`[2/8] Распаковка архива`);
    await this.archiveExtractor.extract(buildBinaryPath, extractDir);

    console.log(`[3/8] Извлечение app.asar`);
    this.extractAsar(extractDir, buildSourceDir, buildDir);

    console.log(`[4/8] Очистка временных файлов`);
    this.fileManager.removeDirectory(tempDir);

    console.log(`[5/8] Копирование исходников`);
    this.fileManager.copyDirectory(buildSourceDir, buildModdedDir);

    console.log(`[6/8] Патчинг конфигурации`);
    this.patchConfiguration(buildModdedDir);

    console.log(`[7/8] Инжекция кода мода`);
    this.injectModCode(buildModdedDir);

    console.log(`[8/8] Удаление splash screen`);
    this.removeSplashScreen(buildModdedDir);

    console.log(`\n✅ Патчинг завершен: ${buildModdedDir}`);
  }

  private setupDirectories(...dirs: string[]): void {
    for (const dir of dirs) {
      this.fileManager.removeDirectory(dir);
      this.fileManager.createDirectory(dir);
    }
  }

  private async downloadBuildFile(build: BuildInfo, outputPath: string): Promise<void> {
    const result = await downloadBuild(build, outputPath);
    
    if (result.isErr()) {
      throw new Error(`Ошибка скачивания: ${result.error.message}`);
    }
  }

  private extractAsar(extractDir: string, buildSourceDir: string, buildDir: string): void {
    const appAsarPath = path.join(extractDir, 'resources', 'app.asar');
    const appIconPath = path.join(extractDir, 'resources', 'assets', 'icon.ico');

    if (!this.fileManager.fileExists(appAsarPath)) {
      throw new Error('app.asar не найден');
    }

    this.asarExtractor.extract(appAsarPath, buildSourceDir);

    if (this.fileManager.fileExists(appIconPath)) {
      this.fileManager.createDirectory(path.join(buildSourceDir, 'assets'));
      this.fileManager.copyFile(appIconPath, path.join(buildDir, 'icon.ico'));
      this.fileManager.copyFile(appIconPath, path.join(buildSourceDir, 'assets', 'icon.ico'));
    }
  }

  private patchConfiguration(buildModdedDir: string): void {
    const files = {
      packageJson: path.join(buildModdedDir, 'package.json'),
      configJs: path.join(buildModdedDir, 'main', 'config.js'),
      mainJs: path.join(buildModdedDir, 'main', 'index.js'),
      preloadJs: path.join(buildModdedDir, 'main', 'lib', 'preload.js'),
      createWindowJs: path.join(buildModdedDir, 'main', 'lib', 'window', 'createWindow.js'),
      updaterJs: path.join(buildModdedDir, 'main', 'lib', 'updater.js'),
      systemMenuJs: path.join(buildModdedDir, 'main', 'lib', 'systemMenu.js'),
    };

    console.log('🔍 Поиск ключевых файлов...');

    for (const [name, filePath] of Object.entries(files)) {
      if (this.fileManager.fileExists(filePath)) {
        console.log(`✔️   Найден ${name}`);
      } else {
        console.log(`❌ ${name} не найден: ${filePath}`);
        
        if (name === 'createWindowJs') {
          console.log('🔍 Поиск альтернативных путей для createWindow...');
          this.findAlternativePaths(buildModdedDir, 'createWindow');
        }
        
        console.log(`⚠️  Пропускаем патчинг из-за отсутствия ${name}`);
        return;
      }
    }

    const rootPackageJson = path.join(this.projectRoot, 'package.json');
    this.configPatcher.patchPackageJson(files.packageJson, rootPackageJson);
    this.configPatcher.enableDevTools(files.configJs);
    this.configPatcher.patchSystemMenu(files.systemMenuJs);
    this.configPatcher.patchCreateWindow(files.createWindowJs);
  }


  private injectModCode(buildModdedDir: string): void {
    const mainJsPath = path.join(buildModdedDir, 'main', 'index.js');
    const preloadJsPath = path.join(buildModdedDir, 'main', 'lib', 'preload.js');
    const modMainPath = path.join(this.projectRoot, 'src', 'mod', 'main.js');
    const modPreloadPath = path.join(this.projectRoot, 'src', 'mod', 'preload.ts');

    this.codeInjector.injectAnalyticsBlocker(mainJsPath);
    this.codeInjector.injectModCode(mainJsPath, preloadJsPath, modMainPath, modPreloadPath);
  }

  private removeSplashScreen(buildModdedDir: string): void {
    const splashScreenPath = path.join(buildModdedDir, 'app', 'media', 'splash_screen');
    this.fileManager.removeDirectory(splashScreenPath);
  }

  private findAlternativePaths(buildModdedDir: string, fileName: string): void {
    try {
      const allFiles = this.fileManager.getAllFiles(buildModdedDir);
      const matchingFiles = allFiles.filter(file => 
        file.toLowerCase().includes(fileName.toLowerCase()) && file.endsWith('.js')
      );
      
      console.log(`📁 Найденные файлы содержащие "${fileName}":`);
      matchingFiles.forEach(file => {
        console.log(`  - ${file}`);
      });
      
      if (matchingFiles.length === 0) {
        console.log('📁 Все .js файлы в main/lib/:');
        const mainLibFiles = allFiles.filter(file => 
          file.includes('main/lib/') && file.endsWith('.js')
        );
        mainLibFiles.forEach(file => {
          console.log(`  - ${file}`);
        });
      }
    } catch (error) {
      console.log(`❌ Ошибка поиска: ${error}`);
    }
  }

}

