# 🚀 X.com Enhanced Gallery

> **PC-only userscript to download media in original quality from X.com and
> navigate conveniently**

[![Install](https://img.shields.io/badge/Install-Click-brightgreen?style=for-the-badge)](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)
[![Version](https://img.shields.io/badge/Version-v0.4.0-blue)](https://github.com/PiesP/xcom-enhanced-gallery/releases)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Chrome/Edge](https://img.shields.io/badge/Chrome%2FEdge-✓-4285F4)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/Firefox-✓-FF7139)](https://www.mozilla.org/firefox/)
[![Safari](https://img.shields.io/badge/Safari-✓-00D4FF)](https://www.apple.com/safari/)

**X.com Enhanced Gallery** is a lightweight userscript built with modern web
technologies:

- **UI Framework**: Solid.js 1.9.9 - Reactive UI, high performance
- **Browser Support**: Chrome 110+, Firefox 78+, Safari 14+, Edge 110+
- **PC-only Design**: Mouse/keyboard optimized, no touch event support
- **Quality Assurance**: TypeScript strict, 1115+ passing tests, 0 lint warnings
  - **Unit Tests**: Vitest + JSDOM (900+ tests)
  - **Browser Tests**: Vitest + Chromium (62 tests)
  - **Integration Tests**: Service lifecycle (8 tests)
  - **E2E Tests**: Playwright (45 tests)
  - **Accessibility Tests**: axe-core WCAG 2.1 (14 tests)

**X.com Enhanced Gallery** is a **PC-only** userscript that lets you download
images and videos in **high-quality original** from X.com (formerly Twitter) and
navigate them with an **intuitive vertical-scroll gallery** interface.

## ✨ Key Features

### 🖼️ Enhanced Gallery Viewer

- **Vertical Scroll Gallery**: Intuitively navigate all media from a tweet in
  one view
- **Original Quality**: Load the highest quality original images/videos from
  X.com servers
- **Real-time Video Playback**: Extract actual MP4 videos from thumbnails and
  play instantly
- **PC Optimized**: Mouse wheel scrolling, keyboard shortcuts, and other
  desktop-specific features

### 💾 Smart Download

- **Original Quality Guaranteed**: Download without Twitter compression at
  highest quality
- **Bulk Download**: Download all media from a tweet as a single ZIP file
- **Intelligent Filenames**:
  - ZIP file: `author_tweetID_YYYYMMDD.zip`
  - Media file: `author_tweetID_YYYYMMDD_number.extension`
- **Fast Download**: Optimized download process with duplicate elimination

### 🎨 User Experience

- **Isolated UI**: Independent gallery that doesn't affect original X.com
  interface
- **Auto Theme**: Automatic theme switching based on system dark mode
- **Accessibility Support**: Full support for screen readers and keyboard
  navigation
- **Performance Optimization**: Fast loading and smooth animations

## 📥 Installation Guide

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

### Keyboard Shortcuts

| Key          | Function            | Description                       |
| ------------ | ------------------- | --------------------------------- |
| `←` `→`      | Previous/Next Image | Navigate between media in gallery |
| `Home` `End` | First/Last Image    | Jump to beginning/end of gallery  |
| `Space`      | Play/Pause Video    | Toggle video playback state       |
| `Escape`     | Close Gallery       | Close gallery and return to page  |
| `F`          | Toggle Fullscreen   | Switch browser fullscreen mode    |

### Advanced Features

- **Image Zoom**: Use mouse wheel to inspect image details
- **Auto Scroll**: Long images automatically scroll to bottom
- **Optimized Loading**: Current image loads first for faster navigation
- **Memory Management**: Unused images auto-released for performance

## 🛠️ Technical Features

### Architecture

- **3-Layer Architecture**: Features → Shared → External modular structure
- **Type Safety**: Complete type safety guaranteed with TypeScript
- **Performance Optimization**: Lazy loading and efficient memory management
- **Isolated Rendering**: Independent UI that doesn't affect X.com's original
  styles

### Core Technologies

- **UI Framework**: Solid.js 1.9.9 - Reactive UI, high performance
- **State Management**: Solid.js Signals - Fine-grained reactive state
- **Compression**: fflate - High-performance ZIP compression library
- **Styling**: CSS Modules + design token system

### Icon System

- **Icon Library**: Heroicons (React) components used safely via "vendor getter"
  pattern.
  - Application code only uses getters from `@shared/external/vendors`, never
    directly imports external libraries.
  - `@heroicons/react` components are safely converted from React Elements →
    Solid VNodes inside getters.
  - UI renders via semantic-named adapters (e.g., `HeroDownload` → `Download`)
    using consistent `Icon` wrapper.

### Browser Compatibility

| Browser | Version | Status |
| ------- | ------- | ------ |
| Chrome  | 88+     | ✅     |
| Firefox | 78+     | ✅     |
| Safari  | 14+     | ✅     |
| Edge    | 88+     | ✅     |

## 📄 License and Open Source

This project is distributed under the [MIT License](LICENSE).

### Used Open Source Libraries

| Library              | License | Purpose                      |
| -------------------- | ------- | ---------------------------- |
| **Solid.js**         | MIT     | UI Framework                 |
| **fflate**           | MIT     | High-performance Compression |
| **@heroicons/react** | MIT     | Icon Components              |

Full license texts are available in the [`LICENSES/`](LICENSES/) directory.

## 🤝 Contributing

Have ideas for project improvements?

### Development Setup

```bash
# Clone repository
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

# Install dependencies
npm install

# Run dev server
npm run dev

# Build
npm run build

# Test
npm test
```

## 📞 Support and Feedback

- **🐛 Report Bugs**:
  [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- **💡 Feature Requests**:
  [GitHub Discussions](https://github.com/PiesP/xcom-enhanced-gallery/discussions)
- **📚 Documentation**: See `docs/` directory locally (developer-only, not in
  repository)
- **📝 Changelog**: [RELEASE_NOTES.md](release/RELEASE_NOTES.md)

---

<div align="center">

**🌟 If you find this project useful, please give it a Star! 🌟**

**Made with ❤️ and GitHub Copilot by [PiesP](https://github.com/PiesP)**

</div>
