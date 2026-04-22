/**
 * Content Script - Captures meaningful color palettes from webpages
 * Filters out noise and extracts dominant/brand colors
 */

// Color extraction patterns
const COLOR_PATTERNS = {
  hex: /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g,
  rgb: /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi,
  rgba: /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([0-9.]+)\s*\)/gi,
  hsl: /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)/gi,
  hsla: /hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*([0-9.]+)\s*\)/gi
};

// Color analysis utilities
const ColorUtils = {
  // Convert hex to RGB object
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Get luminance (0-1)
  getLuminance(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  },

  // Get hue (0-360)
  getHue(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return Math.round(h * 360);
  },

  // Get saturation (0-100)
  getSaturation(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    const l = (max + min) / 2;
    return Math.round((max - min) / (1 - Math.abs(2 * l - 1)) * 100);
  },

  // Check if color is grayscale
  isGrayscale(hex, tolerance = 15) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return true;
    const maxDiff = Math.max(Math.abs(rgb.r - rgb.g), Math.abs(rgb.g - rgb.b), Math.abs(rgb.r - rgb.b));
    return maxDiff < tolerance;
  },

  // Check if color is too dark (near black)
  isNearBlack(hex, threshold = 0.08) {
    return this.getLuminance(hex) < threshold;
  },

  // Check if color is too light (near white)
  isNearWhite(hex, threshold = 0.95) {
    return this.getLuminance(hex) > threshold;
  },

  // Calculate color distance (Euclidean in RGB space)
  colorDistance(hex1, hex2) {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    if (!rgb1 || !rgb2) return Infinity;
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }
};

// Named colors
const NAMED_COLORS = new Set([
  'transparent', 'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate',
  'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod',
  'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange',
  'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
  'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
  'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki',
  'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen',
  'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
  'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
  'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
  'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive',
  'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
  'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen',
  'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke',
  'yellow', 'yellowgreen'
]);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capture') {
    const colors = capturePageColors();
    sendResponse({ colors });
  }
  return true;
});

/**
 * Captures MEANINGFUL colors from the current webpage
 * Filters out noise, groups similar colors, prioritizes prominent ones
 */
function capturePageColors() {
  const colorFrequency = new Map(); // Track how often each color appears
  const colorAreas = new Map(); // Track visual prominence by element area

  try {
    // 1. Sample key elements only (not every single element)
    const keySelectors = [
      'body', 'header', 'nav', 'main', 'article', 'section', 'aside', 'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'input', 'label',
      '[class*="btn"]', '[class*="button"]', '[class*="nav"]', '[class*="header"]',
      '[class*="hero"]', '[class*="banner"]', '[class*="card"]', '[class*="modal"]',
      '[class*="bg"]', '[class*="background"]', '[class*="primary"]', '[class*="secondary"]',
      '[class*="accent"]', '[class*="brand"]', '[class*="theme"]'
    ];

    const keyElements = new Set();
    keySelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          // Only add elements with reasonable size (visible, not tiny)
          const rect = el.getBoundingClientRect();
          if (rect.width > 20 && rect.height > 20 && rect.width < window.innerWidth * 2) {
            keyElements.add(el);
          }
        });
      } catch (e) {}
    });

    // Also get a sample of body children
    const bodyChildren = document.body.children;
    for (let i = 0; i < Math.min(bodyChildren.length, 20); i++) {
      const rect = bodyChildren[i].getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        keyElements.add(bodyChildren[i]);
      }
    }

    // 2. Extract colors from key elements with area weighting
    keyElements.forEach(el => {
      try {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;

        // Important color properties (prioritized)
        const colorProps = [
          { prop: computed.backgroundColor, weight: 3 },    // Backgrounds matter most
          { prop: computed.color, weight: 2 },              // Text color
          { prop: computed.borderColor, weight: 1 },        // Borders less important
        { prop: computed.fill, weight: 1.5 }              // SVG fills
        ];

        colorProps.forEach(({ prop, weight }) => {
          if (prop && prop !== 'transparent' && prop !== 'rgba(0, 0, 0, 0)') {
            const hex = colorToHex(prop);
            if (hex && isValidColor(hex)) {
              const normalized = normalizeHex(hex);
              const currentFreq = colorFrequency.get(normalized) || 0;
              colorFrequency.set(normalized, currentFreq + weight);
              
              const currentArea = colorAreas.get(normalized) || 0;
              colorAreas.set(normalized, currentArea + (area * weight));
            }
          }
        });
      } catch (e) {}
    });

    // 3. Extract from stylesheets (CSS variables and theme colors)
    try {
      const themeColorSelectors = [
        /-(?:primary|secondary|accent|brand|theme|color)/i,
        /background/i,
        /foreground/i,
        /text/i
      ];

      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || sheet.rules || []) {
            if (!rule.style) continue;
            
            // Check if rule is theme-related
            const isThemeRule = themeColorSelectors.some(re => re.test(rule.cssText));
            
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              const value = rule.style.getPropertyValue(prop);
              
              const weight = isThemeRule ? 5 : 1;
              
              extractColorsFromString(value).forEach(c => {
                if (isValidColor(c)) {
                  const normalized = normalizeHex(c);
                  const current = colorFrequency.get(normalized) || 0;
                  colorFrequency.set(normalized, current + weight);
                }
              });
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // 4. Look for meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = metaThemeColor.getAttribute('content');
      const hex = colorToHex(color);
      if (hex && isValidColor(hex)) {
        const normalized = normalizeHex(hex);
        colorFrequency.set(normalized, (colorFrequency.get(normalized) || 0) + 10);
      }
    }

    // 5. Parse HTML for explicit color definitions (meta tags, etc.)
    const html = document.documentElement.innerHTML.substring(0, 50000); // Limit search
    extractColorsFromString(html).forEach(c => {
      if (isValidColor(c)) {
        const normalized = normalizeHex(c);
        const current = colorFrequency.get(normalized) || 0;
        colorFrequency.set(normalized, current + 0.5);
      }
    });

  } catch (error) {
    console.error('Error capturing colors:', error);
  }

  // Filter and group similar colors
  return processColors(colorFrequency, colorAreas);
}

/**
 * Validate if a color is worth keeping (not grayscale, not too dark/light)
 */
function isValidColor(hex) {
  // Reject near-blacks
  if (ColorUtils.isNearBlack(hex, 0.05)) return false;
  // Reject near-whites
  if (ColorUtils.isNearWhite(hex, 0.97)) return false;
  // Reject very low saturation colors (near grayscale)
  if (ColorUtils.getSaturation(hex) < 5 && ColorUtils.getLuminance(hex) > 0.2 && ColorUtils.getLuminance(hex) < 0.8) return false;
  return true;
}

/**
 * Process and deduplicate colors, keeping the most meaningful ones
 */
function processColors(frequencyMap, areaMap) {
  const colors = Array.from(frequencyMap.entries());
  
  // Sort by combined score (frequency + area importance)
  colors.sort((a, b) => {
    const scoreA = a[1] + (areaMap.get(a[0]) || 0) / 10000;
    const scoreB = b[1] + (areaMap.get(b[0]) || 0) / 10000;
    return scoreB - scoreA;
  });

  // Group similar colors (within 30 distance in RGB space)
  const processed = [];
  const used = new Set();
  const SIMILARITY_THRESHOLD = 25;

  for (const [hex, score] of colors) {
    if (used.has(hex)) continue;
    
    // Find similar colors and merge them
    const similar = [hex];
    for (const [otherHex] of colors) {
      if (otherHex !== hex && !used.has(otherHex)) {
        const dist = ColorUtils.colorDistance(hex, otherHex);
        if (dist < SIMILARITY_THRESHOLD) {
          similar.push(otherHex);
          used.add(otherHex);
        }
      }
    }
    
    used.add(hex);
    
    // Pick the most saturated/vibrant representative from the group
    const representative = similar.sort((a, b) => {
      return ColorUtils.getSaturation(b) - ColorUtils.getSaturation(a);
    })[0];
    
    processed.push({
      hex: representative,
      score: similar.reduce((sum, h) => sum + (frequencyMap.get(h) || 0), 0),
      variants: similar.length
    });
  }

  // Take top colors (max 12 for a good palette)
  const topColors = processed.slice(0, 12);
  
  // Sort final result by luminance for visual appeal
  topColors.sort((a, b) => ColorUtils.getLuminance(a.hex) - ColorUtils.getLuminance(b.hex));
  
  return topColors.map(c => c.hex);
}

/**
 * Extract color values from a string
 */
function extractColorsFromString(str) {
  const colors = new Set();
  
  if (!str) return colors;

  // Hex colors
  let match;
  while ((match = COLOR_PATTERNS.hex.exec(str)) !== null) {
    colors.add(normalizeHex(match[0]));
  }
  COLOR_PATTERNS.hex.lastIndex = 0;

  // RGB
  while ((match = COLOR_PATTERNS.rgb.exec(str)) !== null) {
    colors.add(rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])));
  }
  COLOR_PATTERNS.rgb.lastIndex = 0;

  // HSL
  while ((match = COLOR_PATTERNS.hsl.exec(str)) !== null) {
    colors.add(hslToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])));
  }
  COLOR_PATTERNS.hsl.lastIndex = 0;

  // Named colors
  const words = str.toLowerCase().match(/\b[a-z]+\b/g) || [];
  words.forEach(word => {
    if (NAMED_COLORS.has(word) && word !== 'transparent') {
      colors.add(NAMED_COLORS_MAP[word] || word);
    }
  });

  return colors;
}

// Named colors map
const NAMED_COLORS_MAP = {
  aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff', aquamarine: '#7fffd4',
  azure: '#f0ffff', beige: '#f5f5dc', bisque: '#ffe4c4', black: '#000000', blanchedalmond: '#ffebcd',
  blue: '#0000ff', blueviolet: '#8a2be2', brown: '#a52a2a', burlywood: '#deb887', cadetblue: '#5f9ea0',
  chartreuse: '#7fff00', chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc', crimson: '#dc143c', cyan: '#00ffff', darkblue: '#00008b', darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b', darkgray: '#a9a9a9', darkgreen: '#006400', darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b', darkmagenta: '#8b008b', darkolivegreen: '#556b2f', darkorange: '#ff8c00',
  darkorchid: '#9932cc', darkred: '#8b0000', darksalmon: '#e9967a', darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b', darkslategray: '#2f4f4f', darkslategrey: '#2f4f4f', darkturquoise: '#00ced1',
  darkviolet: '#9400d3', deeppink: '#ff1493', deepskyblue: '#00bfff', dimgray: '#696969', dimgrey: '#696969',
  dodgerblue: '#1e90ff', firebrick: '#b22222', floralwhite: '#fffaf0', forestgreen: '#228b22',
  fuchsia: '#ff00ff', gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff', gold: '#ffd700', goldenrod: '#daa520',
  gray: '#808080', green: '#008000', greenyellow: '#adff2f', grey: '#808080', honeydew: '#f0fff0',
  hotpink: '#ff69b4', indianred: '#cd5c5c', indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c',
  lavender: '#e6e6fa', lavenderblush: '#fff0f5', lawngreen: '#7cfc00', lemonchiffon: '#fffacd',
  lightblue: '#add8e6', lightcoral: '#f08080', lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3', lightgreen: '#90ee90', lightgrey: '#d3d3d3', lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a', lightseagreen: '#20b2aa', lightskyblue: '#87cefa', lightslategray: '#778899',
  lightslategrey: '#778899', lightsteelblue: '#b0c4de', lightyellow: '#ffffe0', lime: '#00ff00',
  limegreen: '#32cd32', linen: '#faf0e6', magenta: '#ff00ff', maroon: '#800000', mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd', mediumorchid: '#ba55d3', mediumpurple: '#9370db', mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585', midnightblue: '#191970', mintcream: '#f5fffa', mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5', navajowhite: '#ffdead', navy: '#000080', oldlace: '#fdf5e6', olive: '#808000',
  olivedrab: '#6b8e23', orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6', palegoldenrod: '#eee8aa',
  palegreen: '#98fb98', paleturquoise: '#afeeee', palevioletred: '#db7093', papayawhip: '#ffefd5',
  peachpuff: '#ffdab9', peru: '#cd853f', pink: '#ffc0cb', plum: '#dda0dd', powderblue: '#b0e0e6',
  purple: '#800080', rebeccapurple: '#663399', red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1',
  saddlebrown: '#8b4513', salmon: '#fa8072', sandybrown: '#f4a460', seagreen: '#2e8b57', seashell: '#fff5ee',
  sienna: '#a0522d', silver: '#c0c0c0', skyblue: '#87ceeb', slateblue: '#6a5acd', slategray: '#708090',
  slategrey: '#708090', snow: '#fffafa', springgreen: '#00ff7f', steelblue: '#4682b4', tan: '#d2b48c',
  teal: '#008080', thistle: '#d8bfd8', tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee',
  wheat: '#f5deb3', white: '#ffffff', whitesmoke: '#f5f5f5', yellow: '#ffff00', yellowgreen: '#9acd32'
};

// Color conversion utilities
function normalizeHex(hex) {
  hex = hex.toLowerCase();
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

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

function colorToHex(color) {
  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
  }
  
  // Handle hsl/hsla
  const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%,?\s*(\d+)%/);
  if (hslMatch) {
    return hslToHex(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
  }
  
  // Handle hex
  const hexMatch = color.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/);
  if (hexMatch) {
    return normalizeHex(hexMatch[0]);
  }
  
  return null;
}
