# X.com Enhanced Gallery

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

Use the toolchain pinned in `package.json`, initialize the shared browser-core
submodule, and install dependencies:

```bash
git submodule update --init --recursive
pnpm install
```

| Command | Purpose |
| --- | --- |
| `pnpm test` | Run the Vitest suite |
| `pnpm test:e2e` | Run the full Chromium userscript suite plus Firefox/WebKit smoke tests |
| `pnpm test:e2e:extension` | Run Chrome installed-extension and Firefox artifact/runtime Playwright checks |
| `pnpm test:e2e:extension:firefox` | Install the Firefox build temporarily and run its Selenium smoke test |
| `pnpm test:e2e:all` | Run every userscript and extension browser lane |
| `pnpm quality` | Run static quality checks |
| `pnpm verify` | Run quality and all production builds |
| `pnpm verify:full` | Add coverage and browser tests to `verify` |

Browser lanes consume generated userscript and extension artifacts. See the
[contributing commands](./CONTRIBUTING.md#commands) for preparation details.

See [Contributing](./CONTRIBUTING.md) for project constraints and pull request
expectations.

## Support

- Bugs, feature requests, and questions: [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- Release history: [Changelog](./CHANGELOG.md)
- Vulnerabilities: [Security policy](./.github/SECURITY.md)

## License

MIT. See [LICENSE](./LICENSE), [NOTICE](./NOTICE.md), and the bundled
[third-party licenses](./LICENSES/).
