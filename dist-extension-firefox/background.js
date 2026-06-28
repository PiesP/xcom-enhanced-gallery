//#region src/extension/background.ts
var ALLOWED_HOSTS = [
	"x.com",
	"twitter.com",
	"pbs.twimg.com",
	"video.twimg.com"
];
function isAllowedUrl(url) {
	try {
		const parsed = new URL(url);
		if (!ALLOWED_HOSTS.includes(parsed.hostname)) return false;
		if (parsed.hostname === "x.com" || parsed.hostname === "twitter.com") return parsed.pathname.startsWith("/i/api/");
		return true;
	} catch {
		return false;
	}
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (_sender.id !== chrome.runtime.id) {
		sendResponse({
			success: false,
			error: "Unauthorized sender"
		});
		return false;
	}
	const msg = message;
	switch (msg.type) {
		case "DOWNLOAD_REQUEST":
			handleDownloadRequest(msg).then(() => sendResponse({ success: true }), (error) => sendResponse({
				success: false,
				error: error.message
			}));
			return true;
		case "DOWNLOAD_BLOB_URL_REQUEST":
			handleDownloadBlobUrlRequest(msg).then(() => sendResponse({ success: true }), (error) => sendResponse({
				success: false,
				error: error.message
			}));
			return true;
		case "SHOW_NOTIFICATION":
			handleShowNotification(msg.payload);
			sendResponse({ success: true });
			return false;
		case "FETCH_REQUEST":
			handleFetchRequest(msg).then((result) => sendResponse({
				success: true,
				data: result
			}), (error) => sendResponse({
				success: false,
				error: error.message
			}));
			return true;
		default:
			sendResponse({
				success: false,
				error: "Unknown message type"
			});
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
	await waitForDownloadComplete(await chrome.downloads.download(downloadOptions));
}
async function handleDownloadBlobUrlRequest(message) {
	const { objectUrl, filename } = message.payload;
	await waitForDownloadComplete(await chrome.downloads.download({
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
			chrome.downloads.onChanged.removeListener(listener);
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
		chrome.downloads.onChanged.addListener(listener);
		timerId = setTimeout(() => {
			if (!settled) {
				chrome.downloads.onChanged.removeListener(listener);
				timerId = null;
				settled = true;
				reject(/* @__PURE__ */ new Error(`Download timed out after 5 minutes (id: ${downloadId})`));
			}
		}, 300 * 1e3);
	});
}
chrome.runtime.onInstalled.addListener((details) => {});
function handleShowNotification(payload) {
	const { id, title, message, imageUrl } = payload;
	chrome.notifications.create(id, {
		type: "basic",
		title,
		message,
		iconUrl: imageUrl ?? "icons/icon-128x128.png"
	});
}
async function handleFetchRequest(message) {
	const { url, options } = message.payload;
	if (!isAllowedUrl(url)) throw new Error(`URL not in allowed whitelist: ${url}`);
	const method = options?.method ?? "GET";
	if (method !== "GET" && method !== "HEAD") throw new Error(`FETCH_REQUEST only supports GET/HEAD, got: ${method}`);
	const fetchOptions = { method };
	if (options?.headers) fetchOptions.headers = options.headers;
	const response = await fetch(url, fetchOptions);
	if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	return response.json().catch(() => response.text());
}
//#endregion
