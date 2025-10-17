"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repositoryMetaUpdatedAt = exports.tracksAvailabilityUpdatedAt = exports.getDeviceId = exports.deviceId = exports.getUuid = exports.isRevisionChanged = exports.isFirstLaunch = exports.needToShowReleaseNotes = exports.useCachedValue = void 0;
const uuid_1 = require("uuid");
const semver_1 = require("semver");
const electron_1 = require("electron");
const electron_store_1 = __importDefault(require("electron-store"));
const generateDeviceId_js_1 = require("./generateDeviceId.js");
const store_js_1 = require("../types/store.js");
const config_js_1 = require("../config.js");
const store = new electron_store_1.default();
const useCachedValue = (key) => {
    let cachedValue = null;
    const get = () => {
        if (cachedValue) {
            return cachedValue;
        }
        cachedValue = store.get(key);
        return cachedValue;
    };
    const set = (value) => {
        cachedValue = value;
        store.set(key, value);
    };
    return [get, set];
};
exports.useCachedValue = useCachedValue;
const needToShowReleaseNotes = () => {
    const currentVersion = electron_1.app.getVersion();
    const storeVersion = String(store.get(store_js_1.StoreKeys.VERSION));
    store.set(store_js_1.StoreKeys.VERSION, currentVersion);
    if (!(0, semver_1.valid)(storeVersion) || (0, semver_1.gt)(currentVersion, storeVersion)) {
        if (config_js_1.config.common.SHOW_RELEASE_NOTES) {
            return true;
        }
    }
    return false;
};
exports.needToShowReleaseNotes = needToShowReleaseNotes;
const isFirstLaunch = () => {
    const storeVersion = store.get(store_js_1.StoreKeys.VERSION);
    const hasRecentlyLaunched = Boolean(store.get(store_js_1.StoreKeys.HAS_RECENTLY_LAUNCHED));
    if (storeVersion) {
        store.set(store_js_1.StoreKeys.HAS_RECENTLY_LAUNCHED, true);
        return false;
    }
    if (!hasRecentlyLaunched) {
        store.set(store_js_1.StoreKeys.HAS_RECENTLY_LAUNCHED, true);
    }
    return !hasRecentlyLaunched;
};
exports.isFirstLaunch = isFirstLaunch;
const isRevisionChanged = (type, revision) => {
    const storeRevision = store.get(type);
    store.set(type, revision);
    return storeRevision !== revision;
};
exports.isRevisionChanged = isRevisionChanged;
const getUuid = () => {
    let uuid = store.get(store_js_1.StoreKeys.UUID);
    if (!uuid) {
        uuid = (0, uuid_1.v4)();
        store.set(store_js_1.StoreKeys.UUID, uuid);
    }
    return uuid;
};
exports.getUuid = getUuid;
exports.deviceId = (0, exports.useCachedValue)(store_js_1.StoreKeys.DEVICE_ID);
const getDeviceId = () => {
    const [get, set] = exports.deviceId;
    let deviceIdValue = get();
    if (deviceIdValue) {
        return String(deviceIdValue);
    }
    deviceIdValue = (0, generateDeviceId_js_1.generateDeviceId)();
    set(deviceIdValue);
    return String(deviceIdValue);
};
exports.getDeviceId = getDeviceId;
exports.tracksAvailabilityUpdatedAt = (0, exports.useCachedValue)(store_js_1.StoreKeys.TRACKS_AVAILABILITY_UPDATED_AT);
exports.repositoryMetaUpdatedAt = (0, exports.useCachedValue)(store_js_1.StoreKeys.REPOSITORY_META_UPDATED_AT);
