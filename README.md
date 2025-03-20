# X.com Enhanced Image Gallery

[![Build UserScript](https://github.com/PiesP/xcom-enhanced-gallery/actions/workflows/build.yml/badge.svg)](https://github.com/PiesP/xcom-enhanced-gallery/actions/workflows/build.yml)
[![GitHub Release](https://img.shields.io/github/v/release/PiesP/xcom-enhanced-gallery)](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A UserScript that enhances image viewing on X.com (formerly Twitter) with original-sized images and advanced viewing options. Experience a smoother, more feature-rich image viewing experience on both timeline and media tab views.

## Features

- Display images in original size instead of X's compressed versions
- Vertical scrolling gallery for multiple images
- Multiple viewing modes: fit to width/height/window or original size
- Navigation via thumbnails, controls, and keyboard shortcuts
- Download options for individual images or as ZIP archive
- Multilingual support (English and Korean)
- Automatic UI adaptation to match X.com theme
- Support for both timeline and media tab views
- Smooth scrolling between images and responsive UI

## Installation

1. Install a UserScript manager ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [Greasemonkey](https://www.greasespot.net/))
2. [Click here to install the latest stable version](https://github.com/PiesP/xcom-enhanced-gallery/raw/master/dist/xcom-enhanced-gallery.user.js)
3. Confirm installation in your UserScript manager

You can also install the latest release version from the [Releases page](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest).

## Usage

1. Navigate to X.com (timeline or media tab) and click any image
2. Use the top controls to change view modes (fit to width, height, window, or original size)
3. Use thumbnails at the bottom for quick navigation between images
4. Download individual images or all images as a ZIP archive
5. Scroll vertically to navigate through multiple images
6. Click outside the image area or press ESC to close the viewer

The enhanced viewer works in both the main timeline and the user's media tab views.

### Keyboard Shortcuts

- **Navigation**:
  - Left/Up Arrow: Previous image
  - Right/Down Arrow: Next image  
  - Space: Next image
  - Home: First image
  - End: Last image
- **Control**:
  - Escape: Close viewer

## Browser Compatibility

Tested and compatible with:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## Development

This project uses a modular JavaScript structure and a simple build system. For development instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

### Building from Source

```bash
# Clone the repository
git clone https://github.com/PiesP/xcom-enhanced-gallery.git
cd xcom-enhanced-gallery

# Build the userscript
node build.js
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or create an Issue if you encounter any problems or have suggestions for improvements.

## Acknowledgements

This project was developed with assistance from Claude, an AI assistant by Anthropic. Claude helped with code optimization, documentation improvements, and implementation of specific features including the media tab support and smooth scrolling enhancements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
