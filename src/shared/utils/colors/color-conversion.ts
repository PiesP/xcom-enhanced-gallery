/**
 * @fileoverview 색상 변환 유틸리티 - HEX ↔ OKLCH 변환
 */

/**
 * RGB 값을 선형 RGB로 변환
 */
function sRGBToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * 선형 RGB를 sRGB로 변환
 */
function linearToSRGB(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * 16진수 색상을 RGB로 변환
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result?.[1] || !result[2] || !result[3]) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

/**
 * RGB를 XYZ로 변환 (D65 illuminant)
 */
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  // sRGB to linear RGB
  r = sRGBToLinear(r);
  g = sRGBToLinear(g);
  b = sRGBToLinear(b);

  // Linear RGB to XYZ (sRGB matrix)
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;

  return [x, y, z];
}

/**
 * XYZ를 OKLab으로 변환
 */
function xyzToOklab(x: number, y: number, z: number): [number, number, number] {
  // XYZ to LMS
  const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s = 0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z;

  // LMS to LMS'
  const lPrime = Math.cbrt(l);
  const mPrime = Math.cbrt(m);
  const sPrime = Math.cbrt(s);

  // LMS' to OKLab
  const L = 0.2104542553 * lPrime + 0.793617785 * mPrime - 0.0040720468 * sPrime;
  const A = 1.9779984951 * lPrime - 2.428592205 * mPrime + 0.4505937099 * sPrime;
  const B = 0.0259040371 * lPrime + 0.7827717662 * mPrime - 0.808675766 * sPrime;

  return [L, A, B];
}

/**
 * OKLab을 OKLCH로 변환
 */
function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;

  // Hue는 0-360 범위로 정규화
  if (H < 0) H += 360;

  return [L, C, H];
}

/**
 * OKLCH를 OKLab으로 변환
 */
function oklchToOklab(L: number, C: number, H: number): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  return [L, a, b];
}

/**
 * OKLab을 XYZ로 변환
 */
function oklabToXyz(L: number, a: number, b: number): [number, number, number] {
  // OKLab to LMS'
  const lPrime = L + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = L - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = L - 0.0894841775 * a - 1.291485548 * b;

  // LMS' to LMS
  const l = lPrime * lPrime * lPrime;
  const m = mPrime * mPrime * mPrime;
  const s = sPrime * sPrime * sPrime;

  // LMS to XYZ
  const x = +1.2270138511 * l - 0.5577999807 * m + 0.281256149 * s;
  const y = -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s;
  const z = -0.0763812845 * l - 0.4214933239 * m + 1.5861632204 * s;

  return [x, y, z];
}

/**
 * XYZ를 RGB로 변환
 */
function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  // XYZ to linear RGB
  let r = +3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  let g = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  let b = +0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  // Linear RGB to sRGB
  r = linearToSRGB(r);
  g = linearToSRGB(g);
  b = linearToSRGB(b);

  // 범위 제한
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));

  return [r, g, b];
}

/**
 * RGB를 16진수로 변환
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 16진수 색상을 OKLCH로 변환
 */
export function hexToOklch(hex: string): string {
  try {
    const [r, g, b] = hexToRgb(hex);
    const [x, y, z] = rgbToXyz(r, g, b);
    const [L, a, bLab] = xyzToOklab(x, y, z);
    const [lightness, chroma, hue] = oklabToOklch(L, a, bLab);

    // 정밀도 제한 (소수점 3자리)
    const L_rounded = Math.round(lightness * 1000) / 1000;
    const C_rounded = Math.round(chroma * 1000) / 1000;
    const H_rounded = Math.round(hue * 1000) / 1000;

    return `oklch(${L_rounded} ${C_rounded} ${H_rounded})`;
  } catch (error) {
    console.warn(`색상 변환 실패: ${hex}`, error);
    return hex; // 변환 실패 시 원본 반환
  }
}

/**
 * OKLCH 색상을 16진수로 변환
 */
export function oklchToHex(oklch: string): string {
  try {
    // OKLCH 문자열 파싱
    const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
    if (!match?.[1] || !match[2] || !match[3]) {
      throw new Error(`Invalid OKLCH format: ${oklch}`);
    }

    const L = parseFloat(match[1]);
    const C = parseFloat(match[2]);
    const H = parseFloat(match[3]);

    const [a, b] = oklchToOklab(L, C, H).slice(1) as [number, number];
    const [x, y, z] = oklabToXyz(L, a, b);
    const [r, g, bRgb] = xyzToRgb(x, y, z);

    return rgbToHex(r, g, bRgb);
  } catch (error) {
    console.warn(`OKLCH 변환 실패: ${oklch}`, error);
    return '#000000'; // 변환 실패 시 검은색 반환
  }
}

/**
 * 색상이 유효한 OKLCH 형식인지 확인
 */
export function isValidOklch(color: string): boolean {
  const oklchPattern =
    /^oklch\(\s*([01](?:\.\d+)?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/;
  const match = color.match(oklchPattern);

  if (!match?.[1] || !match[2] || !match[3]) return false;

  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);

  // 유효 범위 검증
  return L >= 0 && L <= 1 && C >= 0 && H >= 0 && H <= 360;
}

/**
 * 색상 대비율 계산 (WCAG 2.1 기준)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    let rgb: [number, number, number];

    if (color.startsWith('#')) {
      rgb = hexToRgb(color);
    } else if (color.startsWith('oklch(')) {
      const hex = oklchToHex(color);
      rgb = hexToRgb(hex);
    } else {
      throw new Error(`Unsupported color format: ${color}`);
    }

    // 상대적 휘도 계산
    const [r, g, b] = rgb.map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }) as [number, number, number];

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 기본 색상에서 색상 팔레트 생성
 */
export function generateColorPalette(baseColor: string): Record<string, string> {
  const baseHex = baseColor.startsWith('#') ? baseColor : oklchToHex(baseColor);
  const [r, g, b] = hexToRgb(baseHex);
  const [x, y, z] = rgbToXyz(r, g, b);
  const [L, a, bLab] = xyzToOklab(x, y, z);
  const [, C, H] = oklabToOklch(L, a, bLab);

  const palette: Record<string, string> = {};
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  shades.forEach(shade => {
    // 명도를 shade에 따라 조정
    let lightness: number;
    if (shade === 500) {
      lightness = L; // 기본 색상
    } else if (shade < 500) {
      // 밝은 색상 (50-400)
      const factor = (500 - shade) / 450; // 0-1 범위
      lightness = L + (0.95 - L) * factor;
    } else {
      // 어두운 색상 (600-950)
      const factor = (shade - 500) / 450; // 0-1 범위
      lightness = L * (1 - factor * 0.9);
    }

    // 채도 조정 (극값에서는 채도 감소)
    let adjustedChroma = C;
    if (shade <= 100 || shade >= 900) {
      adjustedChroma = C * 0.5;
    }

    palette[shade.toString()] =
      `oklch(${Math.round(lightness * 1000) / 1000} ${Math.round(adjustedChroma * 1000) / 1000} ${Math.round(H * 1000) / 1000})`;
  });

  return palette;
}
