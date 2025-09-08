// 디자인 토큰 위반 사항을 찾는 스크립트
import fs from 'fs';
import path from 'path';

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

function analyzeViolations() {
  const cssFiles = findCSSModules('src');

  console.log('=== Color Violations ===');
  cssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const colorMatches = content.match(
      /(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|hsl\([^)]+\)|rgba\([^)]+\)|hsla\([^)]+\))/g
    );
    if (colorMatches) {
      const hardcoded = colorMatches.filter(
        color =>
          !color.includes('var(') &&
          !color.includes('oklch(') &&
          color !== '#fff' &&
          color !== '#000'
      );
      if (hardcoded.length > 0) {
        console.log(`${file}: ${hardcoded.join(', ')}`);
      }
    }
  });

  console.log('\n=== Shadow Violations ===');
  cssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const shadowMatches = content.match(/box-shadow:\s*[^;]+(?<!var\([^)]+\))/g);
    if (shadowMatches) {
      const hardcoded = shadowMatches.filter(
        shadow => !shadow.includes('var(') && shadow !== 'box-shadow: none'
      );
      if (hardcoded.length > 0) {
        console.log(`${file}: ${hardcoded.join(', ')}`);
      }
    }
  });
}

analyzeViolations();
