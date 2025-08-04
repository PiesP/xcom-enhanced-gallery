/**
 * 디자인 시스템 통합 검증 스크립트
 * TDD로 구현된 모든 시스템의 통합 상태를 확인합니다.
 */

// 모든 구현된 시스템들이 정상적으로 import되는지 확인
console.log('🔍 디자인 시스템 통합 검증을 시작합니다...\n');

async function verifyDesignSystemIntegration() {
  const results = [];

  try {
    // 1. useToolbarVisibility Hook 검증
    console.log('1️⃣ useToolbarVisibility Hook 검증...');
    const { useToolbarVisibility } = await import('../src/shared/hooks/useToolbarVisibility.ts');

    if (typeof useToolbarVisibility === 'function') {
      results.push('✅ useToolbarVisibility: 정상 로드됨');
    } else {
      results.push('❌ useToolbarVisibility: 함수가 아님');
    }
  } catch (error) {
    results.push(`❌ useToolbarVisibility: 로드 실패 - ${error.message}`);
  }

  try {
    // 2. ZIndexManager 검증
    console.log('2️⃣ ZIndexManager 시스템 검증...');
    const { ZIndexManager } = await import('../src/shared/styles/ZIndexManager.ts');

    const manager = ZIndexManager.getInstance();
    const modalZIndex = manager.getZIndex('modal');

    if (modalZIndex === 1000) {
      results.push('✅ ZIndexManager: 정상 작동 (modal = 1000)');
    } else {
      results.push(`❌ ZIndexManager: 잘못된 값 (modal = ${modalZIndex})`);
    }
  } catch (error) {
    results.push(`❌ ZIndexManager: 로드 실패 - ${error.message}`);
  }

  try {
    // 3. Glassmorphism 시스템 검증
    console.log('3️⃣ Glassmorphism 시스템 검증...');
    const { generateGlassmorphismCSS } = await import(
      '../src/shared/styles/glassmorphism-system.ts'
    );

    const css = generateGlassmorphismCSS({ intensity: 'medium' });

    if (css.includes('backdrop-filter') && css.includes('background')) {
      results.push('✅ Glassmorphism: 정상 작동 (CSS 생성됨)');
    } else {
      results.push('❌ Glassmorphism: CSS 생성 실패');
    }
  } catch (error) {
    results.push(`❌ Glassmorphism: 로드 실패 - ${error.message}`);
  }

  try {
    // 4. Z-Index Helper 시스템 검증
    console.log('4️⃣ Z-Index Helper 시스템 검증...');
    const { getZIndexValue, createZIndexClass } = await import(
      '../src/shared/styles/z-index-system.ts'
    );

    const tooltipZIndex = getZIndexValue('tooltip');
    const className = createZIndexClass('modal', 'test');

    if (tooltipZIndex === 1100 && className === 'test-z-modal') {
      results.push('✅ Z-Index Helpers: 정상 작동');
    } else {
      results.push(`❌ Z-Index Helpers: 값 오류 (tooltip=${tooltipZIndex}, class=${className})`);
    }
  } catch (error) {
    results.push(`❌ Z-Index Helpers: 로드 실패 - ${error.message}`);
  }

  try {
    // 5. StyleService 통합 API 검증
    console.log('5️⃣ StyleService 통합 API 검증...');
    const { styleService } = await import('../src/shared/styles/style-service.ts');

    const zIndex = styleService.getZIndex('modal');

    if (zIndex === 1000) {
      results.push('✅ StyleService: 통합 API 정상 작동');
    } else {
      results.push(`❌ StyleService: 잘못된 값 (${zIndex})`);
    }
  } catch (error) {
    results.push(`❌ StyleService: 로드 실패 - ${error.message}`);
  }

  // 결과 출력
  console.log('\n📊 검증 결과:');
  console.log('='.repeat(50));

  results.forEach(result => console.log(result));

  const successCount = results.filter(r => r.startsWith('✅')).length;
  const totalCount = results.length;

  console.log('='.repeat(50));
  console.log(`총 ${totalCount}개 시스템 중 ${successCount}개 정상 작동`);

  if (successCount === totalCount) {
    console.log('🎉 모든 디자인 시스템이 성공적으로 통합되었습니다!');
  } else {
    console.log('⚠️  일부 시스템에 문제가 있습니다.');
  }

  return { success: successCount, total: totalCount };
}

// 실행
verifyDesignSystemIntegration()
  .then(({ success, total }) => {
    process.exit(success === total ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ 검증 스크립트 실행 실패:', error);
    process.exit(1);
  });
