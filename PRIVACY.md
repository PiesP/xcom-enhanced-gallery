# Privacy

X.com Enhanced Gallery is distributed as a userscript and as Chrome and Firefox
extension builds. It does not use a developer-operated backend, analytics, or
telemetry service.

## Data handled in the browser

The application reads the current X/Twitter page and related API responses.
It uses post text, author display names and handles, post identifiers, page
addresses, media URLs and media metadata to find images/videos, display the
gallery and post context, link back to posts, and create download filenames.
This includes social media posts and identifiers belonging to their authors;
it is not limited to content you authored. Media is displayed or prepared for
download in your browser, without uploading it to a project-operated server.

To request post metadata from X/Twitter, the application reads the page's `ct0`
CSRF cookie and may resolve authorization data embedded in the X page, with a
built-in guest authorization fallback. API requests send authorization/CSRF
headers and post identifiers to X/Twitter, and may include the current page
address as request context. Browser or userscript-manager cookie rules also
apply. The absence of a browser `cookies` permission does not mean that
page-readable cookies are never accessed.

Authentication values are held in request/page memory, including the current
authentication context used to reuse metadata requests. The application does
not copy them into its persistent settings or download recovery storage.
Metadata entries have a short cache-reuse window; that expiry does not delete
X's own cookies or impose a fixed lifetime on the in-memory authentication context.
Page teardown releases page memory. X controls its session cookies and server
data; this project does not delete them. See the
[authentication resolver](./src/shared/services/media/twitter-auth/twitter-auth.ts)
and [API client](./src/shared/services/media/twitter-api-client.ts).

Clicks, keys and scrolling operate the gallery and downloads. The project does
not collect an analytics clickstream or a history of pages you visit.

## Storage

| Storage | Contents and retention |
| --- | --- |
| Extension local storage | Theme, language, gallery and playback preferences persist across sessions until changed or cleared. This is local extension storage, not browser sync storage. |
| Extension download recovery storage | Request/download identifiers and cancellation state; direct downloads also record the originating tab ID, a hash of the media URL, timestamps and terminal state. These records recover ownership/cancellation after background-worker restarts. They do not store the raw media URL, authentication headers or media bytes. |
| Userscript-manager storage | Preferences are stored through the manager's `GM_*` APIs and retained according to that manager's settings and removal behavior. Extension download recovery records are not used by this route. |
| Settings fallback | If the primary settings API fails, a best-effort `localStorage` fallback uses the `xeg-fallback:` prefix on the X/Twitter site origin. It contains settings only, can survive reloads, and may be unavailable in some browser contexts. A successful primary write removes the corresponding stale fallback value. |

Download recovery records have different lifetimes. Ordinary Blob-download
records are removed on observed completion/interruption or reconciliation.
Direct-download terminal results and unassigned requests become eligible for
expiry after ten minutes, subject to live allocation protection. Assigned active
downloads are not subject to that fixed expiry. Pending non-direct cancellation
records without a download ID have a shorter, thirty-second expiry. Cleanup
happens when records are loaded or relevant tracking operations prune and
persist them, not through a guaranteed deletion timer. An inactive extension
or failed storage write can leave records longer. See
[download tracking](./src/extension/download-tracking.ts) and the
[download ownership contract](./docs/download-memory.md).

For a complete local reset, stop active downloads and close affected pages,
then clear the extension's local storage or the userscript manager's saved
values using that browser/manager's storage controls. Also remove any
`xeg-fallback:` settings on each X/Twitter origin where you used the application;
extension storage and site storage are separate. Uninstall behavior depends on
the browser/manager and does not guarantee removal of site fallback values.
Changing settings or reloading the gallery does not clear all these stores.
See the [settings storage implementation](./src/shared/services/persistent-storage.ts).

## Network access

Functional requests retrieve post metadata from X/Twitter and media from its
image/video CDN. Those providers receive the requests, associated network
information such as your IP address, and authentication context where applicable;
their own privacy policies govern their handling. There is no project-operated
recipient or analytics endpoint.

The configured initial hosts are `x.com`, `twitter.com`, `pbs.twimg.com` and
`video.twimg.com`. The authoritative permissions are `USERSCRIPT_CONFIG.match`
and `USERSCRIPT_CONFIG.connect` in
[`tooling/vite/utils/userscript.ts`](./tooling/vite/utils/userscript.ts), and
`host_permissions` in the [Chrome](./extension/manifest.json) and
[Firefox](./extension/manifest.firefox.json) manifests.

Initial host admission is not a guarantee about every network hop. Extension
content-script HTTP requests reject redirects; browser-native downloads and
userscript transports have browser/manager-controlled redirect behavior.
Some userscript routes validate the final URL only after a request has followed
redirects, so that validation cannot prevent prior disclosure to another hop.
See the [transport-specific redirect contract](./docs/network-redirects.md).

The userscript manager may separately check the GitHub Release URLs embedded in
the userscript header for updates. Those URLs are emitted by
`generateUserscriptHeader()` and `generateMetaOnlyHeader()` in the same source
file. Browser vendors and userscript managers have their own privacy policies.

## Downloads

Extension single-file downloads can hand a validated media URL directly to the
browser download manager, which retrieves the file. ZIP archives are assembled
locally from the media included in the current gallery, then handed off as a
local Blob. Other Blob/userscript save routes depend on the platform; see the
[download ownership contract](./docs/download-memory.md).

Saved files and their filenames can contain post/author information. Your
browser or userscript manager controls the download directory and download
records, which can include source URLs. Deleting extension settings, recovery
records or the extension itself does not delete your downloaded files or clear
browser download records. Delete those separately using your file manager and
browser controls.

## Limited Use

The extension's use of user data complies with the Chrome Web Store User Data
Policy, including its [Limited Use requirements](https://developer.chrome.com/docs/webstore/program-policies/limited-use).
Data is used only to provide the described gallery, post context, media saves,
preferences and download recovery. Functional requests go to the providers
described above; the project does not sell data, use or transfer it for
advertising, creditworthiness or lending, or provide it to data brokers. The
application does not send handled content to the developer for human review.
This statement concerns the extension's data handling; it does not imply use
of Google APIs.

## Security reports

Do not include private account, post, or authentication data in a public issue.
Report suspected vulnerabilities through the [security policy](./.github/SECURITY.md).
