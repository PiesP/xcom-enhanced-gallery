// Temporary script to test contrast calculations
function parseColor(color) {
  // Simple hex parser
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}

function computeRelativeLuminance(color) {
  const { r, g, b } = parseColor(color);
  const toLinear = c => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function computeContrastRatio(fg, bg) {
  const L1 = computeRelativeLuminance(fg);
  const L2 = computeRelativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Test the contrast between light backgrounds and black text
console.log('=== Current test colors (too high contrast) ===');
const originalSamples = ['#fafafa', '#f5f5f5'];
const textColor = '#000000';
const threshold = 4.5;

originalSamples.forEach(bg => {
  const ratio = computeContrastRatio(textColor, bg);
  console.log(
    `${bg} vs ${textColor}: ${ratio.toFixed(3)} ${ratio < threshold ? '(SOLID needed)' : '(GLASS ok)'}`
  );
});

// Find colors that give contrast < 4.5 with black text
console.log('\n=== Finding low contrast colors ===');
const testColors = ['#404040', '#505050', '#606060', '#656565', '#707070'];
testColors.forEach(bg => {
  const ratio = computeContrastRatio(textColor, bg);
  console.log(
    `${bg} vs ${textColor}: ${ratio.toFixed(3)} ${ratio < threshold ? '(SOLID needed)' : '(GLASS ok)'}`
  );
});

// Test blended contrast with scrim overlays
console.log('\n=== Testing blended contrast (scrim simulation) ===');
function blendColors(bg, overlay, alpha) {
  const bgColor = parseColor(bg);
  const overlayColor = parseColor(overlay);
  const r = Math.round(bgColor.r * (1 - alpha) + overlayColor.r * alpha);
  const g = Math.round(bgColor.g * (1 - alpha) + overlayColor.g * alpha);
  const b = Math.round(bgColor.b * (1 - alpha) + overlayColor.b * alpha);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const testBg = '#303030'; // Even darker
// For black text (#000000), escalation uses WHITE overlay to brighten the background
const overlayColor = '#ffffff'; // white overlay for black text
const scrimAlphas = [0, 0.22, 0.34, 0.46];

console.log(`Testing ${testBg} background with black text ${textColor}:`);
scrimAlphas.forEach(alpha => {
  const blended = blendColors(testBg, overlayColor, alpha);
  const ratio = computeContrastRatio(textColor, blended);
  console.log(
    `${testBg} + ${(alpha * 100).toFixed(0)}% white overlay = ${blended}: ${ratio.toFixed(3)} ${ratio >= threshold ? '(PASS)' : '(FAIL)'}`
  );
});

// Test hysteresis test colors
console.log('\n=== Testing hysteresis test colors ===');
const hysteresisColors = ['#4d4d4d', '#606060'];
hysteresisColors.forEach(bg => {
  console.log(`\nTesting ${bg}:`);
  const baseRatio = computeContrastRatio(textColor, bg);
  console.log(`  Base contrast: ${baseRatio.toFixed(3)}`);

  // Test all scrim levels with white overlay (for black text)
  let allScrimsFail = true;
  scrimAlphas.slice(1).forEach(alpha => {
    // skip 0% (glass)
    const blended = blendColors(bg, overlayColor, alpha);
    const ratio = computeContrastRatio(textColor, blended);
    const passes = ratio >= threshold;
    console.log(
      `  + ${(alpha * 100).toFixed(0)}% white: ${ratio.toFixed(3)} ${passes ? '(PASS)' : '(FAIL)'}`
    );
    if (passes) allScrimsFail = false;
  });

  console.log(`  → Should go to solid: ${allScrimsFail ? 'YES' : 'NO'}`);
});

// Test with colors that should give contrast < 4.5 even with scrim
const extremeLowContrastSamples = ['#404040', '#505050'];
let min = Infinity;
for (const bg of extremeLowContrastSamples) {
  const ratio = computeContrastRatio(textColor, bg);
  if (ratio < min) min = ratio;
}
console.log(`\n=== Extreme low contrast test colors ===`);
console.log(`Colors: ${extremeLowContrastSamples.join(', ')}`);
console.log(`Minimum contrast: ${min.toFixed(3)}`);
console.log(`Should switch to solid: ${min < threshold ? 'YES' : 'NO'}`);
