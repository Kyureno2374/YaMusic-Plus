
    const fs = require("fs");
    const path = require("path");
    const electron = require("electron");
    const appFolder = electron.app.getPath("userData");
    const settingsFilePath = path.join(appFolder, "mod_settings.json");
    let enableSystemToolbar = false;
    try {
      enableSystemToolbar = JSON.parse(fs.readFileSync(settingsFilePath, "utf8"))["devtools/systemToolbar"];
    } catch (e) {}
    "use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWindow = void 0;
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const config_js_1 = require("../../config.js");
const platform_js_1 = require("../../types/platform.js");
const deviceInfo_js_1 = require("../deviceInfo.js");
const toggleWindowVisibility_js_1 = require("./toggleWindowVisibility.js");
const createWindow = async () => {
    const window = new electron_1.BrowserWindow({
        show: true,
        center: true,
        frame: [platform_js_1.Platform.WINDOWS, platform_js_1.Platform.MACOS].includes(deviceInfo_js_1.devicePlatform),
        titleBarStyle: !enableSystemToolbar && 'hidden',
        trafficLightPosition: {
            x: 16,
            y: 10
        },
        minWidth: 360,
        minHeight: 550,
        width: 1280,
        height: 800,
        webPreferences: {
            devTools: true,
            webSecurity: config_js_1.config.app.enableWebSecurity,
            nodeIntegrationInWorker: true,
            nodeIntegration: false,
            contextIsolation: true,
            autoplayPolicy: 'no-user-gesture-required',
            preload: node_path_1.default.join(__dirname, '..', 'preload.js')
        }
    });
    window.once('ready-to-show', () => {
        (0, toggleWindowVisibility_js_1.toggleWindowVisibility)(window, true);
    });
    return window;
};
exports.createWindow = createWindow;
