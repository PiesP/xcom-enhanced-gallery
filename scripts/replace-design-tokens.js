// 디자인 토큰 자동 교체 스크립트
import fs from 'fs';
import path from 'path';

// 색상 교체 맵핑
const colorMappings = {
  // 기본 색상
  'rgb(255, 255, 255)': 'var(--color-base-white)',
  'rgb(0, 0, 0)': 'var(--color-base-black)',
  '#fff': 'var(--color-base-white)',
  '#000': 'var(--color-base-black)',

  // RGBA 투명도 색상
  'rgba(255, 255, 255, 0.7)': 'var(--color-glass-bg)',
  'rgba(255, 255, 255, 0.6)': 'var(--color-glass-bg)',
  'rgba(255, 255, 255, 0.9)': 'var(--color-glass-bg)',
  'rgba(255, 255, 255, 0.95)': 'var(--color-glass-bg)',
  'rgba(255, 255, 255, 0.99)': 'var(--color-glass-bg)',
  'rgba(255, 255, 255, 1)': 'var(--color-base-white)',
  'rgba(255, 255, 255, 0.3)': 'var(--color-glass-border)',
  'rgba(255, 255, 255, 0.2)': 'var(--color-glass-border)',
  'rgba(255, 255, 255, 0.1)': 'var(--color-overlay-light)',
  'rgba(255, 255, 255, 0.05)': 'var(--color-overlay-light)',

  // 검은색 투명도
  'rgba(0, 0, 0, 0.95)': 'var(--color-overlay-backdrop)',
  'rgba(0, 0, 0, 0.9)': 'var(--color-overlay-strong)',
  'rgba(0, 0, 0, 0.8)': 'var(--color-overlay-strong)',
  'rgba(0, 0, 0, 0.6)': 'var(--color-overlay-medium)',
  'rgba(0, 0, 0, 0.5)': 'var(--color-overlay-medium)',
  'rgba(0, 0, 0, 0.4)': 'var(--color-overlay-medium)',
  'rgba(0, 0, 0, 0.3)': 'var(--color-overlay-medium)',
  'rgba(0, 0, 0, 0.2)': 'var(--color-overlay-light)',
  'rgba(0, 0, 0, 0.15)': 'var(--color-overlay-light)',
  'rgba(0, 0, 0, 0.1)': 'var(--color-overlay-light)',
  'rgba(0, 0, 0, 0.05)': 'var(--color-overlay-light)',

  // 특정 컴포넌트 색상
  'rgb(240, 240, 240)': 'var(--color-gray-50)',
  'rgb(220, 220, 220)': 'var(--color-gray-200)',
  'rgb(30, 41, 59)': 'var(--color-gray-900)',
  'rgba(30, 41, 59, 0.95)': 'var(--color-gray-900)',
  'rgba(51, 65, 85, 0.95)': 'var(--color-gray-700)',
  'rgba(245, 245, 245, 0.98)': 'var(--color-gray-50)',
  'rgba(15, 23, 42, 0.99)': 'var(--color-gray-900)',
  'rgba(15, 23, 42, 1)': 'var(--color-gray-900)',

  // 브랜드/액션 색상
  'rgb(0, 100, 200)': 'var(--color-blue-500)',
  'rgb(0, 150, 50)': 'var(--color-green-500)',
  'rgb(200, 0, 0)': 'var(--color-red-500)',
  'rgb(76, 175, 80)': 'var(--color-green-500)',
  'rgba(76, 175, 80, 0.9)': 'var(--color-green-500)',

  // 특정 트위터 색상
  'rgba(83, 100, 113, 0.1)': 'var(--color-overlay-light)',

  // 테마별 색상
  'rgb(40, 40, 40)': 'var(--color-gray-700)',
};

// shadow 교체 맵핑
const shadowMappings = {
  'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5)': 'box-shadow: var(--shadow-lg)',
  'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15)': 'box-shadow: var(--shadow-md)',
  'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)': 'box-shadow: var(--shadow-sm)',
  'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4)': 'box-shadow: var(--shadow-lg)',
  'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2)': 'box-shadow: var(--shadow-md)',
  'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6)': 'box-shadow: var(--shadow-lg)',
  'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4)': 'box-shadow: var(--shadow-md)',
  'box-shadow: 0 0.125em 0.5em rgba(0, 0, 0, 0.15)': 'box-shadow: var(--shadow-sm)',
  'box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3)': 'box-shadow: var(--shadow-lg)',
  'box-shadow: 0 0 8px HighlightText': 'box-shadow: var(--shadow-md)',
  'box-shadow: 0 0 8px Highlight': 'box-shadow: var(--shadow-md)',
};

function replaceCSSTokens(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 색상 교체
  for (const [oldColor, newToken] of Object.entries(colorMappings)) {
    const oldContent = content;
    content = content.replace(new RegExp(escapeRegExp(oldColor), 'g'), newToken);
    if (content !== oldContent) {
      modified = true;
      console.log(`${filePath}: ${oldColor} → ${newToken}`);
    }
  }

  // shadow 교체
  for (const [oldShadow, newToken] of Object.entries(shadowMappings)) {
    const oldContent = content;
    content = content.replace(new RegExp(escapeRegExp(oldShadow), 'g'), newToken);
    if (content !== oldContent) {
      modified = true;
      console.log(`${filePath}: ${oldShadow} → ${newToken}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// CSS 모듈 파일 검색 함수
function findCSSModules(dir) {
  const files = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findCSSModules(fullPath));
    } else if (entry.endsWith('.module.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

// 실행
const cssFiles = findCSSModules('src');
cssFiles.forEach(replaceCSSTokens);

console.log('디자인 토큰 교체 완료!');
