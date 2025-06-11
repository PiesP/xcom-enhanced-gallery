// Copyright (c) 2024 X.com Enhanced Gallery
// Licensed under MIT License

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

/**
 * 빌드 결과 비교 도구
 * Vite와 Rolldown 빌드의 성능, 크기, 품질을 비교
 */

// 색상 출력을 위한 ANSI 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function getFileSizeAndContent(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      size: stats.size,
      content,
      lines: content.split('\n').length,
      chars: content.length,
    };
  } catch (error) {
    return null;
  }
}

function analyzeJavaScriptQuality(content) {
  const analysis = {
    functions: (content.match(/function\s+\w+|=>\s*{|\w+:\s*function/g) || []).length,
    variables: (content.match(/(?:var|let|const)\s+\w+/g) || []).length,
    comments: (content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length,
    minified: content.includes('function(') && !content.includes('\n  '),
    gzipEstimate: Math.ceil(content.length * 0.3), // 대략적인 gzip 추정
  };

  // 코드 복잡성 점수 (낮을수록 좋음)
  analysis.complexity = Math.floor(
    ((analysis.functions * 2 + analysis.variables * 1) / content.length) * 10000
  );

  return analysis;
}

function compareBuilds() {
  console.log(colorize('\n🔍 빌드 결과 비교 도구', 'cyan'));
  console.log(colorize('='.repeat(60), 'blue'));

  const distPath = path.join(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    console.error(colorize('❌ dist 폴더가 존재하지 않습니다. 먼저 빌드를 실행하세요.', 'red'));
    process.exit(1);
  }

  // 빌드된 파일들 찾기
  const files = fs.readdirSync(distPath);
  const userscriptFiles = files.filter(file => file.endsWith('.user.js'));

  if (userscriptFiles.length === 0) {
    console.error(colorize('❌ 유저스크립트 파일을 찾을 수 없습니다.', 'red'));
    process.exit(1);
  }

  console.log(colorize(`\n📁 분석할 파일: ${userscriptFiles.length}개`, 'yellow'));

  const results = [];

  userscriptFiles.forEach(filename => {
    const filePath = path.join(distPath, filename);
    const fileData = getFileSizeAndContent(filePath);

    if (!fileData) {
      console.warn(colorize(`⚠️ 파일을 읽을 수 없음: ${filename}`, 'yellow'));
      return;
    }

    const analysis = analyzeJavaScriptQuality(fileData.content);

    results.push({
      filename,
      ...fileData,
      analysis,
      buildType: filename.includes('.dev.') ? 'development' : 'production',
      bundler: filename.includes('rolldown') ? 'rolldown' : 'vite',
    });

    console.log(colorize(`\n📄 ${filename}`, 'bright'));
    console.log(`   크기: ${colorize(formatBytes(fileData.size), 'green')}`);
    console.log(`   라인: ${colorize(fileData.lines.toLocaleString(), 'blue')}`);
    console.log(`   문자: ${colorize(fileData.chars.toLocaleString(), 'blue')}`);
    console.log(`   함수: ${colorize(analysis.functions, 'cyan')}`);
    console.log(`   변수: ${colorize(analysis.variables, 'cyan')}`);
    console.log(`   주석: ${colorize(analysis.comments, 'cyan')}`);
    console.log(
      `   압축: ${colorize(analysis.minified ? '예' : '아니오', analysis.minified ? 'green' : 'red')}`
    );
    console.log(
      `   복잡도: ${colorize(analysis.complexity, analysis.complexity < 50 ? 'green' : analysis.complexity < 100 ? 'yellow' : 'red')}`
    );
    console.log(`   Gzip 추정: ${colorize(formatBytes(analysis.gzipEstimate), 'cyan')}`);
  });

  // 비교 분석
  if (results.length >= 2) {
    console.log(colorize('\n📊 비교 분석', 'cyan'));
    console.log(colorize('-'.repeat(60), 'blue'));

    // 프로덕션 빌드들 비교
    const prodBuilds = results.filter(r => r.buildType === 'production');
    if (prodBuilds.length >= 2) {
      const [build1, build2] = prodBuilds.slice(0, 2);
      const sizeDiff = ((build2.size - build1.size) / build1.size) * 100;
      const complexityDiff = build2.analysis.complexity - build1.analysis.complexity;

      console.log(colorize('\n🏭 프로덕션 빌드 비교:', 'bright'));
      console.log(`${build1.filename} vs ${build2.filename}`);
      console.log(
        `크기 차이: ${colorize(formatPercent(sizeDiff), sizeDiff < 0 ? 'green' : 'red')} (${formatBytes(Math.abs(build2.size - build1.size))})`
      );
      console.log(
        `복잡도 차이: ${colorize(complexityDiff >= 0 ? '+' + complexityDiff : complexityDiff, complexityDiff < 0 ? 'green' : 'red')}`
      );

      if (Math.abs(sizeDiff) > 5) {
        console.log(
          colorize(
            sizeDiff < 0 ? '✅ 두 번째 빌드가 더 효율적' : '⚠️ 첫 번째 빌드가 더 효율적',
            sizeDiff < 0 ? 'green' : 'yellow'
          )
        );
      }
    }

    // 개발/프로덕션 비교
    const devBuild = results.find(r => r.buildType === 'development');
    const prodBuild = results.find(r => r.buildType === 'production');

    if (devBuild && prodBuild) {
      const sizeDiff = ((devBuild.size - prodBuild.size) / prodBuild.size) * 100;

      console.log(colorize('\n🔧 개발/프로덕션 비교:', 'bright'));
      console.log(`크기 차이: ${colorize(formatPercent(sizeDiff), 'yellow')} (개발용이 더 큼)`);
      console.log(
        `압축 차이: 개발용 ${devBuild.analysis.minified ? '압축됨' : '비압축'}, 프로덕션 ${prodBuild.analysis.minified ? '압축됨' : '비압축'}`
      );
    }
  }

  // 권장사항
  console.log(colorize('\n💡 권장사항', 'cyan'));
  console.log(colorize('-'.repeat(60), 'blue'));

  const largestFile = results.reduce((prev, current) =>
    prev.size > current.size ? prev : current
  );
  if (largestFile.size > 500 * 1024) {
    // 500KB 이상
    console.log(
      colorize(
        `⚠️ ${largestFile.filename}이 크기가 큽니다 (${formatBytes(largestFile.size)})`,
        'yellow'
      )
    );
    console.log('   - Tree shaking 설정을 확인하세요');
    console.log('   - 불필요한 의존성이 포함되었는지 확인하세요');
  }

  const unminifiedFiles = results.filter(r => r.buildType === 'production' && !r.analysis.minified);
  if (unminifiedFiles.length > 0) {
    console.log(colorize('⚠️ 프로덕션 빌드가 압축되지 않았습니다', 'yellow'));
    console.log('   - minify 설정을 확인하세요');
  }

  const highComplexityFiles = results.filter(r => r.analysis.complexity > 100);
  if (highComplexityFiles.length > 0) {
    console.log(colorize('⚠️ 일부 파일의 복잡도가 높습니다', 'yellow'));
    console.log('   - 코드 분할을 고려하세요');
    console.log('   - 불필요한 함수나 변수를 제거하세요');
  }

  console.log(colorize('\n✅ 분석 완료', 'green'));

  // JSON 결과 저장
  const reportPath = path.join(distPath, 'build-comparison.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results,
        summary: {
          totalFiles: results.length,
          totalSize: results.reduce((sum, r) => sum + r.size, 0),
          averageComplexity:
            results.reduce((sum, r) => sum + r.analysis.complexity, 0) / results.length,
        },
      },
      null,
      2
    )
  );

  console.log(colorize(`📄 상세 보고서가 ${reportPath}에 저장되었습니다`, 'cyan'));
}

// 성능 테스트
function performanceBenchmark() {
  console.log(colorize('\n⚡ 성능 벤치마크', 'cyan'));
  console.log(colorize('='.repeat(60), 'blue'));

  const { execSync } = require('child_process');

  const tests = [
    { name: 'Vite 빌드', command: 'npm run build:compile' },
    { name: 'Rolldown 빌드', command: 'npm run build:rolldown' },
  ];

  const results = [];

  tests.forEach(test => {
    console.log(colorize(`\n🔄 ${test.name} 실행 중...`, 'yellow'));

    const start = performance.now();
    try {
      execSync(test.command, { stdio: 'pipe' });
      const end = performance.now();
      const duration = end - start;

      results.push({
        name: test.name,
        duration,
        success: true,
      });

      console.log(colorize(`✅ ${test.name} 완료: ${duration.toFixed(0)}ms`, 'green'));
    } catch (error) {
      results.push({
        name: test.name,
        duration: 0,
        success: false,
        error: error.message,
      });

      console.log(colorize(`❌ ${test.name} 실패`, 'red'));
    }
  });

  // 성능 비교
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length >= 2) {
    const [first, second] = successfulResults;
    const diff = ((second.duration - first.duration) / first.duration) * 100;

    console.log(colorize('\n📈 성능 비교:', 'bright'));
    console.log(
      `${second.name}이 ${first.name}보다 ${colorize(formatPercent(diff), diff < 0 ? 'green' : 'red')} ${diff < 0 ? '빠름' : '느림'}`
    );
    console.log(`절대 차이: ${Math.abs(second.duration - first.duration).toFixed(0)}ms`);
  }
}

// 메인 실행
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--benchmark') || args.includes('-b')) {
    performanceBenchmark();
  } else {
    compareBuilds();
  }
}

module.exports = {
  compareBuilds,
  performanceBenchmark,
  analyzeJavaScriptQuality,
};
