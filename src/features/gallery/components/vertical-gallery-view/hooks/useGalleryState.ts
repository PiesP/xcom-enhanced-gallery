/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery State Management Hook
 * @description 갤러리의 가시성, UI 상태, 설정 등을 관리하는 커스텀 훅
 */

import { logger } from '@infrastructure/logging/logger';
import type { ImageFitMode } from '@shared/types/image-fit.types';
import { getPreactHooks } from '@infrastructure/external/vendors';

const { useState, useCallback, useRef } = getPreactHooks();

interface UseGalleryStateOptions {
  initialVisible?: boolean;
  mediaCount: number;
}

export function useGalleryState({ initialVisible = false, mediaCount }: UseGalleryStateOptions) {
  // 가시성 상태
  const [isVisible, setIsVisible] = useState(() => initialVisible && mediaCount > 0);

  // UI 상태
  const [showUI, setShowUI] = useState(true);
  const [isToolbarHovering, setIsToolbarHovering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 이미지 핏 모드
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode>(() => {
    try {
      const saved = localStorage.getItem('xeg-image-fit-mode');
      const validModes = ['original', 'fitWidth', 'fitHeight', 'fitContainer'];
      if (saved && validModes.includes(saved)) {
        return saved as ImageFitMode;
      }
    } catch (error) {
      logger.debug('Failed to load saved image fit mode:', error);
    }
    return 'fitWidth';
  });

  // 타이머 참조
  const hideTimeoutRef = useRef<string | null>(null);

  // 가시성 업데이트
  const updateVisibility = useCallback(
    (visible: boolean) => {
      logger.info('Gallery visibility update:', { visible, mediaCount });
      setIsVisible(visible && mediaCount > 0);
    },
    [mediaCount]
  );

  // 이미지 핏 모드 변경 및 저장
  const updateImageFitMode = useCallback((mode: ImageFitMode) => {
    setImageFitMode(mode);
    try {
      localStorage.setItem('xeg-image-fit-mode', mode);
      logger.debug(`Image fit mode saved: ${mode}`);
    } catch (error) {
      logger.debug('Failed to save image fit mode:', error);
    }
  }, []);

  // UI 표시/숨김 제어
  const toggleUI = useCallback((show: boolean) => {
    setShowUI(show);
  }, []);

  // 툴바 호버 상태 제어
  const updateToolbarHover = useCallback((hovering: boolean) => {
    setIsToolbarHovering(hovering);
  }, []);

  // 설정 패널 토글
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  return {
    // 상태
    isVisible,
    showUI,
    isToolbarHovering,
    showSettings,
    imageFitMode,

    // 참조
    hideTimeoutRef,

    // 액션
    updateVisibility,
    updateImageFitMode,
    toggleUI,
    updateToolbarHover,
    toggleSettings,
  };
}
