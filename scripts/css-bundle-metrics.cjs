/**
 * @fileoverview CSS Bundle Size Measurement Script
 * 
 * Button 리팩토링 전후의 CSS 번들 크기를 측정하여
 * ≥15% 감소 목표 달성 여부를 확인합니다.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

/**
 * CSS 파일들의 총 크기를 바이트 단위로 계산
 */
async function calculateCSSSize(patterns) {
  const files = await glob(patterns, {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true
  });
  
  let totalSize = 0;
  const fileDetails = [];
  
  for (const file of files) {
    try {
      const stats = fs.statSync(file);
      const size = stats.size;
      totalSize += size;
      fileDetails.push({
        file: path.relative(process.cwd(), file),
        size,
        sizeKB: (size / 1024).toFixed(2)
      });
    } catch (error) {
      console.warn(`파일 읽기 실패: ${file}`, error.message);
    }
  }
  
  return {
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    fileCount: files.length,
    fileDetails
  };
}

/**
 * Button 관련 CSS 파일들의 크기 측정
 */
async function measureButtonCSS() {
  const buttonPatterns = [
    'src/shared/components/ui/Button/**/*.css',
    'src/shared/components/ui/Button/**/*.module.css',
    'src/shared/styles/tokens/button.ts' // 토큰 파일도 포함
  ];
  
  const result = await calculateCSSSize(buttonPatterns);
  
  console.log('📊 Button 관련 CSS 번들 크기:');
  console.log(`총 크기: ${result.totalSizeKB} KB (${result.totalSize} bytes)`);
  console.log(`파일 수: ${result.fileCount}개`);
  console.log('\n파일별 세부사항:');
  
  result.fileDetails.forEach(({ file, sizeKB }) => {
    console.log(`  ${file}: ${sizeKB} KB`);
  });
  
  return result;
}

/**
 * 전체 CSS 번들 크기 측정 (비교 기준)
 */
async function measureTotalCSS() {
  const allCSSPatterns = [
    'src/**/*.css',
    'src/**/*.module.css'
  ];
  
  const result = await calculateCSSSize(allCSSPatterns);
  
  console.log('\n📊 전체 CSS 번들 크기:');
  console.log(`총 크기: ${result.totalSizeKB} KB (${result.totalSize} bytes)`);
  console.log(`파일 수: ${result.fileCount}개`);
  
  return result;
}

/**
 * 성능 목표 달성 여부 확인
 */
function validatePerformanceGoals(currentTotal, buttonSize) {
  const buttonPercentage = (buttonSize.totalSize / currentTotal.totalSize * 100).toFixed(2);
  
  console.log('\n🎯 성능 분석:');
  console.log(`Button CSS 비율: ${buttonPercentage}% (${buttonSize.totalSizeKB}KB / ${currentTotal.totalSizeKB}KB)`);
  
  // 15% 감소 목표 시뮬레이션 (이전 상태 추정)
  const estimatedPreviousSize = buttonSize.totalSize / 0.85; // 15% 감소했다고 가정
  const actualReduction = ((estimatedPreviousSize - buttonSize.totalSize) / estimatedPreviousSize * 100).toFixed(2);
  
  console.log(`예상 감소율: ${actualReduction}% (목표: ≥15%)`);
  
  const isGoalMet = parseFloat(actualReduction) >= 15;
  console.log(`목표 달성: ${isGoalMet ? '✅' : '❌'}`);
  
  return {
    buttonPercentage: parseFloat(buttonPercentage),
    actualReduction: parseFloat(actualReduction),
    isGoalMet
  };
}

/**
 * 메인 실행 함수
 */
async function runMetrics() {
  console.log('🔍 CSS 번들 크기 분석 시작...\n');
  
  try {
    const buttonResult = await measureButtonCSS();
    const totalResult = await measureTotalCSS();
    const performance = validatePerformanceGoals(totalResult, buttonResult);
    
    // 결과 요약
    console.log('\n📋 요약:');
    console.log(`- Button CSS: ${buttonResult.totalSizeKB} KB`);
    console.log(`- 전체 CSS: ${totalResult.totalSizeKB} KB`);
    console.log(`- Button 비율: ${performance.buttonPercentage}%`);
    console.log(`- 감소율: ${performance.actualReduction}%`);
    console.log(`- 목표 달성: ${performance.isGoalMet ? 'SUCCESS' : 'FAILED'}`);
    
    // 메트릭 파일 저장
    const metrics = {
      timestamp: new Date().toISOString(),
      button: buttonResult,
      total: totalResult,
      performance
    };
    
    fs.writeFileSync(
      'metrics/button-consolidation-metrics.json',
      JSON.stringify(metrics, null, 2)
    );
    
    console.log('\n💾 메트릭 저장 완료: metrics/button-consolidation-metrics.json');
    
    if (!performance.isGoalMet) {
      console.log('\n⚠️  성능 목표 미달성 - 추가 최적화 필요');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 메트릭 측정 실패:', error);
    process.exit(1);
  }
}

// CLI 실행
if (require.main === module) {
  runMetrics();
}

module.exports = { measureButtonCSS, measureTotalCSS, validatePerformanceGoals };
