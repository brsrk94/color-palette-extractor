/**
 * PaletteExtractor - Advanced Color Palette Extraction
 * Extracts complete color palettes from HTML/CSS code
 */

// Color extraction regex patterns
const COLOR_PATTERNS = {
  hex: /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g,
  hex8: /#([a-fA-F0-9]{8}|[a-fA-F0-9]{4})\b/g,
  rgb: /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi,
  rgba: /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([0-9.]+)\s*\)/gi,
  hsl: /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)/gi,
  hsla: /hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*([0-9.]+)\s*\)/gi,
  named: /\b(transparent|aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)\b/gi
};

// Named colors to hex mapping
const NAMED_COLORS = {
  transparent: 'transparent', aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff',
  aquamarine: '#7fffd4', azure: '#f0ffff', beige: '#f5f5dc', bisque: '#ffe4c4', black: '#000000',
  blanchedalmond: '#ffebcd', blue: '#0000ff', blueviolet: '#8a2be2', brown: '#a52a2a', burlywood: '#deb887',
  cadetblue: '#5f9ea0', chartreuse: '#7fff00', chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc', crimson: '#dc143c', cyan: '#00ffff', darkblue: '#00008b', darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b', darkgray: '#a9a9a9', darkgreen: '#006400', darkgrey: '#a9a9a9', darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b', darkolivegreen: '#556b2f', darkorange: '#ff8c00', darkorchid: '#9932cc', darkred: '#8b0000',
  darksalmon: '#e9967a', darkseagreen: '#8fbc8f', darkslateblue: '#483d8b', darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f', darkturquoise: '#00ced1', darkviolet: '#9400d3', deeppink: '#ff1493', deepskyblue: '#00bfff',
  dimgray: '#696969', dimgrey: '#696969', dodgerblue: '#1e90ff', firebrick: '#b22222', floralwhite: '#fffaf0',
  forestgreen: '#228b22', fuchsia: '#ff00ff', gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff', gold: '#ffd700',
  goldenrod: '#daa520', gray: '#808080', green: '#008000', greenyellow: '#adff2f', grey: '#808080',
  honeydew: '#f0fff0', hotpink: '#ff69b4', indianred: '#cd5c5c', indigo: '#4b0082', ivory: '#fffff0',
  khaki: '#f0e68c', lavender: '#e6e6fa', lavenderblush: '#fff0f5', lawngreen: '#7cfc00', lemonchiffon: '#fffacd',
  lightblue: '#add8e6', lightcoral: '#f08080', lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3',
  lightgreen: '#90ee90', lightgrey: '#d3d3d3', lightpink: '#ffb6c1', lightsalmon: '#ffa07a', lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa', lightslategray: '#778899', lightslategrey: '#778899', lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0', lime: '#00ff00', limegreen: '#32cd32', linen: '#faf0e6', magenta: '#ff00ff',
  maroon: '#800000', mediumaquamarine: '#66cdaa', mediumblue: '#0000cd', mediumorchid: '#ba55d3', mediumpurple: '#9370db',
  mediumseagreen: '#3cb371', mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585', midnightblue: '#191970', mintcream: '#f5fffa', mistyrose: '#ffe4e1', moccasin: '#ffe4b5',
  navajowhite: '#ffdead', navy: '#000080', oldlace: '#fdf5e6', olive: '#808000', olivedrab: '#6b8e23',
  orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6', palegoldenrod: '#eee8aa', palegreen: '#98fb98',
  paleturquoise: '#afeeee', palevioletred: '#db7093', papayawhip: '#ffefd5', peachpuff: '#ffdab9', peru: '#cd853f',
  pink: '#ffc0cb', plum: '#dda0dd', powderblue: '#b0e0e6', purple: '#800080', rebeccapurple: '#663399',
  red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1', saddlebrown: '#8b4513', salmon: '#fa8072',
  sandybrown: '#f4a460', seagreen: '#2e8b57', seashell: '#fff5ee', sienna: '#a0522d', silver: '#c0c0c0',
  skyblue: '#87ceeb', slateblue: '#6a5acd', slategray: '#708090', slategrey: '#708090', snow: '#fffafa',
  springgreen: '#00ff7f', steelblue: '#4682b4', tan: '#d2b48c', teal: '#008080', thistle: '#d8bfd8',
  tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee', wheat: '#f5deb3', white: '#ffffff',
  whitesmoke: '#f5f5f5', yellow: '#ffff00', yellowgreen: '#9acd32'
};

// DOM Elements
const elements = {
  codeInput: document.getElementById('code-input'),
  extractBtn: document.getElementById('extract-btn'),
  clearBtn: document.getElementById('clear-btn'),
  pasteBtn: document.getElementById('paste-btn'),
  captureBtn: document.getElementById('capture-btn'),
  results: document.getElementById('results'),
  paletteGrid: document.getElementById('palette-grid'),
  colorCount: document.getElementById('color-count'),
  copyCssBtn: document.getElementById('copy-css-btn'),
  copyJsonBtn: document.getElementById('copy-json-btn'),
  claudeBtn: document.getElementById('claude-btn'),
  claudeSection: document.getElementById('claude-section'),
  claudePrompt: document.getElementById('claude-prompt'),
  copyClaudeBtn: document.getElementById('copy-claude-btn'),
  modeBtns: document.querySelectorAll('.mode-btn'),
  toast: document.getElementById('toast')
};

// State
let extractedColors = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadLastInput();
});

function setupEventListeners() {
  // Mode toggle
  elements.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(`${btn.dataset.mode}-section`).classList.add('active');
    });
  });

  // Actions
  elements.extractBtn.addEventListener('click', handleExtract);
  elements.clearBtn.addEventListener('click', handleClear);
  elements.pasteBtn.addEventListener('click', handlePaste);
  elements.captureBtn.addEventListener('click', handleCapture);
  elements.copyCssBtn.addEventListener('click', () => exportColors('css'));
  elements.copyJsonBtn.addEventListener('click', () => exportColors('json'));
  elements.claudeBtn.addEventListener('click', generateClaudePrompt);
  elements.copyClaudeBtn.addEventListener('click', copyAndOpenClaude);

  // Keyboard shortcuts
  elements.codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleExtract();
    }
  });

  // Auto-save
  elements.codeInput.addEventListener('input', debounce(saveInput, 500));
}

// Extract colors from code
function handleExtract() {
  const code = elements.codeInput.value.trim();
  
  if (!code) {
    showToast('Please paste some code first', 'error');
    return;
  }

  extractedColors = extractColors(code);
  
  if (extractedColors.length === 0) {
    showToast('No colors found in the code', 'error');
    elements.results.classList.add('hidden');
    return;
  }

  displayPalette(extractedColors);
  elements.results.classList.remove('hidden');
  elements.claudeSection.classList.add('hidden');
  showToast(`Found ${extractedColors.length} unique colors`, 'success');
}

// Extract colors using regex patterns
function extractColors(code) {
  const colors = new Map();

  // Hex colors (6 and 3 digit)
  let match;
  while ((match = COLOR_PATTERNS.hex.exec(code)) !== null) {
    const hex = normalizeHex(match[0]);
    if (hex) {
      colors.set(hex, { value: hex, format: 'HEX', original: match[0] });
    }
  }

  // RGB
  while ((match = COLOR_PATTERNS.rgb.exec(code)) !== null) {
    const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    colors.set(hex, { value: hex, format: 'RGB', original: match[0] });
  }

  // RGBA
  while ((match = COLOR_PATTERNS.rgba.exec(code)) !== null) {
    const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    const alpha = parseFloat(match[4]);
    const value = alpha < 1 ? match[0] : hex;
    colors.set(hex, { value, format: 'RGBA', original: match[0], alpha });
  }

  // HSL
  while ((match = COLOR_PATTERNS.hsl.exec(code)) !== null) {
    const hex = hslToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    colors.set(hex, { value: hex, format: 'HSL', original: match[0] });
  }

  // HSLA
  while ((match = COLOR_PATTERNS.hsla.exec(code)) !== null) {
    const hex = hslToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    const alpha = parseFloat(match[4]);
    const value = alpha < 1 ? match[0] : hex;
    colors.set(hex, { value, format: 'HSLA', original: match[0], alpha });
  }

  // Named colors
  while ((match = COLOR_PATTERNS.named.exec(code)) !== null) {
    const name = match[0].toLowerCase();
    const hex = NAMED_COLORS[name];
    if (hex && hex !== 'transparent') {
      colors.set(hex, { value: hex, format: 'Named', original: match[0], name });
    }
  }

  return Array.from(colors.values()).sort((a, b) => {
    // Sort by luminance
    return getLuminance(a.value) - getLuminance(b.value);
  });
}

// Normalize hex color to 6 digits
function normalizeHex(hex) {
  hex = hex.toLowerCase();
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

// RGB to Hex conversion
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

// HSL to Hex conversion
function hslToHex(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

// Calculate luminance for sorting
function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

// Hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Display palette
function displayPalette(colors) {
  elements.paletteGrid.innerHTML = '';
  elements.colorCount.textContent = `${colors.length} color${colors.length !== 1 ? 's' : ''} found`;

  colors.forEach((color, index) => {
    const item = createColorItem(color, index);
    elements.paletteGrid.appendChild(item);
  });
}

// Create color item element
function createColorItem(color, index) {
  const div = document.createElement('div');
  div.className = 'color-item';
  div.style.backgroundColor = color.value;
  div.title = `Click to copy: ${color.original}`;
  div.dataset.index = index;
  
  // Determine text color based on background
  const luminance = getLuminance(color.value);
  const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
  
  div.innerHTML = `
    <div class="color-swatch" style="background-color: ${color.value}">
      <span class="color-hex" style="color: ${textColor}">${color.value.toUpperCase()}</span>
      <div class="color-info">
        <span class="color-hex">${color.value.toUpperCase()}</span>
        <span class="color-format">${color.format}: ${color.original}</span>
      </div>
    </div>
    <div class="color-tooltip">${color.format} • Click to copy</div>
  `;
  
  div.addEventListener('click', () => {
    copyToClipboard(color.original);
    showToast(`Copied ${color.original}`, 'success');
    
    // Visual feedback
    div.style.transform = 'scale(0.95)';
    setTimeout(() => {
      div.style.transform = '';
    }, 150);
  });
  
  return div;
}

// Export colors
function exportColors(format) {
  if (extractedColors.length === 0) {
    showToast('No colors to export', 'error');
    return;
  }

  let output;
  
  if (format === 'css') {
    output = ':root {\n' + extractedColors.map((c, i) => `  --color-${i + 1}: ${c.value};`).join('\n') + '\n}';
  } else {
    output = JSON.stringify({
      palette: extractedColors.map(c => ({
        hex: c.value,
        format: c.format,
        original: c.original
      })),
      generatedAt: new Date().toISOString(),
      count: extractedColors.length
    }, null, 2);
  }

  copyToClipboard(output);
  showToast(`${format.toUpperCase()} copied to clipboard`, 'success');
}

// Generate Claude prompt
function generateClaudePrompt() {
  const colorList = extractedColors.map(c => c.value).join(', ');
  const cssVars = extractedColors.map((c, i) => `--color-${i + 1}: ${c.value};`).join('\n');
  
  const prompt = `I extracted this color palette from a website:

${cssVars}

Analyze this palette and suggest:
1. A name for this color scheme
2. Which colors work best for primary/secondary/accent roles
3. WCAG contrast accessibility ratings for suggested text/background pairs
4. Suggested improvements or missing colors needed
5. A matching Google Fonts pairing that complements this palette

Original format: ${extractedColors.map(c => c.format).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
Total colors: ${extractedColors.length}`;

  elements.claudePrompt.value = prompt;
  elements.claudeSection.classList.remove('hidden');
  elements.claudeSection.scrollIntoView({ behavior: 'smooth' });
}

// Copy and open Claude
async function copyAndOpenClaude() {
  await copyToClipboard(elements.claudePrompt.value);
  chrome.tabs.create({ url: 'https://claude.ai/new' });
}

// Clear input
function handleClear() {
  elements.codeInput.value = '';
  elements.results.classList.add('hidden');
  elements.claudeSection.classList.add('hidden');
  chrome.storage.local.remove(['lastInput']);
  showToast('Cleared', 'success');
}

// Paste from clipboard
async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    elements.codeInput.value = text;
    saveInput();
    showToast('Pasted from clipboard', 'success');
    handleExtract();
  } catch (err) {
    showToast('Could not access clipboard', 'error');
  }
}

// Capture from current page
async function handleCapture() {
  // Show loading state
  const originalText = elements.captureBtn.innerHTML;
  elements.captureBtn.innerHTML = `
    <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
    Scanning...
  `;
  elements.captureBtn.disabled = true;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('devtools://')) {
      showToast('Cannot capture from this page', 'error');
      elements.captureBtn.innerHTML = originalText;
      elements.captureBtn.disabled = false;
      return;
    }
    
    // Inject content script if not already there
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      // Script might already be injected, continue
    }
    
    chrome.tabs.sendMessage(tab.id, { action: 'capture' }, (response) => {
      // Restore button
      elements.captureBtn.innerHTML = originalText;
      elements.captureBtn.disabled = false;
      
      if (chrome.runtime.lastError) {
        showToast('Refresh the page and try again', 'error');
        return;
      }
      
      if (response && response.colors && response.colors.length > 0) {
        extractedColors = response.colors.map(c => ({ 
          value: c, 
          format: 'Captured', 
          original: c 
        }));
        displayPalette(extractedColors);
        elements.results.classList.remove('hidden');
        elements.claudeSection.classList.add('hidden');
        showToast(`Captured ${extractedColors.length} meaningful colors`, 'success');
      } else {
        showToast('No distinctive colors found - try paste mode', 'info');
      }
    });
  } catch (err) {
    elements.captureBtn.innerHTML = originalText;
    elements.captureBtn.disabled = false;
    showToast('Capture failed - refresh page first', 'error');
  }
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.remove('hidden');
  
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2500);
}

// Save input to storage
function saveInput() {
  chrome.storage.local.set({ lastInput: elements.codeInput.value });
}

// Load last input
function loadLastInput() {
  chrome.storage.local.get(['lastInput'], (result) => {
    if (result.lastInput) {
      elements.codeInput.value = result.lastInput;
    }
  });
}

// Debounce utility
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
