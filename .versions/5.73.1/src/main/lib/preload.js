"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const config_js_1 = require("../config.js");
const getInitialTheme_js_1 = require("./getInitialTheme.js");
const deviceInfo_js_1 = require("./deviceInfo.js");
const theme_js_1 = require("../types/theme.js");
const hostnamePatterns_js_1 = require("../constants/hostnamePatterns.js");
const deviceInfo = (0, deviceInfo_js_1.getDeviceInfo)();
electron_1.contextBridge.exposeInMainWorld('VERSION', String(config_js_1.config.buildInfo.VERSION));
electron_1.contextBridge.exposeInMainWorld('BRANCH', String(config_js_1.config.buildInfo.BRANCH));
electron_1.contextBridge.exposeInMainWorld('PLATFORM', deviceInfo.os);
electron_1.contextBridge.exposeInMainWorld('DEVICE_INFO', deviceInfo);
electron_1.contextBridge.exposeInMainWorld('DEVICE_HOSTNAME', (0, deviceInfo_js_1.getDeviceHostname)());
electron_1.contextBridge.exposeInMainWorld('desktopEvents', {
    send(name, ...args) {
        electron_1.ipcRenderer.send(name, ...args);
    },
    on(name, listener) {
        electron_1.ipcRenderer.on(name, listener);
    },
    off(name, listener) {
        electron_1.ipcRenderer.off(name, listener);
    },
    invoke(name, ...args) {
        return electron_1.ipcRenderer.invoke(name, ...args);
    }
});
window.document.addEventListener('DOMContentLoaded', () => {
    const theme = (0, getInitialTheme_js_1.getInitialTheme)();
    if (hostnamePatterns_js_1.applicationHostnamePattern.test(window.location.hostname)) {
        window.document.documentElement.style.backgroundColor = theme === theme_js_1.Theme.Light ? '#FFFFFF' : '#000000';
    }
});
