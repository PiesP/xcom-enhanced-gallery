# X.com Enhanced Gallery

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md)

Browse images and videos from an X.com post in a focused, keyboard-friendly
gallery and download supported media at its verified available quality. The
project is available as a userscript and as unpacked Chrome and temporary
Firefox extension builds.

## Features

- Vertical gallery for images, videos, GIFs, and supported card media
- Verified CDN-original photo saves and supported single or ZIP downloads
- Keyboard, pointer, and wheel navigation for desktop browsers
- Original, width, height, and container image-fit modes
- Persistent theme, language, playback, and gallery settings
- No project analytics, telemetry, or developer-operated server

## Install

### Userscript

Install a userscript manager such as
[Tampermonkey](https://www.tampermonkey.net/) or
[Violentmonkey](https://violentmonkey.github.io/), then install the
[latest userscript](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js).

The userscript manager can check for updates through the metadata URLs embedded
in the script header. Review and approve an offered update in the manager.

If an installed copy has a versioned `@downloadURL`, an update check may find a
new version but still fetch the old script. After the corrected release is
public, update the existing script once from the
[latest userscript](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)
in your manager, or change its download URL through a reviewed manager workflow.
**Check for updates** alone cannot repair the pinned URL. Verify the installed
header and saved settings after the one-time update.

### Chrome, Edge, or Brave extension

The release archive is an unpacked developer build; it is not installed from a
browser store and does not update automatically.

1. Download `xcom-enhanced-gallery-chrome.zip` from the
   [latest release](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest).
2. Extract the archive to a permanent directory.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Select **Load unpacked** and choose the extracted directory.

For a later release, replace the files in that same directory and reload the
extension from `chrome://extensions`; check the saved settings after updating.

### Firefox extension

1. Download `xcom-enhanced-gallery-firefox.zip` from the
   [latest release](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest).
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on** and choose the ZIP.

This development installation is removed when Firefox restarts. Use the
userscript for a persistent installation.

## Use

1. Open an X.com post containing media.
2. Select an image or video to open the enhanced gallery.
3. Use the arrow keys, navigation buttons, or wheel to move between items.
4. Use the toolbar to change fit mode, download the current item, or download
   all media as a ZIP.

Video clicks follow the saved click mode. The gallery opens a separate player
at the beginning with its own saved volume; closing does not restart X's player.
See the [video-click policy](./docs/video-click-policy.md) for modes and native-player recovery.

If post extraction is unavailable, a status-linked media tile may recover only
its visible, accessible media. A notification identifies this partial recovery;
bulk ZIP downloads include only the items shown in the gallery. A tile does not
establish all attachments of the post.

Ordinary CDN photos keep a separate original-size save source. This is the CDN's
original-size representation, not a promise of bytes identical to the uploader's
file. If that source cannot be verified, saving reports a failure instead of
silently saving a smaller image. Recovered DOM videos disclose their observed
source-quality limit. The displayed or recovered playback source can differ
from the selected save source and quality.
HLS-only attachments require a supported MP4 source in this flow. See the
[media source policy](./docs/media-sources.md) for selection and quality details.

Generated Blob and ZIP downloads share an in-page memory allowance for their
data. Extension single-file saves use the browser's download manager and do not
reserve a whole-file page Blob. If the allowance is reached,
wait for active downloads to finish. If none are active and the limit remains,
reload this page, then try fewer files at once. A userscript save can keep its
allowance until the page is reloaded or closed. A memory-limit partial ZIP
notification reports included and omitted counts; other partial ZIP
notifications report the failed-item count. Reopening the gallery does not
return the userscript allowance, and the shared allowance is not a per-file
entitlement. See the [download ownership contract](./docs/download-memory.md)
for its scope.

Video sources load when the item is active or near the gallery viewport. A
supported alternate MP4 may restore playback after a decoding failure; saves
retain the selected download quality. See [video loading](./docs/media-video-loading.md),
[API reuse and failures](./docs/twitter-api-contract.md), and
[ZIP input admission](./docs/zip-input-admission.md) for the related contracts.

The gallery targets desktop browsers and does not provide a mobile/touch flow.

## Browser support

| Distribution | Support |
| --- | --- |
| Userscript | Chrome/Edge 123+, Firefox 128+, Safari 17.5+ |
| Chromium extension | Current desktop Chrome, Edge, and Brave developer mode |
| Firefox extension | Firefox 128+ temporary developer installation |

The userscript compatibility floor is defined by `USERSCRIPT_BROWSER_SUPPORT`
in [`tooling/vite/browser-support.ts`](./tooling/vite/browser-support.ts). The
Firefox extension minimum comes from
[`extension/manifest.firefox.json`](./extension/manifest.firefox.json).

## Privacy and security

The project processes post content, author identifiers, page/media URLs and X
session authentication context for the gallery and saves. It keeps local
preferences and extension download recovery records, with no developer-operated
backend or analytics. Functional requests go to X/Twitter and its media
providers; redirects depend on the browser/manager transport. See
[Privacy](./PRIVACY.md) for recipients, storage and deletion details and
[Security](./.github/SECURITY.md) for vulnerability reports.

## Development

This project is developed with assistance from AI tools.

See [Contributing](./CONTRIBUTING.md) for setup, commands, project constraints,
and pull request expectations.

## Support

- Bugs, feature requests, and questions: [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- Release history: [Changelog](./CHANGELOG.md)
- Vulnerabilities: [Security policy](./.github/SECURITY.md)

## License

MIT. See [LICENSE](./LICENSE), [NOTICE](./NOTICE.md), and the bundled
[third-party licenses](./LICENSES/).
