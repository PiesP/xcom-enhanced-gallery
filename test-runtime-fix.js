/**
 * 런타임 에러 수정 테스트
 * 브라우저 환경을 시뮬레이션하여 URL constructor 문제가 해결되었는지 확인
 */

// 브라우저 환경 시뮬레이션
global.window = {
  URL: URL,
  location: { hostname: 'x.com' },
  document: {
    createElement: () => ({}),
    documentElement: {},
    querySelector: () => null,
    querySelectorAll: () => [],
  },
};

global.globalThis = global;
global.document = global.window.document;

// logger 직접 import 테스트
async function testLoggerImport() {
  try {
    console.log('🧪 Logger import 테스트 시작...');

    // 직접 logger import
    const { logger } = await import('./src/shared/logging/logger.ts');
    console.log('✅ Logger import 성공');

    // logger 사용 테스트
    logger.info('Logger 테스트 메시지');
    console.log('✅ Logger 사용 성공');

    return true;
  } catch (error) {
    console.error('❌ Logger import 실패:', error.message);
    return false;
  }
}

// URL 관련 유틸리티 테스트
async function testUrlUtilities() {
  try {
    console.log('\n🧪 URL 유틸리티 테스트 시작...');

    // media-url 유틸리티 import
    const { isValidMediaUrl } = await import('./src/shared/utils/media/media-url.util.ts');
    console.log('✅ Media URL 유틸리티 import 성공');

    // URL 검증 테스트
    const testUrl = 'https://pbs.twimg.com/media/F1a2b3c4d5e.jpg';
    const isValid = isValidMediaUrl(testUrl);
    console.log('✅ URL 검증 성공:', isValid);

    return true;
  } catch (error) {
    console.error('❌ URL 유틸리티 테스트 실패:', error.message);
    return false;
  }
}

// 메인 테스트 실행
async function runTests() {
  console.log('🚀 런타임 에러 수정 테스트 시작');
  console.log('='.repeat(50));

  const loggerTest = await testLoggerImport();
  const urlTest = await testUrlUtilities();

  console.log('\n📊 테스트 결과 요약:');
  console.log('='.repeat(50));
  console.log('Logger Import:', loggerTest ? '✅ 성공' : '❌ 실패');
  console.log('URL Utilities:', urlTest ? '✅ 성공' : '❌ 실패');

  const allPassed = loggerTest && urlTest;
  console.log('\n🎯 전체 결과:', allPassed ? '✅ 모든 테스트 통과' : '❌ 일부 테스트 실패');

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('❌ 테스트 실행 중 오류:', error);
  process.exit(1);
});
