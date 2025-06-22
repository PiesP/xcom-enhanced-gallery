/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Accessibility Enhancement Hook
 * @description 갤러리의 접근성을 향상시키는 커스텀 훅
 */

import { logger } from '@infrastructure/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';

const { useState, useEffect, useCallback, useRef } = getPreactHooks();

export interface AccessibilityState {
  isScreenReaderActive: boolean;
  isHighContrastMode: boolean;
  isReducedMotion: boolean;
  announcements: string[];
  focusIndex: number;
}

export interface UseAccessibilityOptions {
  totalItems: number;
  currentIndex: number;
  onIndexChange?: (index: number) => void;
  enableAnnouncements?: boolean;
  announcementDelay?: number;
}

export interface UseAccessibilityReturn {
  state: AccessibilityState;
  announce: (message: string) => void;
  setFocus: (index: number) => void;
  getAriaLabel: (index: number) => string;
  getAriaProps: (index: number) => Record<string, string | number | boolean>;
  keyboardHandlers: {
    onKeyDown: (event: KeyboardEvent) => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: (event: FocusEvent) => void;
  };
}

/**
 * 갤러리 접근성 향상을 위한 커스텀 훅
 *
 * @param options - 접근성 옵션
 * @returns 접근성 관련 상태 및 메서드
 */
export function useAccessibility({
  totalItems,
  currentIndex,
  onIndexChange,
  enableAnnouncements = true,
  announcementDelay = 500,
}: UseAccessibilityOptions): UseAccessibilityReturn {
  const [state, setState] = useState<AccessibilityState>({
    isScreenReaderActive: false,
    isHighContrastMode: false,
    isReducedMotion: false,
    announcements: [],
    focusIndex: currentIndex,
  });

  const announcementTimeoutRef = useRef<number | null>(null);
  const lastAnnouncementRef = useRef<string>('');

  // 미디어 쿼리 감지
  useEffect(() => {
    const detectAccessibilityFeatures = () => {
      // 고대비 모드 감지
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      const updateAccessibilityState = () => {
        setState(prev => ({
          ...prev,
          isHighContrastMode: highContrastQuery.matches,
          isReducedMotion: reducedMotionQuery.matches,
        }));
      };

      updateAccessibilityState();

      // 미디어 쿼리 변경 감지
      highContrastQuery.addEventListener('change', updateAccessibilityState);
      reducedMotionQuery.addEventListener('change', updateAccessibilityState);

      return () => {
        highContrastQuery.removeEventListener('change', updateAccessibilityState);
        reducedMotionQuery.removeEventListener('change', updateAccessibilityState);
      };
    };

    return detectAccessibilityFeatures();
  }, []);

  // 스크린 리더 감지
  useEffect(() => {
    const detectScreenReader = () => {
      // 스크린 리더가 활성화되었는지 감지하는 휴리스틱
      const hasAriaSupport = 'speechSynthesis' in window;
      const hasAccessibilityAPI = 'getComputedAccessibleNode' in window;

      // 포커스가 자주 이동하는지 감지
      let focusChangeCount = 0;
      const focusHandler = () => {
        focusChangeCount++;
      };

      document.addEventListener('focus', focusHandler, true);

      const checkScreenReader = setTimeout(() => {
        const isLikelyScreenReader = focusChangeCount > 5 || hasAriaSupport || hasAccessibilityAPI;
        setState(prev => ({
          ...prev,
          isScreenReaderActive: isLikelyScreenReader,
        }));

        if (isLikelyScreenReader) {
          logger.info('Screen reader detected, enhancing accessibility');
        }
      }, 2000);

      return () => {
        document.removeEventListener('focus', focusHandler, true);
        clearTimeout(checkScreenReader);
      };
    };

    return detectScreenReader();
  }, []);

  // 음성 안내 함수
  const announce = useCallback(
    (message: string) => {
      if (!enableAnnouncements || !message || message === lastAnnouncementRef.current) {
        return;
      }

      lastAnnouncementRef.current = message;

      // 이전 안내 취소
      if (announcementTimeoutRef.current) {
        window.clearTimeout(announcementTimeoutRef.current);
      }

      announcementTimeoutRef.current = window.setTimeout(() => {
        setState(prev => ({
          ...prev,
          announcements: [...prev.announcements.slice(-4), message], // 최대 5개 유지
        }));

        // 스크린 리더가 감지된 경우 추가 안내
        if (state.isScreenReaderActive) {
          // ARIA live region 업데이트
          const liveRegion = document.querySelector('[aria-live="polite"]');
          if (liveRegion) {
            liveRegion.textContent = message;
          } else {
            // live region이 없으면 생성
            const region = document.createElement('div');
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            region.style.position = 'absolute';
            region.style.left = '-10000px';
            region.style.width = '1px';
            region.style.height = '1px';
            region.style.overflow = 'hidden';
            region.textContent = message;
            document.body.appendChild(region);

            // 잠시 후 제거
            setTimeout(() => {
              document.body.removeChild(region);
            }, 1000);
          }
        }

        logger.info('Accessibility announcement:', message);
      }, announcementDelay);
    },
    [enableAnnouncements, announcementDelay, state.isScreenReaderActive]
  );

  // 포커스 설정
  const setFocus = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalItems) {
        setState(prev => ({ ...prev, focusIndex: index }));

        // 갤러리 아이템에 포커스 설정
        const galleryItem = document.querySelector(
          `[data-gallery-index="${index}"]`
        ) as HTMLElement;
        if (galleryItem) {
          galleryItem.focus({ preventScroll: true });
        }

        announce(`${index + 1}번째 이미지, 총 ${totalItems}개 중`);
      }
    },
    [totalItems, announce]
  );

  // ARIA 라벨 생성
  const getAriaLabel = useCallback(
    (index: number) => {
      return `갤러리 이미지 ${index + 1} / ${totalItems}`;
    },
    [totalItems]
  );

  // ARIA 속성 생성
  const getAriaProps = useCallback(
    (index: number) => ({
      'aria-label': getAriaLabel(index),
      'aria-current': index === currentIndex ? 'true' : 'false',
      'aria-setsize': totalItems,
      'aria-posinset': index + 1,
      role: 'img',
      tabIndex: index === state.focusIndex ? 0 : -1,
      'data-gallery-index': index,
    }),
    [getAriaLabel, currentIndex, totalItems, state.focusIndex]
  );

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, altKey } = event;

      // 수정자 키가 눌린 경우 기본 동작 유지
      if (ctrlKey || altKey) {
        return;
      }

      switch (key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (currentIndex > 0) {
            onIndexChange?.(currentIndex - 1);
            setFocus(currentIndex - 1);
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          if (currentIndex < totalItems - 1) {
            onIndexChange?.(currentIndex + 1);
            setFocus(currentIndex + 1);
          }
          break;

        case 'Home':
          event.preventDefault();
          onIndexChange?.(0);
          setFocus(0);
          break;

        case 'End':
          event.preventDefault();
          onIndexChange?.(totalItems - 1);
          setFocus(totalItems - 1);
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          announce(`현재 ${currentIndex + 1}번째 이미지를 보고 있습니다`);
          break;

        case 'Escape':
          announce('갤러리를 종료합니다');
          break;

        default:
          // 숫자 키로 직접 이동
          if (/^[1-9]$/.test(key)) {
            const targetIndex = parseInt(key, 10) - 1;
            if (targetIndex < totalItems) {
              event.preventDefault();
              onIndexChange?.(targetIndex);
              setFocus(targetIndex);
            }
          }
          break;
      }
    },
    [currentIndex, totalItems, onIndexChange, setFocus, announce]
  );

  const handleFocus = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    const galleryIndex = target.getAttribute('data-gallery-index');

    if (galleryIndex !== null) {
      const index = parseInt(galleryIndex, 10);
      setState(prev => ({ ...prev, focusIndex: index }));
    }
  }, []);

  const handleBlur = useCallback(() => {
    // 블러 시 특별한 처리가 필요한 경우 추가
  }, []);

  // 현재 인덱스 변경 시 안내
  useEffect(() => {
    if (enableAnnouncements && totalItems > 0) {
      announce(`${currentIndex + 1}번째 이미지로 이동했습니다`);
    }
  }, [currentIndex, totalItems, enableAnnouncements, announce]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        window.clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    announce,
    setFocus,
    getAriaLabel,
    getAriaProps,
    keyboardHandlers: {
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
  };
}
