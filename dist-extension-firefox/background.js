//#region src/constants/performance.ts
/**
* Performance-tuning constants, centralized for easy adjustment.
* All values have been extracted from their original modules.
*/
/** Download timeout in milliseconds — aligned with the background SW 5-minute timeout */
var DOWNLOAD_TIMEOUT_MS = 3e5;
//#endregion
//#region src/platform/chrome-runtime.ts
var browserApi = globalThis.browser ?? globalThis.chrome;
//#endregion
//#region src/shared/logging/logger.ts
var BASE_PREFIX = "[XEG]";
var noop = () => {};
var createErrorOnlyLogger = (prefix) => ({
	info: noop,
	debug: noop,
	trace: noop,
	warn: (...args) => {
		console.warn(prefix, ...args);
	},
	error: (...args) => {
		console.error(prefix, ...args);
	}
});
function buildLogger(prefix) {
	return createErrorOnlyLogger(prefix);
}
function createLogger(arg = {}) {
	return buildLogger((typeof arg === "string" ? { prefix: `[${arg}]` } : arg).prefix ?? BASE_PREFIX);
}
createLogger();
//#endregion
//#region src/constants/media.ts
/** @fileoverview Media-related constants for X.com media handling. */
var MEDIA_HOSTS = { MEDIA_CDN: ["pbs.twimg.com", "video.twimg.com"] };
var MEDIA = {
	DOMAINS: [...MEDIA_HOSTS.MEDIA_CDN, "abs.twimg.com"],
	HOSTS: MEDIA_HOSTS,
	TYPES: {
		IMAGE: "image",
		VIDEO: "video",
		GIF: "gif"
	},
	EXTENSIONS: {
		JPEG: "jpg",
		PNG: "png",
		WEBP: "webp",
		GIF: "gif",
		MP4: "mp4",
		ZIP: "zip"
	}
};
//#endregion
//#region src/shared/utils/url/host.ts
/** Reserved Twitter/X.com paths that are not usernames */
var RESERVED_TWITTER_PATHS_ARRAY = Object.freeze([
	"home",
	"explore",
	"notifications",
	"messages",
	"search",
	"settings",
	"i",
	"intent",
	"compose",
	"hashtag"
]);
new Set(RESERVED_TWITTER_PATHS_ARRAY);
/** Trusted Twitter/X.com hosts */
var TWITTER_HOSTS = Object.freeze(["twitter.com", "x.com"]);
//#endregion
//#region src/shared/utils/url/url-safety.ts
/**
* @fileoverview Centralized SSRF-prevention URL whitelist.
*
* Single source of truth for ALLOWED_HOSTS so that both the MV3 background
* SW and the GM HTTP request adapter enforce the same policy. Never
* independently maintain a duplicate host list elsewhere.
*/
/**
* Canonical set of hostnames allowed for cross-origin requests.
* Shared by the MV3 background SW and the GM HTTP request adapter.
* Do NOT duplicate this set elsewhere — import it.
*/
var ALLOWED_HOSTS = /* @__PURE__ */ new Set([...TWITTER_HOSTS, ...MEDIA.DOMAINS]);
/**
* Validate that a URL targets an allowed host, with additional path-level
* restriction for Twitter hosts (only /i/api/ paths are permitted).
*
* DESIGN NOTE: Twitter/X hosts are restricted to /i/api/ paths because
* the download relay only handles media downloads (which use the API).
* Non-API URLs (e.g., https://twitter.com/some-tweet) are intentionally
* blocked. Media downloads from pbs.twimg.com and video.twimg.com always
* pass since those domains are in MEDIA.DOMAINS and bypass the path check.
* If non-API downloads from twitter.com/x.com are needed in the future,
* this path restriction must be relaxed or extended.
*
* @param url - The URL to validate
* @returns true if the URL is valid and its host is in the allowed whitelist
*          (with Twitter path restrictions applied)
*/
function isAllowedUrl(url) {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "https:") return false;
		if (parsed.port !== "" && parsed.port !== "443") return false;
		if (!ALLOWED_HOSTS.has(parsed.hostname)) return false;
		if (TWITTER_HOSTS.includes(parsed.hostname)) return parsed.pathname.startsWith("/i/api/");
		return true;
	} catch {
		return false;
	}
}
//#endregion
//#region src/extension/message-validation.ts
var MAX_FILENAME_LENGTH = 255;
var MAX_TEXT_LENGTH = 4096;
var PAGE_ORIGINS = /* @__PURE__ */ new Set(["https://x.com", "https://twitter.com"]);
function isRecord(value) {
	return typeof value === "object" && value !== null;
}
function isSafeText(value, maxLength = MAX_TEXT_LENGTH, allowNewlines = false) {
	const controlCharacters = allowNewlines ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
	return typeof value === "string" && value.length > 0 && value.length <= maxLength && !controlCharacters.test(value);
}
function isSafeFilename(value) {
	if (!isSafeText(value, MAX_FILENAME_LENGTH)) return false;
	if (value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value)) return false;
	return !value.split(/[\\/]/).some((segment) => segment === "..");
}
function isSafeHeaders(value) {
	if (value === void 0) return true;
	if (!isRecord(value)) return false;
	return Object.entries(value).every(([name, headerValue]) => isSafeText(name, 128) && isSafeText(headerValue, 2048) && !/[\r\n]/.test(name + headerValue));
}
function isPageBlobUrl(value) {
	if (typeof value !== "string" || value.length > MAX_TEXT_LENGTH) return false;
	try {
		const url = new URL(value);
		return url.protocol === "blob:" && PAGE_ORIGINS.has(url.origin) && url.pathname.length > 1;
	} catch {
		return false;
	}
}
function isSafeNotificationImage(value) {
	if (!isSafeText(value, MAX_TEXT_LENGTH)) return false;
	if (value.startsWith("icons/")) return !value.split("/").some((segment) => segment === "..");
	return isAllowedUrl(value);
}
function isValidIncomingMessage(message) {
	if (!isRecord(message) || typeof message.type !== "string" || !isRecord(message.payload)) return false;
	switch (message.type) {
		case "DOWNLOAD_REQUEST": {
			const payload = message.payload;
			return typeof payload.url === "string" && isAllowedUrl(payload.url) && isSafeFilename(payload.filename) && isSafeHeaders(payload.headers);
		}
		case "DOWNLOAD_BLOB_URL_REQUEST": {
			const payload = message.payload;
			return isPageBlobUrl(payload.objectUrl) && isSafeFilename(payload.filename) && (payload.mimeType === void 0 || typeof payload.mimeType === "string" && /^[A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+$/.test(payload.mimeType) && payload.mimeType.length <= 128);
		}
		case "SHOW_NOTIFICATION": {
			const payload = message.payload;
			return isSafeText(payload.id, 128) && isSafeText(payload.title) && isSafeText(payload.message, MAX_TEXT_LENGTH, true) && (payload.imageUrl === void 0 || isSafeNotificationImage(payload.imageUrl));
		}
		default: return false;
	}
}
//#endregion
//#region src/extension/background.ts
/**
* MV3 Extension — Background Service Worker
*
* Handles operations that require extension permissions unavailable
* in content scripts:
* - chrome.downloads.download() for file downloads
* - chrome.notifications.create() for desktop notifications
*
* Architecture notes — FEATURE AWARENESS:
* The background SW is intentionally STATELESS and features-limited.
* It knows only about downloads and notifications.
* All gallery state, media extraction, settings, theme, language/i18n,
* and DOM access live exclusively in the content script. If a new feature
* needs SW privileges (clipboard, printing, native messaging), extend the
* message protocol in extension-message-types.ts.
*
* Content scripts send messages here and receive progress/completion updates.
*/
var log = createLogger("SW");
/**
* Safely execute an async message handler, ensuring sendResponse is always
* called — even if the handler throws synchronously before returning a promise.
* Without this guard, a synchronous throw would prevent .then() from executing,
* leaving the message channel open indefinitely and causing the content script
* to hang.
*
* Errors are always returned in the standard ExtensionMessageResponse shape
* so the content script always receives a structured error, never a thrown
* exception or unexpected type.
*/
function respondAsync(handler, sendResponse) {
	try {
		handler().then((result) => sendResponse(result), (error) => sendResponse(toErrorResponse(error)));
	} catch (error) {
		sendResponse(toErrorResponse(error));
	}
}
/**
* Convert an unknown error to a structured ExtensionMessageResponse,
* preserving the error message regardless of the error's type.
*/
function toErrorResponse(error) {
	return {
		success: false,
		error: error instanceof Error ? error.message : String(error)
	};
}
browserApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (_sender.id !== browserApi.runtime.id) {
		sendResponse(toErrorResponse(/* @__PURE__ */ new Error("Unauthorized sender")));
		return false;
	}
	if (!isValidIncomingMessage(message)) {
		sendResponse(toErrorResponse(/* @__PURE__ */ new Error("Unknown message type")));
		return false;
	}
	const msg = message;
	switch (msg.type) {
		case "DOWNLOAD_REQUEST":
			respondAsync(() => handleDownloadRequest(msg).then(() => ({ success: true })), sendResponse);
			return true;
		case "DOWNLOAD_BLOB_URL_REQUEST":
			respondAsync(() => handleDownloadBlobUrlRequest(msg).then(() => ({ success: true })), sendResponse);
			return true;
		case "SHOW_NOTIFICATION":
			handleShowNotification(msg.payload);
			sendResponse({ success: true });
			return false;
		default:
			sendResponse(toErrorResponse(/* @__PURE__ */ new Error("Unknown message type")));
			return false;
	}
});
async function handleDownloadRequest(message) {
	const { url, filename, headers } = message.payload;
	if (!isAllowedUrl(url)) throw new Error(`URL not in allowed whitelist: ${url}`);
	const downloadOptions = {
		url,
		filename,
		saveAs: false
	};
	if (headers) downloadOptions.headers = Object.entries(headers).map(([name, value]) => ({
		name,
		value
	}));
	await waitForDownloadComplete(await browserApi.downloads.download(downloadOptions));
}
async function handleDownloadBlobUrlRequest(message) {
	const { objectUrl, filename } = message.payload;
	await waitForDownloadComplete(await browserApi.downloads.download({
		url: objectUrl,
		filename,
		saveAs: false
	}));
}
/**
* Wait for a Chrome download to complete or be interrupted.
*/
function waitForDownloadComplete(downloadId) {
	return new Promise((resolve, reject) => {
		let settled = false;
		let timerId = null;
		const cleanup = () => {
			browserApi.downloads.onChanged.removeListener(listener);
			if (timerId) clearTimeout(timerId);
		};
		const listener = (delta) => {
			if (delta.id !== downloadId) return;
			const stateCurrent = typeof delta.state === "string" ? delta.state : delta.state?.current;
			if (stateCurrent === "complete") {
				cleanup();
				settled = true;
				resolve();
			} else if (stateCurrent === "interrupted") {
				cleanup();
				settled = true;
				const errorCurrent = typeof delta.error === "string" ? delta.error : delta.error?.current;
				reject(/* @__PURE__ */ new Error(`Download interrupted: ${errorCurrent ?? "unknown"}`));
			}
		};
		browserApi.downloads.onChanged.addListener(listener);
		timerId = setTimeout(() => {
			if (!settled) {
				browserApi.downloads.onChanged.removeListener(listener);
				timerId = null;
				settled = true;
				reject(/* @__PURE__ */ new Error(`Download timed out after 5 minutes (id: ${downloadId})`));
			}
		}, DOWNLOAD_TIMEOUT_MS);
	});
}
/**
* Handle extension install/update events.
* Always logs in production (warn level) so operational issues are visible;
* dev mode uses finer detail via console.log.
*
* This is intentionally minimal — the SW is stateless, so no migration or
* state recovery is needed on update. If stateful features are added later,
* migrations belong here.
*/
browserApi.runtime.onInstalled.addListener((details) => {
	log.warn("sw.extension-event", {
		reason: details.reason,
		previousVersion: details.previousVersion ?? null
	});
});
/**
* Service worker startup handler.
* Logs SW wake-up for debugging extension lifecycle issues.
* MV3 service workers can be terminated after ~30s of inactivity,
* and this gives visibility into restart patterns.
*
* Currently a no-op in terms of state — the SW is stateless.
* If state persistence is added later (e.g., download queue recovery),
* the initialization logic belongs here.
*/
browserApi.runtime.onStartup?.addListener(() => {
	log.warn("sw.started");
});
/**
* Service worker suspend handler.
* Logs SW shutdown for debugging extension lifecycle issues.
*
* Currently a no-op — the SW is stateless so there's nothing to persist.
* If stateful features are added, this is where in-flight state should
* be snapshot before termination.
*/
browserApi.runtime.onSuspend?.addListener(() => {
	log.warn("sw.suspending");
});
function handleShowNotification(payload) {
	const { id, title, message, imageUrl } = payload;
	browserApi.notifications.create(id, {
		type: "basic",
		title,
		message,
		iconUrl: imageUrl ?? "icons/icon-128x128.png"
	});
}
//#endregion
