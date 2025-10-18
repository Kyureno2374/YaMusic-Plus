import { FileManager } from '../core/file-manager';

export class ConfigPatcher {
  constructor(private fileManager: FileManager) {}

  patchPackageJson(packageJsonPath: string, rootPackageJsonPath: string): void {
    const pkg = this.fileManager.readJSON<any>(packageJsonPath);
    const rootPkg = this.fileManager.readJSON<any>(rootPackageJsonPath);

    const bannedDependencies = ['@yandex-chats/signer'];
    
    pkg.dependencies = this.filterDependencies(pkg.dependencies, bannedDependencies);
    pkg.devDependencies = this.filterDependencies(pkg.devDependencies, bannedDependencies);

    pkg.common.REFRESH_EVENT_TRIGGER_TIME_MS = 999_999_999;
    pkg.common.UPDATE_POLL_INTERVAL_MS = 999_999_999;
    pkg.common.SUPPORT_URL = '<empty>';
    
    pkg.name = 'YaMusic-Plus';
    pkg.author = 'Kyureno';
    pkg.meta.PRODUCT_NAME = 'YaMusic Plus';
    pkg.meta.PRODUCT_NAME_LOCALIZED = 'YaMusic Plus';
    pkg.meta.APP_ID = 'ru.yandex.desktop.music.plus';
    pkg.meta.COPYRIGHT = 'Kyureno';
    pkg.meta.TRADEMARK = 'Kyureno';
    
    pkg.appConfig.enableDevTools = true;
    pkg.appConfig.enableAutoUpdate = false;
    pkg.appConfig.enableUpdateByProbability = false;
    pkg.appConfig.systemDefaultLanguage = 'ru';

    pkg.scripts = {
      start: 'electron .',
      dev: 'electron . --dev'
    };

    this.mergeDependencies(pkg, rootPkg);
    this.fileManager.writeJSON(packageJsonPath, pkg);
  }

  enableDevTools(configJsPath: string): void {
    let content = this.fileManager.readFile(configJsPath);
    
    content = content
      .replaceAll('enableDevTools: false', 'enableDevTools: true')
      .replaceAll('enableDevTools:false', 'enableDevTools: true')
      .replaceAll('enableAutoUpdate: true', 'enableAutoUpdate: false')
      .replaceAll('enableAutoUpdate:true', 'enableAutoUpdate: false');

    this.fileManager.writeFile(configJsPath, content);
  }

  patchSystemMenu(systemMenuJsPath: string): void {
    const settingsCode = `
    const fs = require("fs");
    const path = require("path");
    const electron = require("electron");
    const appFolder = electron.app.getPath("userData");
    const settingsFilePath = path.join(appFolder, "mod_settings.json");
    let enableSystemToolbar = false;
    try {
      enableSystemToolbar = JSON.parse(fs.readFileSync(settingsFilePath, "utf8"))["devtools/systemToolbar"];
    } catch (e) {}
    `;

    let content = this.fileManager.readFile(systemMenuJsPath);
    content = settingsCode + content.replaceAll(
      'deviceInfo_js_1.devicePlatform === platform_js_1.Platform.MACOS',
      'enableSystemToolbar'
    );

    this.fileManager.writeFile(systemMenuJsPath, content);
  }

  patchCreateWindow(createWindowJsPath: string): void {
    const settingsCode = `
    const fs = require("fs");
    const path = require("path");
    const electron = require("electron");
    const appFolder = electron.app.getPath("userData");
    const settingsFilePath = path.join(appFolder, "mod_settings.json");
    let enableSystemToolbar = false;
    try {
      enableSystemToolbar = JSON.parse(fs.readFileSync(settingsFilePath, "utf8"))["devtools/systemToolbar"];
    } catch (e) {}
    `;

    let content = this.fileManager.readFile(createWindowJsPath);
    
    content = settingsCode + content
      .replaceAll('config_js_1.config.app.enableDevTools', 'true')
      .replaceAll("titleBarStyle: 'hidden'", "titleBarStyle: !enableSystemToolbar && 'hidden'")
      .replaceAll("titleBarStyle:'hidden'", "titleBarStyle: !enableSystemToolbar && 'hidden'")
      .replaceAll('minWidth: 768', 'minWidth: 360')
      .replaceAll('minHeight: 650', 'minHeight: 550')
      .replaceAll('show: false', 'show: true');

    this.fileManager.writeFile(createWindowJsPath, content);
  }

  private filterDependencies(deps: Record<string, string>, banned: string[]): Record<string, string> {
    if (!deps) return {};
    
    return Object.fromEntries(
      Object.entries(deps).filter(([key]) => !banned.includes(key))
    );
  }

  private mergeDependencies(targetPkg: any, sourcePkg: any): void {
    if (!targetPkg.dependencies) targetPkg.dependencies = {};
    if (!targetPkg.devDependencies) targetPkg.devDependencies = {};

    Object.assign(targetPkg.dependencies, sourcePkg.dependencies);
    Object.assign(targetPkg.devDependencies, sourcePkg.devDependencies);
  }
}

