# 🚀 X.com Enhanced Gallery

> PC-only userscript to browse and download media from X.com in original quality.

[![Install](https://img.shields.io/badge/Install-Click-brightgreen?style=for-the-badge)](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)
[![Version](https://img.shields.io/github/v/release/PiesP/xcom-enhanced-gallery?label=Version&color=blue)](https://github.com/PiesP/xcom-enhanced-gallery/releases)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**X.com Enhanced Gallery** is a lightweight, PC-only userscript that turns X.com (formerly Twitter) media into a fast, keyboard-friendly gallery with one-click original-quality downloads.

---

## ✨ What it does

- Opens an **isolated vertical gallery** for all images and videos in a tweet
- Downloads media in **original quality** (single file or bulk ZIP)
- Provides **keyboard and mouse** navigation optimized for desktop use
- Keeps the original X.com UI intact while adding an overlay gallery
- Respects **privacy** by running entirely in your browser (no data collection)

Built with modern tooling:

- **UI**: Solid.js 1.9
- **Language**: TypeScript 5.9 (strict)
- **Runtime**: Node.js 24 (via Volta)
- **Bundler**: Vite 8 + vite-plugin-solid
- **Linter/Formatter**: Biome 2.3

## 🧱 Architecture & layering

This repository follows a pragmatic layering model to keep decision logic testable and side-effects isolated.

### “Core” naming (important)

There are two places that may look like "core" at first glance, but they serve different purposes:

- `src/core/*` (imported as `@core/*`)

  - **Meaning**: the _command-runtime core_.
  - **Role**: a small, focused domain where pure reducers compute `{ model, cmds }`.
  - **Rule of thumb**: should stay deterministic and side-effect free.

- `src/shared/core/*` (imported as `@shared/core/*`)
  - **Meaning**: shared _pure business logic and utilities_ used across features/services.
  - **Role**: pure helpers such as download planning, URL transformations, backoff, endpoint builders, etc.

If you are adding new pure logic that is not specific to the command runtime domain, prefer `@shared/core/*`.

### Edge vs Service

- **Edge** (`src/edge/*`): interprets commands and performs side effects (DOM, storage, network, timers, logging).
- **Services** (`src/shared/services/*`): concrete implementations of side effects, often backed by userscript APIs.

### Networking policy (fetch vs GM_xmlhttpRequest)

X.com/Twitter media often involves cross-origin requests where `fetch` can be limited by CORS.

- The Edge HTTP adapter (`src/edge/adapters/http.ts`) prefers the shared `HttpRequestService` (GM_xmlhttpRequest-based)
  when available, and falls back to `fetch` in environments like unit tests.
- Keep retry/backoff/policy logic out of the Edge adapter; put it in dedicated shared modules.

### Event listener policy

For long-lived or non-trivial DOM event subscriptions, prefer managed utilities (`EventManager` / DOM event modules)
so cleanup is automatic and consistent.

Direct `addEventListener` in UI components is acceptable **only** when paired with explicit cleanup
(`onCleanup`, `AbortSignal`, or an equivalent pattern).

## 📥 Installation

### 1️⃣ Install Userscript Manager

First, install a userscript manager extension in your browser.

| Browser         | Recommended Extension                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Chrome/Edge** | [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| **Firefox**     | [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)                                  |
| **Safari**      | [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)                                      |

### 2️⃣ Install Script

<div align="center">

### 🔗 **[Click here to install](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)**

_Clicking will automatically open the installation screen in your userscript
manager_

**📦
[View latest release](https://github.com/PiesP/xcom-enhanced-gallery/releases)**

</div>

### 3️⃣ Verify Installation

1. **Visit X.com**: Go to [https://x.com](https://x.com)
2. **Click Image**: Click an image or video in any tweet
3. **Check Gallery**: Verify the enhanced vertical-scroll gallery appears

> **💡 Tip**: Refresh the page after installation to use immediately.

## 🎮 Usage Guide

### Basic Usage

1. **Open Gallery**: Click an image or video in a tweet
2. **Navigate Media**:
   - 🖱️ **Mouse Wheel**: Scroll up/down to navigate images in order
   - 🖱️ **Arrow Buttons**: Click navigation buttons on the left/right sides
   - ⌨️ **Keyboard**: Use arrow keys or keyboard shortcuts
3. **Play Video**: Press spacebar or click play button on a video

### Download Feature

| Download Type | Button          | Description                                  |
| ------------- | --------------- | -------------------------------------------- |
| **Single**    | 📥 Download     | Save current image/video in original quality |
| **Bulk**      | 📦 Download All | Download all media from tweet as ZIP file    |

### Advanced Features

- **Image Zoom**: Use mouse wheel to inspect image details
- **Auto Scroll**: Long images automatically scroll to bottom
- **Optimized Loading**: Current image loads first for faster navigation
- **Memory Management**: Unused images auto-released for performance

## 🌐 Browser support

Desktop browsers only (no mobile/touch support):

| Browser | Version (minimum) |
| ------- | ----------------- |
| Chrome  | 117+              |
| Edge    | 117+              |
| Firefox | 119+              |
| Safari  | 17+               |

> **Note**: Build target is `esnext` with ES2024 features. CSS features require: oklch (Chrome 111+), color-mix (Chrome 111+), container queries (Chrome 105+).

## 🔒 Security & privacy

- All logic runs locally in your browser on X.com.
- No analytics, telemetry, or third-party tracking.
- No personal data or authentication tokens are collected or sent to external servers.
- Network requests are limited to X.com/Twitter media endpoints and GitHub (for update checks).

For full details and vulnerability reporting, see the [Security Policy](.github/SECURITY.md).

## 📄 License and Open Source

This project is distributed under the [MIT License](LICENSE).

### Used Open Source Libraries

| Library          | License | Purpose         |
| ---------------- | ------- | --------------- |
| **Solid.js**     | MIT     | UI Framework    |
| **Lucide Icons** | ISC     | Icon SVG source |

Full license texts are available in the [`LICENSES/`](LICENSES/) directory.

## 🤝 Contributing

Have ideas for project improvements?

### Development Setup

```bash
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

# Build userscript bundle (includes quality checks)
pnpm build

# Development build
pnpm build:dev

# Quick build (skip quality checks)
pnpm build:fast

# Individual quality checks
pnpm check      # TypeScript (src + tooling)
pnpm lint       # Biome lint
pnpm fmt:check  # Biome format check
```

### Build environment variables

These are optional knobs for development and CI.

| Variable                       | Example                 | Purpose                                                                                                      |
| ------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `BUILD_VERSION`                | `1.3.0`                 | Override the computed version string embedded into the bundle.                                               |
| `XEG_FEATURE_MEDIA_EXTRACTION` | `0` / `false`           | Disable media extraction feature flag at build time (defaults to enabled).                                   |
| `XEG_BUILD_AUTO_GRANT`         | `report` / `true` / `1` | Detect used `GM_*` APIs by scanning the final bundle and either report or apply the resulting `@grant` list. |

GitHub Actions runs a subset of these commands for continuous integration and security. See `.github/workflows/` for details.

## 📞 Support and Feedback

- **🐛 Report bugs**: [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- **💡 Feature requests & questions**: [GitHub Discussions](https://github.com/PiesP/xcom-enhanced-gallery/discussions)
- **📝 Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **🔒 Security reports**: Please follow the [Security Policy](.github/SECURITY.md).

---

<div align="center">

**🌟 If you find this project useful, please give it a Star! 🌟**

**Made with ❤️ and GitHub Copilot by [PiesP](https://github.com/PiesP)**

</div>
