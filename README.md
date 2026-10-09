# X.com Enhanced Gallery

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md)

Browse images and videos from an X.com post in a focused, keyboard-friendly
gallery and download the original media. The project is available as a
userscript and as unpacked Chrome and temporary Firefox extension builds.

## Features

- Vertical gallery for images, videos, GIFs, and supported card media
- Original-quality single downloads and bulk ZIP downloads
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

The userscript checks for updates through the metadata URLs embedded in its
header.

### Chrome, Edge, or Brave extension

The release archive is an unpacked developer build; it is not installed from a
browser store and does not update automatically.

1. Download `xcom-enhanced-gallery-chrome.zip` from the
   [latest release](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest).
2. Extract the archive to a permanent directory.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Select **Load unpacked** and choose the extracted directory.

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

If post extraction is unavailable, a status-linked media tile may recover only
its visible, accessible media. A notification identifies this partial recovery;
bulk ZIP downloads include only the items shown in the gallery. A tile does not
establish all attachments of the post.

Downloads share an in-page memory allowance for their data. If it is reached,
wait for active downloads to finish. If none are active and the limit remains,
reload this page, then try fewer files at once. A userscript save can keep its
allowance until the page is reloaded or closed. A partial ZIP reports both
included and omitted file counts. Reopening the gallery does not return the
userscript allowance, and the shared allowance is not a per-file entitlement.
See the
[download ownership contract](./docs/download-memory.md) for its scope.

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

The project processes page content and downloads in the browser. Runtime
requests are limited to the X/Twitter pages, APIs, and media hosts required for
gallery extraction and downloads. See [Privacy](./PRIVACY.md) for platform and
storage details and [Security](./.github/SECURITY.md) for vulnerability reports.

## Development

This project is developed with assistance from AI tools.

See [Contributing](./CONTRIBUTING.md) for setup, commands, project constraints,
and pull request expectations.

The weekly [Deep Verification](./.github/workflows/deep-checks.yaml) workflow
may reuse a prior successful duplication or mutation result when all tracked
inputs, pinned Node/pnpm versions, and runner platform and label match. Manual
runs perform fresh checks by default; `reuse_success` opts into reuse. The
runner `ImageVersion` is recorded in the success marker for provenance but is
deliberately excluded from the fingerprint, so an image refresh alone does not
force these source-based gates to rerun. A missing or invalid marker runs the
gate fresh. Reuse applies only to these two deep checks; CI, security, and
browser checks run under their own workflows.

## Support

- Bugs, feature requests, and questions: [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- Release history: [Changelog](./CHANGELOG.md)
- Vulnerabilities: [Security policy](./.github/SECURITY.md)

## License

MIT. See [LICENSE](./LICENSE), [NOTICE](./NOTICE.md), and the bundled
[third-party licenses](./LICENSES/).
