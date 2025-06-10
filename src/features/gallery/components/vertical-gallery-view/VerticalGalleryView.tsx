/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Enhanced Vertical Gallery View Component
 * @version 3.0 - Optimized with better toast management and image fitting
 */

import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { Button } from '@shared/components/ui/Button/Button';
import { Toast } from '@shared/components/ui/Toast/Toast';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import type { ImageFitMode } from '@shared/types/image-fit.types';
import { autoThemeHelpers } from '@shared/utils/core';
import { galleryScrollManager } from '@shared/utils/core';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import styles from './VerticalGalleryView.module.css';
import { VerticalImageItem } from './VerticalImageItem';

export interface VerticalGalleryViewProps {
  mediaItems?: readonly MediaInfo[];
  onClose?: () => void;
  className?: string;
  currentIndex?: number;
  isDownloading?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onDownloadCurrent?: () => void;
  onDownloadAll?: () => void;
  showToast?: boolean;
  toastMessage?: string;
  toastType?: 'info' | 'warning' | 'error' | 'success';
}

export function VerticalGalleryView({
  mediaItems = [],
  onClose,
  className = '',
  currentIndex = 0,
  isDownloading = false,
  onPrevious,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
  showToast: _showToast = false,
  toastMessage: _toastMessage = '',
  toastType: _toastType = 'info',
}: VerticalGalleryViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 갤러리 가시성 관리
  useEffect(() => {
    // 미디어가 있으면 갤러리가 열린 것으로 간주
    if (mediaItems.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [mediaItems.length]);

  // 갤러리 닫힘 감지 및 모든 비디오 정지
  useEffect(() => {
    const stopAllVideos = () => {
      const videos = document.querySelectorAll('.xeg-gallery-container video');
      videos.forEach(video => {
        if (video instanceof HTMLVideoElement && !video.paused) {
          video.pause();
          video.currentTime = 0;
          logger.debug('Video stopped on gallery close');
        }
      });
    };

    // isVisible이 false가 되면 모든 비디오 정지
    if (!isVisible) {
      stopAllVideos();
    }

    // 컴포넌트 언마운트 시 모든 비디오 정지
    return () => {
      stopAllVideos();
    };
  }, [isVisible]);

  // 저장된 설정에서 imageFitMode 복원, 없으면 기본값 'fitWidth' 사용
  // (초기화 최적화)
  const getInitialFitMode = (): ImageFitMode => {
    try {
      const saved = localStorage.getItem('xeg-image-fit-mode');
      const validModes = ['original', 'fitWidth', 'fitHeight', 'fitContainer'];
      if (saved && validModes.includes(saved)) {
        return saved as ImageFitMode;
      }
    } catch (error) {
      logger.debug('Failed to load saved image fit mode:', error);
    }
    return 'fitWidth'; // 기본값
  };

  // 지연 초기화로 최적화
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode>(() => getInitialFitMode());
  const [showUI, setShowUI] = useState(true); // 초기에는 툴바 표시
  const [isToolbarHovering, setIsToolbarHovering] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      duration?: number;
    }>
  >([]);

  // Toast 관리 함수
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // UI 자동 숨김 타이머 관리 함수는 제거됨 - 직접 호출로 최적화

  // 설정 저장 헬퍼 함수
  const saveImageFitMode = useCallback((mode: ImageFitMode) => {
    try {
      localStorage.setItem('xeg-image-fit-mode', mode);
      logger.debug(`Image fit mode saved: ${mode}`);
    } catch (error) {
      logger.debug('Failed to save image fit mode:', error);
    }
  }, []);

  // 이미지 핏 모드 변경 핸들러들 (의존성 최적화)
  const handleFitOriginal = useCallback(() => {
    setImageFitMode('original');
    saveImageFitMode('original');
    logger.debug('VerticalGalleryView: 이미지 크기를 원본으로 설정');
  }, [saveImageFitMode]);

  const handleFitWidth = useCallback(() => {
    setImageFitMode('fitWidth');
    saveImageFitMode('fitWidth');
    logger.debug('VerticalGalleryView: 이미지 크기를 가로 맞춤으로 설정');
  }, [saveImageFitMode]);

  const handleFitHeight = useCallback(() => {
    setImageFitMode('fitHeight');
    saveImageFitMode('fitHeight');
    logger.debug('VerticalGalleryView: 이미지 크기를 세로 맞춤으로 설정');
  }, [saveImageFitMode]);

  const handleFitContainer = useCallback(() => {
    setImageFitMode('fitContainer');
    saveImageFitMode('fitContainer');
    logger.debug('VerticalGalleryView: 이미지 크기를 창 맞춤으로 설정');
  }, [saveImageFitMode]);

  // 개선된 툴바 마우스 이벤트 핸들러 - 메모리 누수 방지 및 성능 최적화
  const handleToolbarMouseEnter = useCallback(() => {
    setIsToolbarHovering(true);
    setShowUI(true);

    // 안전한 타이머 정리
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleToolbarMouseLeave = useCallback(() => {
    setIsToolbarHovering(false);

    // 툴바를 벗어나면 0.5초 후 숨김
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setShowUI(false);
    }, 500);
  }, []);

  // 상단 100px 조건을 엄격하게 적용하는 마우스 이벤트 핸들러
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      // 상단 100px 영역 체크
      const isInTopArea = event.clientY <= 100;

      if (isInTopArea) {
        setShowUI(true);

        // 기존 타이머 안전하게 정리
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }

        // 툴바 호버 상태가 아닐 때만 자동 숨김 타이머 설정
        if (!isToolbarHovering) {
          hideTimeoutRef.current = window.setTimeout(() => {
            setShowUI(false);
          }, 500);
        }
      } else {
        // 상단 100px 외부: 툴바 호버 상태 확인 후 즉시 숨김
        if (!isToolbarHovering) {
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }
          setShowUI(false);
        }
      }
    },
    [isToolbarHovering]
  );

  // 컴포넌트 마운트 시 가시성 애니메이션 설정, 자동 테마 적용 및 초기 포커스 스크롤
  useEffect(() => {
    logger.info('🚀 VerticalGalleryView 컴포넌트 마운트됨');
    setIsVisible(true);
    logger.info(`🎨 VerticalGalleryView 초기화: ${mediaItems.length}개 미디어 아이템`);

    // 자동 테마 시스템 - 갤러리 오픈 시 적용
    if (mediaItems.length > 0) {
      // 현재 인덱스의 이미지로 테마 적용 (클릭한 이미지)
      const currentMedia = mediaItems[currentIndex] || mediaItems[0];
      if (currentMedia?.url) {
        // 이미지 요소를 생성하여 색상 분석
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          autoThemeHelpers.onGalleryOpen(img);
        };
        img.src = currentMedia.url;
      } else {
        // 이미지가 없는 경우 기본 테마 적용
        autoThemeHelpers.onGalleryOpen();
      }

      /**
       * 갤러리 오픈 시 클릭한 이미지로 초기 스크롤 이동
       *
       * @description GalleryScrollManager를 사용하여 클릭한 이미지의 최상단이
       * 스크롤 컨테이너의 최상단에 위치하도록 정렬합니다.
       * 갤러리 열기 시 한 번만 실행되는 초기 포커스 스크롤입니다.
       *
       * @since 1.0.0
       * @author X.com Enhanced Gallery Team
       */
      const initialScrollToFocusedImage = () => {
        const itemsList = contentRef.current?.querySelector(`.${styles.itemsList}`) as HTMLElement;
        if (itemsList && currentIndex > 0) {
          // GalleryScrollManager를 사용하여 포커스 이미지 인덱스 저장 및 스크롤 이동
          galleryScrollManager.setFocusedImageIndex(currentIndex);
          galleryScrollManager.scrollToImageTop(itemsList, currentIndex, {
            behavior: 'smooth',
          });

          logger.debug(
            `Initial scroll to clicked image at index ${currentIndex} - ` +
              `aligned to top using GalleryScrollManager`
          );
        }
      };

      // DOM 렌더링 완료 후 스크롤 실행
      setTimeout(initialScrollToFocusedImage, 100);
    }

    // 갤러리 열기 이벤트 리스너 추가
    const handleOpenGallery = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as { mediaItems?: MediaInfo[]; startIndex?: number };

      if (detail?.mediaItems && detail.mediaItems.length > 0) {
        logger.info(`📥 갤러리 열기 이벤트 수신: ${detail.mediaItems.length}개 미디어`);
        // 이벤트를 통해 갤러리 상태를 업데이트하려면 상위 컴포넌트에서 처리해야 함
        // 현재는 로그만 출력
      }
    };

    document.addEventListener('xeg:openGallery', handleOpenGallery);

    return () => {
      logger.info('🧹 VerticalGalleryView 컴포넌트 언마운트됨');
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      // 갤러리 닫기 시 테마 리셋
      autoThemeHelpers.onGalleryClose();
      document.removeEventListener('xeg:openGallery', handleOpenGallery);
    };
  }, [mediaItems.length, currentIndex]); // currentIndex 의존성 추가

  // 현재 인덱스 변경 시 자동 테마 적용 및 스크롤 이동
  useEffect(() => {
    if (mediaItems.length > 0 && currentIndex >= 0 && currentIndex < mediaItems.length) {
      const currentMedia = mediaItems[currentIndex];
      if (currentMedia?.url) {
        // 현재 이미지로 테마 업데이트
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          autoThemeHelpers.onImageChange(img);
        };
        img.onerror = () => {
          logger.debug('Failed to load image for theme analysis:', currentMedia.url);
        };
        img.src = currentMedia.url;
      }

      /**
       * 포커스가 맞춰진 이미지로 부드럽게 스크롤 이동
       *
       * @description GalleryScrollManager를 사용하여 현재 인덱스의 이미지가 화면에
       * 완전히 보이지 않는 경우에만 스크롤을 실행합니다.
       * 이미지의 최상단이 스크롤 컨테이너의 최상단에 위치하도록 정렬합니다.
       * 현재 인덱스 변경 시 실행되는 포커스 스크롤입니다.
       *
       * @since 1.0.0
       * @author X.com Enhanced Gallery Team
       */
      const scrollToFocusedImage = () => {
        const itemsList = contentRef.current?.querySelector(`.${styles.itemsList}`) as HTMLElement;
        if (itemsList) {
          // GalleryScrollManager를 사용하여 이미지 가시성 확인 및 스크롤 이동
          const isImageVisible = galleryScrollManager.isImageVisible(itemsList, currentIndex);

          if (!isImageVisible) {
            // GalleryScrollManager를 사용하여 상단 정렬 스크롤
            galleryScrollManager.scrollToImageTop(itemsList, currentIndex, {
              behavior: 'smooth',
            });

            logger.debug(
              `Scrolled to focused image at index ${currentIndex} - aligned to top using GalleryScrollManager`
            );
          }
        }
      };

      // 다음 프레임에서 스크롤 (DOM 업데이트 후)
      requestAnimationFrame(scrollToFocusedImage);
    }
  }, [currentIndex, mediaItems]);

  // 갤러리 닫기 핸들러 (GalleryScrollManager로 상태 관리)
  const handleClose = useCallback(() => {
    // 갤러리 닫기 전 비디오 정지
    setIsVisible(false);

    // GalleryScrollManager 상태 리셋
    galleryScrollManager.reset();

    logger.debug('VerticalGalleryView: Closing gallery with GalleryScrollManager state reset');

    // 갤러리 닫기 실행
    onClose?.();
  }, [onClose]);

  // ESC 키로 갤러리 닫기 및 화살표 키 네비게이션 (의존성 최적화)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          // ESC 키는 갤러리 닫기이므로 툴바 표시 불필요
          handleClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          event.stopPropagation();
          // 네비게이션 키에서만 툴바 잠시 표시
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
          }
          setShowUI(true);
          if (!isToolbarHovering) {
            hideTimeoutRef.current = window.setTimeout(() => {
              setShowUI(false);
            }, 1000); // 네비게이션 시 1초간 표시
          }
          onPrevious?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          event.stopPropagation();
          // 네비게이션 키에서만 툴바 잠시 표시
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
          }
          setShowUI(true);
          if (!isToolbarHovering) {
            hideTimeoutRef.current = window.setTimeout(() => {
              setShowUI(false);
            }, 1000); // 네비게이션 시 1초간 표시
          }
          onNext?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          // 스크롤을 위로
          if (contentRef.current) {
            const itemsList = contentRef.current.querySelector(`.${styles.itemsList}`);
            if (itemsList) {
              itemsList.scrollBy({ top: -200, behavior: 'smooth' });
            }
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          // 스크롤을 아래로
          if (contentRef.current) {
            const itemsList = contentRef.current.querySelector(`.${styles.itemsList}`);
            if (itemsList) {
              itemsList.scrollBy({ top: 200, behavior: 'smooth' });
            }
          }
          break;
        case 'Home':
          event.preventDefault();
          event.stopPropagation();
          // 첫 번째 이미지로 스크롤
          if (contentRef.current) {
            const itemsList = contentRef.current.querySelector(`.${styles.itemsList}`);
            if (itemsList) {
              itemsList.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
          break;
        case 'End':
          event.preventDefault();
          event.stopPropagation();
          // 마지막 이미지로 스크롤
          if (contentRef.current) {
            const itemsList = contentRef.current.querySelector(`.${styles.itemsList}`);
            if (itemsList) {
              itemsList.scrollTo({ top: itemsList.scrollHeight, behavior: 'smooth' });
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // 캡처 단계에서 이벤트 처리
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleClose, onPrevious, onNext, isToolbarHovering]); // resetHideTimer 의존성 제거

  // 배경 클릭으로 갤러리 닫기
  const handleBackgroundClick = useCallback(
    (event: MouseEvent) => {
      // 이벤트 전파 완전 차단
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.target === containerRef.current) {
        logger.debug('VerticalGalleryView: 배경 클릭으로 갤러리 닫기');
        handleClose();
      }
    },
    [handleClose]
  );

  // 콘텐츠 영역 클릭 이벤트 처리 개선 (tweetPhoto 관련 요소는 허용)
  const handleContentClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // tweetPhoto 컨테이너 내부 클릭인지 확인
    const tweetPhotoContainer = target.closest('[data-testid="tweetPhoto"]');

    if (tweetPhotoContainer) {
      // tweetPhoto 내부 클릭은 GalleryApp에서 처리하도록 허용
      logger.debug('VerticalGalleryView: tweetPhoto 클릭 감지 - 갤러리 앱에서 처리');
      return;
    }

    // 이미지나 미디어 관련 요소는 이벤트 전파 허용
    if (
      target.tagName === 'IMG' ||
      target.classList.contains('css-9pa8cd') ||
      target.closest('.xeg-vertical-image-item')
    ) {
      logger.debug('VerticalGalleryView: 미디어 관련 클릭 - 이벤트 전파 허용');
      return;
    }

    // 다른 영역 클릭만 이벤트 전파 차단
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    logger.debug('VerticalGalleryView: Content area click - event propagation stopped');
  }, []);

  // 백그라운드 키보드 이벤트 처리
  const handleBackgroundKeyDown = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const closeKeys = ['Escape', 'Enter', ' '];
      if (closeKeys.includes(event.key)) {
        handleClose();
      }
    },
    [handleClose]
  );

  // 빈 상태 렌더링
  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div
        className={`${styles.container} ${styles.empty} ${className}`}
        onClick={handleBackgroundClick}
        onKeyDown={handleBackgroundKeyDown}
        role='button'
        tabIndex={0}
        aria-label='갤러리 닫기'
      >
        <div className={styles.emptyMessage}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
          <h3>미디어가 없습니다</h3>
          <p>표시할 이미지나 동영상이 없습니다.</p>
          <Button
            variant='secondary'
            size='medium'
            onClick={handleClose}
            className={styles.emptyButton}
          >
            갤러리 닫기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isVisible ? styles.visible : ''} ${className}`}
      onClick={handleBackgroundClick}
      onKeyDown={handleBackgroundKeyDown}
      onMouseMove={handleMouseMove}
      role='button'
      tabIndex={0}
      aria-label='갤러리 닫기 (배경 클릭)'
      data-testid='vertical-gallery-view'
    >
      {' '}
      {/* 향상된 Toolbar - 마우스 호버 시에만 표시 */}
      <div
        className={`${styles.toolbarWrapper} ${showUI ? styles.toolbarVisible : styles.toolbarHidden}`}
        onMouseEnter={handleToolbarMouseEnter}
        onMouseLeave={handleToolbarMouseLeave}
      >
        <Toolbar
          currentIndex={currentIndex}
          totalCount={mediaItems.length}
          isDownloading={isDownloading}
          onPrevious={onPrevious ?? (() => {})}
          onNext={onNext ?? (() => {})}
          onDownloadCurrent={
            onDownloadCurrent ??
            (() => {
              logger.warn('다운로드 기능이 사용할 수 없습니다.');
            })
          }
          onDownloadAll={
            onDownloadAll ??
            (() => {
              logger.warn('전체 다운로드 기능이 사용할 수 없습니다.');
            })
          }
          onClose={handleClose}
          onFitOriginal={handleFitOriginal}
          onFitHeight={handleFitHeight}
          onFitWidth={handleFitWidth}
          onFitContainer={handleFitContainer}
        />
      </div>
      {/* 콘텐츠 영역 */}
      <div
        ref={contentRef}
        className={styles.content}
        onClick={handleContentClick}
        onKeyDown={e => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
      >
        <div className={styles.itemsList} role='list'>
          {mediaItems.map((media, index) => {
            if (!media) {
              return null;
            }

            return (
              <VerticalImageItem
                key={media.id ?? `media-${index}`}
                media={media}
                index={index}
                isActive={index === currentIndex}
                isVisible={isVisible}
                className={index === currentIndex ? styles.itemActive : ''}
                fitMode={imageFitMode}
                onClick={() => {
                  // 이미지 클릭 시 적절한 처리 추가
                  logger.debug(`Image clicked: index ${index}, current index: ${currentIndex}`);

                  // 현재 인덱스가 다르면 해당 인덱스로 이동
                  if (index !== currentIndex) {
                    // 네비게이션이 실제로 발생할 때만 툴바 잠시 표시
                    if (hideTimeoutRef.current) {
                      clearTimeout(hideTimeoutRef.current);
                    }
                    setShowUI(true);
                    if (!isToolbarHovering) {
                      hideTimeoutRef.current = window.setTimeout(() => {
                        setShowUI(false);
                      }, 1000); // 네비게이션 시 1초간 표시
                    }

                    if (index < currentIndex && onPrevious) {
                      // 이전 이미지를 클릭한 경우
                      for (let i = currentIndex; i > index; i--) {
                        onPrevious();
                      }
                    } else if (index > currentIndex && onNext) {
                      // 다음 이미지를 클릭한 경우
                      for (let i = currentIndex; i < index; i++) {
                        onNext();
                      }
                    }
                  }
                }}
              />
            );
          })}
        </div>
      </div>
      {/* Toast 알림들 */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
}
