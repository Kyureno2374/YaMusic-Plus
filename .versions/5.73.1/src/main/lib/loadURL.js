"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUnavailableErrorPage = exports.loadURL = void 0;
const loader_js_1 = require("./loader.js");
const config_js_1 = require("../config.js");
const loadUrlInWindow = (0, loader_js_1.loader)({
    protocol: config_js_1.config.app.appProtocol,
    hostname: config_js_1.config.app.appHostname,
    buildPath: config_js_1.config.app.buildPath,
    bypassCSP: config_js_1.config.app.bypassCSP,
    isCorsEnabled: config_js_1.config.app.enableWebSecurity
});
const loadURL = async (window) => {
    await loadUrlInWindow(window);
};
exports.loadURL = loadURL;
const loadUnavailableErrorPage = async (window) => {
    await loadUrlInWindow(window, 'unavailable.html');
};
exports.loadUnavailableErrorPage = loadUnavailableErrorPage;
