import { FileManager } from '../core/file-manager';
import path from 'path';

export class CodeInjector {
  constructor(private fileManager: FileManager) {}

  injectModCode(mainJsPath: string, preloadJsPath: string, modMainPath: string, modPreloadPath: string): void {
    const mainContent = this.fileManager.readFile(mainJsPath);
    const preloadContent = this.fileManager.readFile(preloadJsPath);
    const modMainContent = this.fileManager.readFile(modMainPath);
    const modPreloadContent = this.fileManager.readFile(modPreloadPath);

    const patchedMain = mainContent + `\n\n(async () => { ${modMainContent} })();`;
    const patchedPreload = preloadContent + `\n\n(async () => { ${modPreloadContent} })();`;

    this.fileManager.writeFile(mainJsPath, patchedMain);
    this.fileManager.writeFile(preloadJsPath, patchedPreload);
  }

  injectAnalyticsBlocker(mainJsPath: string): void {
    const blockedUrls = [
      'https://yandex.ru/clck/*',
      'https://mc.yandex.ru/*',
      'https://api.music.yandex.net/dynamic-pages/trigger/*',
      'https://log.strm.yandex.ru/*',
      'https://api.acquisition-gwe.plus.yandex.net/*',
      'https://api.events.plus.yandex.net/*',
      'https://events.plus.yandex.net/*',
      'https://plus.yandex.net/*',
      'https://yandex.ru/ads/*',
      'https://strm.yandex.ru/ping',
    ];

    const blockerCode = `
      const { session } = require("electron");
      session.defaultSession.webRequest.onBeforeRequest(
        { urls: ${JSON.stringify(blockedUrls)} },
        (details, callback) => {
          callback({ cancel: true });
        }
      );

      session.defaultSession.webRequest.onBeforeSendHeaders(
        { urls: ["https://api.music.yandex.net/*"] },
        (details, callback) => {
          const bannedHeaders = ["x-yandex-music-device", "x-request-id"];
          bannedHeaders.forEach((header) => {
            details.requestHeaders[header] = undefined;
          });
          callback({ requestHeaders: details.requestHeaders });
        }
      );
    `;

    let content = this.fileManager.readFile(mainJsPath);
    content = content.replaceAll('createWindow)();', `createWindow)();${blockerCode}`);
    this.fileManager.writeFile(mainJsPath, content);
  }

  injectUIScripts(buildModdedDir: string, modCompiledDir: string): void {
    const appPath = path.join(buildModdedDir, 'app');
    const modRendererPath = path.join(buildModdedDir, 'app', 'yandexMusicMod', 'renderer.js');

    this.fileManager.copyDirectory(modCompiledDir, path.join(buildModdedDir, 'app', 'yandexMusicMod'));

    let rendererContent = this.fileManager.readFile(modRendererPath);
    rendererContent = `(function () {\n${rendererContent}\n})()`;
    this.fileManager.writeFile(modRendererPath, rendererContent);

    const htmlFiles = this.fileManager.getAllFiles(appPath, '.html');

    for (const htmlFile of htmlFiles) {
      const fullHtmlPath = path.join(appPath, htmlFile);
      const htmlContent = this.fileManager.readFile(fullHtmlPath);
      
      const patchedHtml = htmlContent.replace(
        '<head>',
        `<head><script src="/yandexMusicMod/renderer.js"></script>
        <link rel="stylesheet" href="/yandexMusicMod/renderer.css">`
      );

      this.fileManager.writeFile(fullHtmlPath, patchedHtml);
    }
  }
}

