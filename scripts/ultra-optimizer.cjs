// 극도 최적화된 유저스크립트 생성 도구
const fs = require('fs');
const path = require('path');

class UltraOptimizer {
  constructor() {
    this.optimizations = [];
  }

  // 중복 문자열 패턴 최적화
  optimizeDuplicateStrings(code) {
    const duplicates = new Map();
    const threshold = 20; // 20자 이상 문자열만 대상

    // 문자열 패턴 찾기
    const stringPatterns = [/"[^"]{20,}"/g, /'[^']{20,}'/g, /`[^`]{20,}`/g];

    stringPatterns.forEach(pattern => {
      const matches = code.match(pattern) || [];
      matches.forEach(match => {
        const key = match.slice(1, -1); // 따옴표 제거
        if (key.length >= threshold) {
          duplicates.set(key, (duplicates.get(key) || 0) + 1);
        }
      });
    });

    // 2번 이상 등장하는 문자열을 변수로 추출
    let optimizedCode = code;
    let declarations = [];
    let savings = 0;

    duplicates.forEach((count, str) => {
      if (count > 1 && str.length > 15) {
        const varName = `_s${declarations.length}`;
        declarations.push(`var ${varName}="${str}";`);

        // 모든 occurrence를 변수로 교체
        const regex = new RegExp(`["'\`]${str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\`]`, 'g');
        optimizedCode = optimizedCode.replace(regex, varName);

        const savedBytes =
          (str.length + 2 - varName.length) * (count - 1) -
          declarations[declarations.length - 1].length;
        if (savedBytes > 0) {
          savings += savedBytes;
          this.optimizations.push(
            `문자열 중복 제거: "${str.substring(0, 30)}..." (${savedBytes}B 절약)`
          );
        }
      }
    });

    if (declarations.length > 0) {
      // 선언부를 파일 상단에 추가
      const insertPoint = optimizedCode.indexOf('(function(){') + '(function(){'.length;
      optimizedCode =
        optimizedCode.slice(0, insertPoint) +
        '\n' +
        declarations.join('') +
        optimizedCode.slice(insertPoint);
    }

    return { code: optimizedCode, savings };
  }

  // CSS 클래스명 최적화
  optimizeCSSClassNames(code) {
    const classMap = new Map();
    let classCounter = 0;
    let savings = 0;

    // 긴 CSS 클래스명 찾기 (10자 이상)
    const classPattern = /className\s*[=:]\s*["']([^"']{10,})["']/g;
    let match;

    while ((match = classPattern.exec(code)) !== null) {
      const originalClass = match[1];
      if (!classMap.has(originalClass)) {
        const shortName = `c${classCounter++}`;
        classMap.set(originalClass, shortName);

        if (originalClass.length > shortName.length) {
          savings += originalClass.length - shortName.length;
        }
      }
    }

    // 클래스명 교체
    let optimizedCode = code;
    classMap.forEach((shortName, originalName) => {
      const regex = new RegExp(
        `(className\\s*[=:]\\s*["'])${originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`,
        'g'
      );
      optimizedCode = optimizedCode.replace(regex, `$1${shortName}$2`);

      if (originalName.length > 15) {
        this.optimizations.push(
          `CSS 클래스명 단축: "${originalName}" → "${shortName}" (${originalName.length - shortName.length}B 절약)`
        );
      }
    });

    return { code: optimizedCode, savings };
  }

  // 공백 최적화 (더 공격적)
  optimizeWhitespace(code) {
    let optimizedCode = code;
    let savings = 0;

    const originalLength = code.length;

    // 1. 연속된 공백을 단일 공백으로
    optimizedCode = optimizedCode.replace(/[ \t]+/g, ' ');

    // 2. 줄바꿈 주변 공백 제거
    optimizedCode = optimizedCode.replace(/\s*\n\s*/g, '\n');

    // 3. 함수 선언 주변 공백 최적화
    optimizedCode = optimizedCode.replace(/\s*{\s*/g, '{');
    optimizedCode = optimizedCode.replace(/\s*}\s*/g, '}');
    optimizedCode = optimizedCode.replace(/\s*;\s*/g, ';');
    optimizedCode = optimizedCode.replace(/\s*,\s*/g, ',');
    optimizedCode = optimizedCode.replace(/\s*:\s*/g, ':');

    // 4. 연산자 주변 공백 최적화 (안전한 것들만)
    optimizedCode = optimizedCode.replace(/\s*===\s*/g, '===');
    optimizedCode = optimizedCode.replace(/\s*!==\s*/g, '!==');
    optimizedCode = optimizedCode.replace(/\s*&&\s*/g, '&&');
    optimizedCode = optimizedCode.replace(/\s*\|\|\s*/g, '||');

    // 5. 불필요한 줄바꿈 제거
    optimizedCode = optimizedCode.replace(/\n+/g, '\n');

    savings = originalLength - optimizedCode.length;

    if (savings > 0) {
      this.optimizations.push(`공백 최적화: ${savings}B 절약`);
    }

    return { code: optimizedCode, savings };
  }

  // 변수명 단축 (안전한 범위에서)
  optimizeVariableNames(code) {
    let optimizedCode = code;
    let savings = 0;

    // 긴 변수명을 찾아서 단축 (10자 이상, 스네이크 케이스)
    const longVarPattern = /\b([a-z][a-zA-Z0-9_]{10,})\b/g;
    const varMap = new Map();
    let varCounter = 0;

    const matches = [...code.matchAll(longVarPattern)];
    const varFrequency = new Map();

    // 변수 사용 빈도 계산
    matches.forEach(match => {
      const varName = match[1];
      if (varName.includes('_') && !varName.startsWith('GM_')) {
        varFrequency.set(varName, (varFrequency.get(varName) || 0) + 1);
      }
    });

    // 자주 사용되는 변수만 단축 (3회 이상)
    varFrequency.forEach((count, varName) => {
      if (count >= 3 && varName.length > 8) {
        const shortName = `v${varCounter++}`;
        varMap.set(varName, shortName);

        const regex = new RegExp(`\\b${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        optimizedCode = optimizedCode.replace(regex, shortName);

        const saved = (varName.length - shortName.length) * count;
        savings += saved;

        if (saved > 20) {
          this.optimizations.push(`변수명 단축: "${varName}" → "${shortName}" (${saved}B 절약)`);
        }
      }
    });

    return { code: optimizedCode, savings };
  }

  // 불필요한 세미콜론 제거
  removeSemicolons(code) {
    let optimizedCode = code;
    let savings = 0;

    const originalLength = code.length;

    // 줄 끝의 세미콜론 제거 (안전한 경우만)
    optimizedCode = optimizedCode.replace(/;(\s*\n)/g, '$1');
    optimizedCode = optimizedCode.replace(/;(\s*})/g, '$1');

    savings = originalLength - optimizedCode.length;

    if (savings > 0) {
      this.optimizations.push(`세미콜론 제거: ${savings}B 절약`);
    }

    return { code: optimizedCode, savings };
  }

  // 종합 최적화 실행
  ultraOptimize(inputFile, outputFile) {
    console.log('🚀 Ultra Optimization 시작...\n');

    const originalCode = fs.readFileSync(inputFile, 'utf8');
    const originalSize = originalCode.length;

    let currentCode = originalCode;
    let totalSavings = 0;

    // 1. 중복 문자열 최적화
    console.log('📝 중복 문자열 최적화...');
    const stringOpt = this.optimizeDuplicateStrings(currentCode);
    currentCode = stringOpt.code;
    totalSavings += stringOpt.savings;

    // 2. CSS 클래스명 최적화
    console.log('🎨 CSS 클래스명 최적화...');
    const cssOpt = this.optimizeCSSClassNames(currentCode);
    currentCode = cssOpt.code;
    totalSavings += cssOpt.savings;

    // 3. 공백 최적화
    console.log('⚡ 공백 최적화...');
    const whitespaceOpt = this.optimizeWhitespace(currentCode);
    currentCode = whitespaceOpt.code;
    totalSavings += whitespaceOpt.savings;

    // 4. 변수명 최적화
    console.log('🔤 변수명 최적화...');
    const varOpt = this.optimizeVariableNames(currentCode);
    currentCode = varOpt.code;
    totalSavings += varOpt.savings;

    // 5. 세미콜론 제거
    console.log('🧹 세미콜론 정리...');
    const semicolonOpt = this.removeSemicolons(currentCode);
    currentCode = semicolonOpt.code;
    totalSavings += semicolonOpt.savings;

    // 결과 저장
    fs.writeFileSync(outputFile, currentCode);

    // 결과 리포트
    const finalSize = currentCode.length;
    const compressionRatio = (((originalSize - finalSize) / originalSize) * 100).toFixed(2);

    console.log('\n📊 Ultra Optimization 결과:');
    console.log('='.repeat(50));
    console.log(`원본 크기: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`최적화 후: ${(finalSize / 1024).toFixed(1)}KB`);
    console.log(`절약된 크기: ${(totalSavings / 1024).toFixed(1)}KB (${compressionRatio}%)`);
    console.log(`출력 파일: ${outputFile}`);

    console.log('\n🔧 적용된 최적화:');
    this.optimizations.forEach((opt, index) => {
      console.log(`   ${index + 1}. ${opt}`);
    });

    return {
      originalSize,
      finalSize,
      savings: totalSavings,
      compressionRatio: parseFloat(compressionRatio),
      optimizations: this.optimizations,
    };
  }
}

// 실행 부분
if (require.main === module) {
  const optimizer = new UltraOptimizer();

  const inputFile = path.join(process.cwd(), 'dist', 'xcom-enhanced-gallery.user.js');
  const outputFile = path.join(process.cwd(), 'dist', 'xcom-enhanced-gallery.ultra.user.js');

  if (fs.existsSync(inputFile)) {
    optimizer.ultraOptimize(inputFile, outputFile);
  } else {
    console.error('❌ 입력 파일을 찾을 수 없습니다. 먼저 빌드를 실행하세요.');
  }
}

module.exports = UltraOptimizer;
