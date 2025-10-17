"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRefreshRepositoryMeta = exports.sendRefreshTracksAvailability = exports.sendAnalyticsOnFirstLaunch = exports.sendOpenDeeplink = exports.sendPlayerAction = exports.sendRefreshApplicationData = exports.sendUpdateAvailable = exports.sendLoadReleaseNotes = exports.sendProbabilityBucket = exports.handleApplicationEvents = void 0;
const electron_1 = require("electron");
const events_js_1 = require("./types/events.js");
const cookies_js_1 = require("./constants/cookies.js");
const Logger_js_1 = require("./packages/logger/Logger.js");
const updater_js_1 = require("./lib/updater.js");
const tray_js_1 = require("./lib/tray.js");
const appSuspension_js_1 = require("./lib/appSuspension.js");
const store_js_1 = require("./lib/store.js");
const state_js_1 = require("./lib/state.js");
const toggleWindowVisibility_js_1 = require("./lib/window/toggleWindowVisibility.js");
const toggleMaximize_js_1 = require("./lib/window/toggleMaximize.js");
const minimize_js_1 = require("./lib/window/minimize.js");
const handleDeeplink_js_1 = require("./lib/handlers/handleDeeplink.js");
const loadReleaseNotes_js_1 = require("./lib/loadReleaseNotes.js");
const deviceInfo_js_1 = require("./lib/deviceInfo.js");
const platform_js_1 = require("./types/platform.js");
const config_js_1 = require("./config.js");
const getSortedDescReleaseNotesKeys_js_1 = require("./lib/releaseNotes/getSortedDescReleaseNotesKeys.js");
const removeNewerReleaseNotes_js_1 = require("./lib/releaseNotes/removeNewerReleaseNotes.js");
const formatters_js_1 = require("./lib/i18n/formatters.js");
const stringToAST_js_1 = require("./lib/i18n/stringToAST.js");
const gt_js_1 = __importDefault(require("semver/functions/gt.js"));
const valid_js_1 = __importDefault(require("semver/functions/valid.js"));
const i18nKeys_js_1 = require("./constants/i18nKeys.js");
const dateToDDMonthYYYYProps_js_1 = require("./lib/date/dateToDDMonthYYYYProps.js");
const eventsLogger = new Logger_js_1.Logger('Events');
const isBoolean = (value) => {
    return typeof value === 'boolean';
};
const handleApplicationEvents = (window) => {
    const updater = (0, updater_js_1.getUpdater)();
    electron_1.ipcMain.on(events_js_1.Events.WINDOW_MINIMIZE, () => {
        eventsLogger.info('Event received', events_js_1.Events.WINDOW_MINIMIZE);
        (0, minimize_js_1.minimize)(window);
    });
    electron_1.ipcMain.on(events_js_1.Events.WINDOW_MAXIMIZE, () => {
        eventsLogger.info('Event received', events_js_1.Events.WINDOW_MAXIMIZE);
        (0, toggleMaximize_js_1.toggleMaximize)(window);
    });
    electron_1.ipcMain.on(events_js_1.Events.WINDOW_CLOSE, () => {
        eventsLogger.info('Event received', events_js_1.Events.WINDOW_CLOSE);
        if ([platform_js_1.Platform.WINDOWS, platform_js_1.Platform.LINUX].includes(deviceInfo_js_1.devicePlatform)) {
            if (state_js_1.state.player.isPlaying) {
                (0, toggleWindowVisibility_js_1.toggleWindowVisibility)(window, false);
            }
            else {
                electron_1.app.quit();
            }
        }
        else {
            electron_1.app.quit();
        }
    });
    electron_1.ipcMain.on(events_js_1.Events.INSTALL_UPDATE, () => {
        eventsLogger.info('Event received', events_js_1.Events.INSTALL_UPDATE);
        updater.install();
    });
    electron_1.ipcMain.on(events_js_1.Events.APPLICATION_READY, async (event, language) => {
        eventsLogger.info('Event received', events_js_1.Events.APPLICATION_READY);
        (0, deviceInfo_js_1.logHardwareInfo)();
        if (state_js_1.state.deeplink) {
            (0, handleDeeplink_js_1.navigateToDeeplink)(window, state_js_1.state.deeplink);
        }
        if (updater.latestAvailableVersion) {
            (0, exports.sendUpdateAvailable)(window, updater.latestAvailableVersion);
        }
        if ((0, store_js_1.isFirstLaunch)()) {
            (0, exports.sendAnalyticsOnFirstLaunch)(window);
        }
        (0, exports.sendProbabilityBucket)(window, updater.getProbabilityBucket());
        const version = electron_1.app.getVersion();
        const releaseNotes = await (0, loadReleaseNotes_js_1.loadReleaseNotes)(language);
        if (!releaseNotes) {
            return;
        }
        const { [`${i18nKeys_js_1.KEY_DESKTOP_RELEASE_NOTES_DEFAULT}`]: defaultReleaseNote, ...otherNotes } = releaseNotes;
        let translationsReleaseNotes = (0, removeNewerReleaseNotes_js_1.removeNewerReleaseNotes)(otherNotes, version);
        const sortedDescReleaseNotesKeys = (0, getSortedDescReleaseNotesKeys_js_1.getSortedDescReleaseNotesKeys)(translationsReleaseNotes);
        const latestVersion = sortedDescReleaseNotesKeys[0];
        if (!latestVersion) {
            return;
        }
        const extractedVersion = (0, getSortedDescReleaseNotesKeys_js_1.extractVersion)(latestVersion);
        if ((0, valid_js_1.default)(extractedVersion) &&
            (0, valid_js_1.default)(version) &&
            (0, gt_js_1.default)(version, extractedVersion) &&
            Array.isArray(defaultReleaseNote)) {
            const dateString = `<date>${(0, formatters_js_1.formatDate)({
                date: config_js_1.config.buildInfo.BUILD_TIME,
                options: (0, dateToDDMonthYYYYProps_js_1.dateToDDMonthYYYYProps)(),
                language
            })}</date>\n`;
            const dateAST = (0, stringToAST_js_1.stringToAST)(dateString);
            translationsReleaseNotes = {
                ...translationsReleaseNotes,
                [`${i18nKeys_js_1.RELEASE_NOTES_KEY_PREFIX}${version}`]: [...dateAST, ...defaultReleaseNote]
            };
            sortedDescReleaseNotesKeys.unshift(`${i18nKeys_js_1.RELEASE_NOTES_KEY_PREFIX}${version}`);
        }
        (0, exports.sendLoadReleaseNotes)({
            window,
            needToShowReleaseNotes: (0, store_js_1.needToShowReleaseNotes)(),
            sortedDescReleaseNotesKeys,
            translationsReleaseNotes
        });
    });
    electron_1.ipcMain.on(events_js_1.Events.APPLICATION_THEME, (event, backgroundColor) => {
        eventsLogger.info('Event received', events_js_1.Events.APPLICATION_THEME);
        window.setBackgroundColor(backgroundColor);
    });
    electron_1.ipcMain.on(events_js_1.Events.TRACKS_AVAILABILITY_UPDATED, (event) => {
        const [, setTracksAvailabilityUpdatedAt] = store_js_1.tracksAvailabilityUpdatedAt;
        eventsLogger.info('Event received', events_js_1.Events.TRACKS_AVAILABILITY_UPDATED);
        setTracksAvailabilityUpdatedAt(Date.now());
    });
    electron_1.ipcMain.on(events_js_1.Events.REPOSITORY_META_UPDATED, (event) => {
        const [, setRepositoryMetaUpdatedAtStoreValue] = store_js_1.repositoryMetaUpdatedAt;
        eventsLogger.info('Event received', events_js_1.Events.REPOSITORY_META_UPDATED);
        setRepositoryMetaUpdatedAtStoreValue(Date.now());
    });
    electron_1.ipcMain.on(events_js_1.Events.PLAYER_STATE, (event, { isPlaying, canMoveBackward, canMoveForward }) => {
        eventsLogger.info(`Event received`, events_js_1.Events.PLAYER_STATE, isPlaying, canMoveBackward, canMoveForward);
        if (isBoolean(isPlaying)) {
            state_js_1.state.player.isPlaying = isPlaying;
            (0, appSuspension_js_1.toggleAppSuspension)(isPlaying);
        }
        if (isBoolean(canMoveBackward)) {
            state_js_1.state.player.canMoveBackward = canMoveBackward;
        }
        if (isBoolean(canMoveForward)) {
            state_js_1.state.player.canMoveForward = canMoveForward;
        }
        (0, tray_js_1.updateTrayMenu)(window);
    });
    electron_1.ipcMain.handle(events_js_1.Events.GET_PASSPORT_LOGIN, async () => {
        eventsLogger.info('Event handle', events_js_1.Events.GET_PASSPORT_LOGIN);
        try {
            const cookie = await electron_1.session.defaultSession.cookies.get({
                name: cookies_js_1.PASSPORT_LOGIN,
                domain: cookies_js_1.PASSPORT_LOGIN_DOMAIN
            });
            return cookie?.[0]?.value;
        }
        catch (error) {
            eventsLogger.error(`${events_js_1.Events.GET_PASSPORT_LOGIN} event failed.`, error);
            return;
        }
    });
    electron_1.ipcMain.handle(events_js_1.Events.GET_YANDEX_UID, async () => {
        eventsLogger.info('Event handle', events_js_1.Events.GET_YANDEX_UID);
        try {
            const cookie = await electron_1.session.defaultSession.cookies.get({
                name: cookies_js_1.YANDEX_ID,
                domain: cookies_js_1.PASSPORT_LOGIN_DOMAIN
            });
            return cookie?.[0]?.value;
        }
        catch (error) {
            eventsLogger.error(`${events_js_1.Events.GET_YANDEX_UID} event failed.`, error);
            return;
        }
    });
};
exports.handleApplicationEvents = handleApplicationEvents;
const sendProbabilityBucket = (window, bucket) => {
    window.webContents.send(events_js_1.Events.PROBABILITY_BUCKET, bucket);
    eventsLogger.info('Event sent', events_js_1.Events.PROBABILITY_BUCKET, bucket);
};
exports.sendProbabilityBucket = sendProbabilityBucket;
const sendLoadReleaseNotes = ({ window, needToShowReleaseNotes, sortedDescReleaseNotesKeys, translationsReleaseNotes }) => {
    window.webContents.send(events_js_1.Events.LOAD_RELEASE_NOTES, {
        needToShowReleaseNotes,
        sortedDescReleaseNotesKeys,
        translationsReleaseNotes
    });
    eventsLogger.info('Event sent', events_js_1.Events.LOAD_RELEASE_NOTES);
};
exports.sendLoadReleaseNotes = sendLoadReleaseNotes;
const sendUpdateAvailable = (window, version) => {
    window.webContents.send(events_js_1.Events.UPDATE_AVAILABLE, version);
    eventsLogger.info('Event sent', events_js_1.Events.UPDATE_AVAILABLE, version);
};
exports.sendUpdateAvailable = sendUpdateAvailable;
const sendRefreshApplicationData = (window) => {
    window.webContents.send(events_js_1.Events.REFRESH_APPLICATION_DATA);
    eventsLogger.info('Event sent', events_js_1.Events.REFRESH_APPLICATION_DATA);
};
exports.sendRefreshApplicationData = sendRefreshApplicationData;
const sendPlayerAction = (window, action) => {
    window.webContents.send(events_js_1.Events.PLAYER_ACTION, action);
    eventsLogger.info('Event sent', events_js_1.Events.PLAYER_ACTION, action);
};
exports.sendPlayerAction = sendPlayerAction;
const sendOpenDeeplink = (window, pathname) => {
    window.webContents.send(events_js_1.Events.OPEN_DEEPLINK, pathname);
    eventsLogger.info('Event sent', events_js_1.Events.OPEN_DEEPLINK);
};
exports.sendOpenDeeplink = sendOpenDeeplink;
const sendAnalyticsOnFirstLaunch = (window) => {
    window.webContents.send(events_js_1.Events.FIRST_LAUNCH);
    eventsLogger.info('Event send', events_js_1.Events.FIRST_LAUNCH);
};
exports.sendAnalyticsOnFirstLaunch = sendAnalyticsOnFirstLaunch;
const sendRefreshTracksAvailability = (window) => {
    window.webContents.send(events_js_1.Events.REFRESH_TRACKS_AVAILABILITY);
    eventsLogger.info('Event sent', events_js_1.Events.REFRESH_TRACKS_AVAILABILITY);
};
exports.sendRefreshTracksAvailability = sendRefreshTracksAvailability;
const sendRefreshRepositoryMeta = (window) => {
    window.webContents.send(events_js_1.Events.REFRESH_REPOSITORY_META);
    eventsLogger.info('Event send', events_js_1.Events.REFRESH_REPOSITORY_META);
};
exports.sendRefreshRepositoryMeta = sendRefreshRepositoryMeta;
