/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Enhanced Vertical Gallery View Usage Example
 * @description 개선된 수직 갤러리 뷰 컴포넌트 사용 예제
 */

import type { MediaInfo } from '@core/types/media.types';
import { getPreactHooks } from '@infrastructure/external/vendors';
import { VerticalGalleryView } from '../VerticalGalleryView';

const { useState } = getPreactHooks();

// 예제 미디어 데이터
const sampleMediaItems: MediaInfo[] = [
  {
    id: 'img1',
    url: 'https://pbs.twimg.com/media/example1.jpg',
    type: 'image',
    filename: 'example1.jpg',
    width: 1200,
    height: 800,
  },
  {
    id: 'img2',
    url: 'https://pbs.twimg.com/media/example2.jpg',
    type: 'image',
    filename: 'example2.jpg',
    width: 800,
    height: 1200,
  },
  {
    id: 'video1',
    url: 'https://video.twimg.com/ext_tw_video/example.mp4',
    type: 'video',
    filename: 'example.mp4',
    width: 1280,
    height: 720,
  },
];

/**
 * 개선된 갤러리 사용 예제
 */
export function GalleryExample() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  // 갤러리 열기
  const openGallery = (startIndex = 0) => {
    setCurrentIndex(startIndex);
    setIsOpen(true);
  };

  // 갤러리 닫기
  const closeGallery = () => {
    setIsOpen(false);
    setCurrentIndex(0);
  };

  // 이전 아이템
  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  // 다음 아이템
  const goToNext = () => {
    setCurrentIndex(prev => Math.min(sampleMediaItems.length - 1, prev + 1));
  };

  // 현재 미디어 다운로드
  const downloadCurrent = async () => {
    const currentMedia = sampleMediaItems[currentIndex];
    if (!currentMedia) return;

    setIsDownloading(true);
    try {
      // 다운로드 로직 구현
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();

      // 파일 다운로드
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentMedia.filename ?? 'download';
      link.click();
      URL.revokeObjectURL(url);

      setToast({
        show: true,
        message: `${currentMedia.filename} 다운로드 완료`,
        type: 'success',
      });
    } catch {
      setToast({
        show: true,
        message: '다운로드 중 오류가 발생했습니다',
        type: 'error',
      });
    } finally {
      setIsDownloading(false);
      // 3초 후 토스트 숨김
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    }
  };

  // 모든 미디어 다운로드
  const downloadAll = async () => {
    setIsDownloading(true);
    try {
      for (const media of sampleMediaItems) {
        const response = await fetch(media.url);
        const blob = await response.blob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = media.filename ?? 'download';
        link.click();
        URL.revokeObjectURL(url);

        // 각 다운로드 사이에 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setToast({
        show: true,
        message: `${sampleMediaItems.length}개 파일 다운로드 완료`,
        type: 'success',
      });
    } catch {
      setToast({
        show: true,
        message: '일괄 다운로드 중 오류가 발생했습니다',
        type: 'error',
      });
    } finally {
      setIsDownloading(false);
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    }
  };

  return (
    <div>
      {/* 갤러리 트리거 버튼들 */}
      <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => openGallery(0)}>갤러리 열기 (첫 번째 이미지)</button>
        <button onClick={() => openGallery(1)}>갤러리 열기 (두 번째 이미지)</button>
        <button onClick={() => openGallery(2)}>갤러리 열기 (비디오)</button>
      </div>

      {/* 개선된 수직 갤러리 뷰 */}
      {isOpen && (
        <VerticalGalleryView
          mediaItems={sampleMediaItems}
          currentIndex={currentIndex}
          isDownloading={isDownloading}
          onClose={closeGallery}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onDownloadCurrent={downloadCurrent}
          onDownloadAll={downloadAll}
          showToast={toast.show}
          toastMessage={toast.message}
          toastType={toast.type}
          className='custom-gallery'
        />
      )}
    </div>
  );
}

/**
 * 커스텀 스타일 적용 예제
 */
export function CustomStyledGalleryExample() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 갤러리 컨트롤 함수들
  const closeGallery = () => {};
  const goToPrevious = () => setCurrentIndex(prev => Math.max(0, prev - 1));
  const goToNext = () => setCurrentIndex(prev => Math.min(sampleMediaItems.length - 1, prev + 1));

  return (
    <VerticalGalleryView
      mediaItems={sampleMediaItems}
      currentIndex={currentIndex}
      onClose={closeGallery}
      onPrevious={goToPrevious}
      onNext={goToNext}
      className='dark-theme-gallery'
    />
  );
}

/**
 * 접근성 최적화 예제
 */
export function AccessibleGalleryExample() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* 스크린 리더를 위한 설명 */}
      <div className='sr-only' aria-live='polite'>
        갤러리가 {isOpen ? '열려' : '닫혀'} 있습니다.
        {isOpen && `현재 ${currentIndex + 1}번째 미디어를 보고 있습니다.`}
      </div>

      <VerticalGalleryView
        mediaItems={sampleMediaItems}
        currentIndex={currentIndex}
        onClose={() => setIsOpen(false)}
        onPrevious={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
        onNext={() => setCurrentIndex(prev => Math.min(sampleMediaItems.length - 1, prev + 1))}
      />
    </div>
  );
}

export default GalleryExample;
