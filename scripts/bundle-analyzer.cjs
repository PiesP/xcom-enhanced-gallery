// Bundle Analysis and Optimization Tools

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class BundleOptimizer {
  constructor() {
    this.results = {};
  }

  // Gzip 압축 시뮬레이션
  simulateGzipCompression(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const gzipped = zlib.gzipSync(content);

      const originalSize = Buffer.byteLength(content, 'utf8');
      const gzippedSize = gzipped.length;
      const compressionRatio = (((originalSize - gzippedSize) / originalSize) * 100).toFixed(2);

      return {
        originalSize,
        gzippedSize,
        compressionRatio: `${compressionRatio}%`,
        savings: originalSize - gzippedSize,
      };
    } catch (error) {
      console.error('Gzip simulation failed:', error);
      return null;
    }
  }

  // Brotli 압축 시뮬레이션
  simulateBrotliCompression(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const brotliCompressed = zlib.brotliCompressSync(content);

      const originalSize = Buffer.byteLength(content, 'utf8');
      const brotliSize = brotliCompressed.length;
      const compressionRatio = (((originalSize - brotliSize) / originalSize) * 100).toFixed(2);

      return {
        originalSize,
        brotliSize,
        compressionRatio: `${compressionRatio}%`,
        savings: originalSize - brotliSize,
      };
    } catch (error) {
      console.error('Brotli simulation failed:', error);
      return null;
    }
  }

  // 코드 분석
  analyzeCode(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // 기본 통계
      const lines = content.split('\n').length;
      const characters = content.length;
      const nonWhitespaceChars = content.replace(/\s/g, '').length;
      const whitespaceRatio = (((characters - nonWhitespaceChars) / characters) * 100).toFixed(2);

      // 패턴 분석
      const patterns = {
        functions: (content.match(/function\s+\w+/g) || []).length,
        arrowFunctions: (content.match(/=>\s*[{(]/g) || []).length,
        variables: (content.match(/(?:var|let|const)\s+\w+/g) || []).length,
        comments: (content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length,
        strings: (content.match(/"[^"]*"|'[^']*'|`[^`]*`/g) || []).length,
        console: (content.match(/console\.\w+/g) || []).length,
        performance: (content.match(/performance\.\w+/g) || []).length,
      };

      // 중복 코드 패턴 검사
      const duplicates = this.findDuplicatePatterns(content);

      return {
        basic: {
          lines,
          characters,
          nonWhitespaceChars,
          whitespaceRatio: `${whitespaceRatio}%`,
        },
        patterns,
        duplicates: duplicates.length,
        potentialSavings: this.calculatePotentialSavings(content, patterns, duplicates),
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      return null;
    }
  }

  // 중복 패턴 찾기
  findDuplicatePatterns(content) {
    const duplicates = [];
    const patterns = [
      // 긴 문자열 패턴 (20자 이상)
      /"[^"]{20,}"/g,
      /'[^']{20,}'/g,
      // 반복되는 함수 호출 패턴
      /\w+\.\w+\([^)]*\)/g,
      // CSS 클래스명 패턴
      /className\s*=\s*["'][^"']{10,}["']/g,
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      const frequency = {};

      matches.forEach(match => {
        frequency[match] = (frequency[match] || 0) + 1;
      });

      Object.entries(frequency).forEach(([pattern, count]) => {
        if (count > 1) {
          duplicates.push({
            pattern: pattern.substring(0, 50) + (pattern.length > 50 ? '...' : ''),
            count,
            potentialSavings: pattern.length * (count - 1),
          });
        }
      });
    });

    return duplicates.sort((a, b) => b.potentialSavings - a.potentialSavings).slice(0, 10);
  }

  // 잠재적 절약 공간 계산
  calculatePotentialSavings(content, patterns, duplicates) {
    let savings = 0;

    // 콘솔 로그 제거로 인한 절약
    if (patterns.console > 0) {
      savings += patterns.console * 15; // 평균 console.log 길이 추정
    }

    // 성능 마킹 제거로 인한 절약
    if (patterns.performance > 0) {
      savings += patterns.performance * 20; // 평균 performance call 길이 추정
    }

    // 중복 코드 제거로 인한 절약
    duplicates.forEach(dup => {
      savings += dup.potentialSavings;
    });

    // 공백 최적화로 인한 절약 (현재 공백의 50% 제거 가능하다고 가정)
    const whitespaceChars = content.length - content.replace(/\s/g, '').length;
    savings += Math.floor(whitespaceChars * 0.5);

    return {
      total: savings,
      breakdown: {
        console: patterns.console * 15,
        performance: patterns.performance * 20,
        duplicates: duplicates.reduce((sum, dup) => sum + dup.potentialSavings, 0),
        whitespace: Math.floor(whitespaceChars * 0.5),
      },
    };
  }

  // 종합 분석 실행
  analyzeBundle(filePath) {
    const fileName = path.basename(filePath);

    console.log(`\n🔍 ${fileName} 번들 분석 시작...`);

    const gzipAnalysis = this.simulateGzipCompression(filePath);
    const brotliAnalysis = this.simulateBrotliCompression(filePath);
    const codeAnalysis = this.analyzeCode(filePath);

    const result = {
      file: fileName,
      path: filePath,
      timestamp: new Date().toISOString(),
      compression: {
        gzip: gzipAnalysis,
        brotli: brotliAnalysis,
      },
      code: codeAnalysis,
    };

    this.displayResults(result);
    this.saveResults(result);

    return result;
  }

  // 결과 출력
  displayResults(result) {
    console.log('\n📊 압축 분석 결과:');

    if (result.compression.gzip) {
      const g = result.compression.gzip;
      console.log(
        `   Gzip: ${(g.originalSize / 1024).toFixed(1)}KB → ${(g.gzippedSize / 1024).toFixed(1)}KB (${g.compressionRatio} 압축)`
      );
    }

    if (result.compression.brotli) {
      const b = result.compression.brotli;
      console.log(
        `   Brotli: ${(b.originalSize / 1024).toFixed(1)}KB → ${(b.brotliSize / 1024).toFixed(1)}KB (${b.compressionRatio} 압축)`
      );
    }

    if (result.code) {
      console.log('\n📝 코드 분석:');
      console.log(`   라인 수: ${result.code.basic.lines.toLocaleString()}`);
      console.log(`   문자 수: ${result.code.basic.characters.toLocaleString()}`);
      console.log(`   공백 비율: ${result.code.basic.whitespaceRatio}`);
      console.log(
        `   함수: ${result.code.patterns.functions + result.code.patterns.arrowFunctions}`
      );
      console.log(`   변수: ${result.code.patterns.variables}`);
      console.log(`   Console 호출: ${result.code.patterns.console}`);
      console.log(`   중복 패턴: ${result.code.duplicates}개`);

      if (result.code.potentialSavings.total > 0) {
        console.log(
          `\n💡 최적화 잠재력: ${(result.code.potentialSavings.total / 1024).toFixed(1)}KB 절약 가능`
        );
        console.log(
          `   - Console 제거: ${(result.code.potentialSavings.breakdown.console / 1024).toFixed(1)}KB`
        );
        console.log(
          `   - Performance 제거: ${(result.code.potentialSavings.breakdown.performance / 1024).toFixed(1)}KB`
        );
        console.log(
          `   - 중복 제거: ${(result.code.potentialSavings.breakdown.duplicates / 1024).toFixed(1)}KB`
        );
        console.log(
          `   - 공백 최적화: ${(result.code.potentialSavings.breakdown.whitespace / 1024).toFixed(1)}KB`
        );
      }
    }
  }

  // 결과 저장
  saveResults(result) {
    try {
      const resultsDir = path.join(process.cwd(), 'dist');
      const resultsFile = path.join(resultsDir, 'bundle-analysis.json');

      let allResults = [];
      if (fs.existsSync(resultsFile)) {
        const existing = fs.readFileSync(resultsFile, 'utf8');
        allResults = JSON.parse(existing);
      }

      allResults.push(result);

      // 최근 10개 결과만 유지
      if (allResults.length > 10) {
        allResults = allResults.slice(-10);
      }

      fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
      console.log(`\n📄 분석 결과가 ${resultsFile}에 저장되었습니다.`);
    } catch (error) {
      console.error('결과 저장 실패:', error);
    }
  }

  // 여러 파일 비교 분석
  compareBuilds(filePaths) {
    console.log('\n🔄 빌드 비교 분석 시작...\n');

    const results = [];
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        results.push(this.analyzeBundle(filePath));
      } else {
        console.warn(`⚠️  파일을 찾을 수 없습니다: ${filePath}`);
      }
    });

    if (results.length > 1) {
      this.displayComparison(results);
    }

    return results;
  }

  // 비교 결과 출력
  displayComparison(results) {
    console.log('\n🏆 빌드 비교 요약:');
    console.log('='.repeat(60));

    // 파일 크기 비교
    console.log('\n📏 파일 크기:');
    results.forEach((result, index) => {
      const size = result.compression.gzip ? result.compression.gzip.originalSize : 0;
      console.log(`   ${index + 1}. ${result.file}: ${(size / 1024).toFixed(1)}KB`);
    });

    // Gzip 압축 비교
    console.log('\n🗜️  Gzip 압축:');
    results.forEach((result, index) => {
      if (result.compression.gzip) {
        const g = result.compression.gzip;
        console.log(
          `   ${index + 1}. ${result.file}: ${(g.gzippedSize / 1024).toFixed(1)}KB (${g.compressionRatio})`
        );
      }
    });

    // 최적화 잠재력 비교
    console.log('\n💡 최적화 잠재력:');
    results.forEach((result, index) => {
      if (result.code && result.code.potentialSavings) {
        const savings = result.code.potentialSavings.total;
        console.log(`   ${index + 1}. ${result.file}: ${(savings / 1024).toFixed(1)}KB 절약 가능`);
      }
    });

    // 승자 선정
    const bestGzip = results.reduce((best, current) => {
      const bestSize = best.compression.gzip?.gzippedSize || Infinity;
      const currentSize = current.compression.gzip?.gzippedSize || Infinity;
      return currentSize < bestSize ? current : best;
    });

    console.log(`\n🎯 최고 압축률: ${bestGzip.file}`);
  }
}

// 실행 부분
if (require.main === module) {
  const optimizer = new BundleOptimizer();

  const distPath = path.join(process.cwd(), 'dist');
  const files = [
    path.join(distPath, 'xcom-enhanced-gallery.user.js'),
    path.join(distPath, 'xcom-enhanced-gallery.rolldown.user.js'),
    path.join(distPath, 'xcom-enhanced-gallery.ultra.user.js'),
  ].filter(file => fs.existsSync(file));

  if (files.length > 0) {
    optimizer.compareBuilds(files);
  } else {
    console.error('❌ 분석할 빌드 파일이 없습니다. 먼저 빌드를 실행하세요.');
  }
}

module.exports = BundleOptimizer;
