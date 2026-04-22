# PaletteExtractor

A goated Chrome extension for extracting complete color palettes from any webpage or pasted code.

## Features

- **Paste Mode**: Paste HTML/CSS source code (Ctrl+U), inline styles, or CSS files to extract colors
- **Capture Mode**: Automatically scan and capture all colors from any webpage
- **Smart Detection**: Extracts HEX, RGB, RGBA, HSL, HSLA, and named colors
- **Visual Palette**: Beautiful grid/list view with hover effects and copy functionality
- **Export Options**: Copy as CSS variables or JSON
- **Claude Integration**: One-click prompt generation to refine palettes with AI

## Installation

1. Clone or download this extension
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select this folder
5. Pin the extension for easy access

## Usage

### Paste Mode
1. Press `Ctrl+U` on any webpage to view source
2. Copy the HTML/CSS code
3. Click the PaletteExtractor icon
4. Paste code in the text area
5. Click "Extract Palette"

### Capture Mode
1. Click the PaletteExtractor icon
2. Switch to "Capture Page" tab
3. Click "Scan Current Page"
4. All colors from computed styles will be extracted

### Export & Claude
- Click individual colors to copy them
- Use "Copy CSS" or "Copy JSON" for the full palette
- Click "Ask Claude" to generate a prompt for color refinement, WCAG analysis, and font pairings

## Keyboard Shortcut
- `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac): Open the extension popup

## File Structure
```
ext3ns10n/
├── manifest.json      # Extension manifest
├── popup.html         # Main UI
├── popup.css          # Dark theme styling
├── popup.js           # Color extraction logic
├── content.js         # Page color capture
├── background.js      # Service worker
├── icons/             # Extension icons
└── README.md          # This file
```

## No API Required
All color extraction is done client-side using regex patterns and browser APIs. Zero external dependencies.

## License
MIT
