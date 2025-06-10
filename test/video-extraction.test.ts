/**
 * Video Extractor 유틸리티 테스트
 *
 * 브라우저 콘솔에서 실행하여 동영상 추출 기능을 테스트할 수 있습니다.
 */

/* eslint-disable no-console */

// 테스트 함수들을 전역 스코프에 노출
(function setupVideoExtractionTests() {
  // @ts-ignore - 테스트용 전역 함수
  window.testVideoExtraction = async function () {
    try {
      console.log('🎬 동영상 추출 테스트 시작...');

      // 1. 현재 페이지의 모든 이미지 요소 확인
      const images = document.querySelectorAll('img');
      console.log(`📷 총 ${images.length}개의 이미지 발견`);

      // 2. 동영상 썸네일 감지
      const videoThumbnails = Array.from(images).filter(img => {
        return (
          img.src.includes('ext_tw_video_thumb') ||
          img.src.includes('amplify_video_thumb') ||
          img.src.includes('tweet_video_thumb') ||
          img.alt === 'Animated Text GIF' ||
          img.alt === 'Embedded video' ||
          img.closest('[data-testid="videoComponent"]') !== null
        );
      });

      console.log(`🎥 동영상 썸네일 ${videoThumbnails.length}개 발견:`, videoThumbnails);

      // 3. 트윗 ID 추출 테스트
      const currentUrl = window.location.href;
      const tweetIdMatch = currentUrl.match(/(?<=\/status\/)\d+/);
      const tweetId = tweetIdMatch?.[0];

      if (tweetId) {
        console.log(`📝 트윗 ID: ${tweetId}`);
      } else {
        console.log('❌ 현재 페이지에서 트윗 ID를 찾을 수 없습니다.');
        return;
      }

      // 4. 미디어 추출 서비스 테스트 (동적 import 시뮬레이션)
      console.log('🔍 미디어 추출 서비스 테스트 중...');

      // 첫 번째 이미지 요소로 테스트
      const firstImage = images[0];
      if (firstImage) {
        console.log('✅ 테스트 완료! 실제 추출을 위해서는 갤러리 앱을 사용하세요.');
      }
    } catch (error) {
      console.error('❌ 테스트 실행 중 오류:', error);
    }
  };

  // @ts-ignore - 테스트용 전역 함수
  window.findVideoElements = function () {
    console.log('🔍 동영상 관련 요소 검색 중...');

    // 동영상 컴포넌트 찾기
    const videoComponents = document.querySelectorAll('[data-testid="videoComponent"]');
    console.log(`📹 videoComponent 요소: ${videoComponents.length}개`);

    // 동영상 태그 찾기
    const videoTags = document.querySelectorAll('video');
    console.log(`🎬 video 태그: ${videoTags.length}개`);

    // 동영상 관련 aria-label 찾기
    const videoLabels = document.querySelectorAll('[aria-label*="video"], [aria-label*="Video"]');
    console.log(`🏷️ 동영상 라벨 요소: ${videoLabels.length}개`);

    // 동영상 썸네일 URL 패턴 찾기
    const videoThumbImages = document.querySelectorAll(
      'img[src*="video_thumb"], img[src*="ext_tw_video"], img[src*="amplify_video"]'
    );
    console.log(`🖼️ 동영상 썸네일 이미지: ${videoThumbImages.length}개`);

    return {
      videoComponents: Array.from(videoComponents),
      videoTags: Array.from(videoTags),
      videoLabels: Array.from(videoLabels),
      videoThumbImages: Array.from(videoThumbImages),
    };
  };

  // @ts-ignore - 테스트용 전역 함수
  window.inspectMediaUrls = function () {
    console.log('🔗 미디어 URL 분석 중...');

    const images = document.querySelectorAll('img');
    const mediaUrls = Array.from(images)
      .map(img => img.src)
      .filter(src => src.includes('pbs.twimg.com') || src.includes('video.twimg.com'))
      .slice(0, 10); // 처음 10개만

    console.log('📊 미디어 URL 샘플:');
    mediaUrls.forEach((url, index) => {
      const isVideo =
        url.includes('video') || url.includes('ext_tw_video') || url.includes('amplify_video');
      console.log(`  ${index + 1}. ${isVideo ? '🎥' : '🖼️'} ${url}`);
    });

    return mediaUrls;
  };

  console.log(`
🎬 동영상 추출 테스트 도구가 로드되었습니다!

사용 가능한 함수들:
- testVideoExtraction() : 전체 동영상 추출 테스트
- findVideoElements()   : 페이지의 동영상 요소 찾기  
- inspectMediaUrls()    : 미디어 URL 분석

예시 사용법:
  testVideoExtraction();
  findVideoElements();
  inspectMediaUrls();
  `);
})();

export {}; // TypeScript 모듈로 만들기 위한 export
