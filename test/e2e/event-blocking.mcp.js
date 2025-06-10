/**
 * Event Blocking E2E Test
 * 갤러리 이미지 클릭 이벤트 차단 기능을 검증합니다.
 */

const eventBlockingTest = {
  async testImageClickBlocking() {
    console.log('🚫 이미지 클릭 이벤트 차단 테스트');

    // 갤러리 열기
    await browser_navigate('https://twitter.com');
    await browser_wait(3);
    await browser_click('트윗 이미지', "img[data-testid='tweetPhoto']");
    await browser_wait(1);

    // 갤러리 내 이미지 클릭
    await browser_click('갤러리 이미지', '.vertical-image-item img');
    await browser_wait(1);

    // 트위터 기본 모달이 열리지 않았는지 확인
    const snapshot = await browser_snapshot();
    const noTwitterModal = !snapshot.includes('twitter-modal') && !snapshot.includes('photo-modal');

    console.log(noTwitterModal ? '✅ 이벤트 차단 성공' : '❌ 이벤트 차단 실패');
    return noTwitterModal;
  },

  async runAll() {
    const result = await this.testImageClickBlocking();
    console.log(`🎯 이벤트 차단 테스트: ${result ? '✅ 성공' : '❌ 실패'}`);
    return result;
  },
};

eventBlockingTest.runAll().catch(console.error);
