/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Keyboard Navigation Hook
 * @description 갤러리의 키보드 네비게이션을 처리하는 커스텀 훅
 */

import { logger } from '@infrastructure/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';
import { clearManagedTimer, createRefManagedTimeout } from '@shared/utils/timer-utils';

const { useEffect, useCallback } = getPreactHooks();

interface UseGalleryKeyboardOptions {
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onToggleUI: (show: boolean) => void;
  contentRef: { current: HTMLDivElement | null };
  hideTimeoutRef: { current: string | null };
  isToolbarHovering: boolean;
}

export function useGalleryKeyboard({
  onClose,
  onPrevious,
  onNext,
  onToggleUI,
  contentRef,
  hideTimeoutRef,
  isToolbarHovering,
}: UseGalleryKeyboardOptions) {
  // UI 자동 숨김 타이머 설정
  const setAutoHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearManagedTimer(hideTimeoutRef.current);
    }
    onToggleUI(true);
    if (!isToolbarHovering) {
      createRefManagedTimeout(
        hideTimeoutRef,
        () => {
          onToggleUI(false);
        },
        1000
      );
    }
  }, [onToggleUI, hideTimeoutRef, isToolbarHovering]);

  // 스크롤 유틸리티
  const scrollInList = useCallback(
    (direction: 'up' | 'down' | 'home' | 'end') => {
      const itemsList = contentRef.current?.querySelector('.itemsList') as HTMLElement;
      if (!itemsList) return;

      switch (direction) {
        case 'up':
          itemsList.scrollBy({ top: -200, behavior: 'smooth' });
          break;
        case 'down':
          itemsList.scrollBy({ top: 200, behavior: 'smooth' });
          break;
        case 'home':
          itemsList.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'end':
          itemsList.scrollTo({ top: itemsList.scrollHeight, behavior: 'smooth' });
          break;
      }
    },
    [contentRef]
  );

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 입력 필드에서 키보드 이벤트가 발생한 경우 무시
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          onClose();
          break;

        case 'ArrowLeft':
          event.preventDefault();
          event.stopPropagation();
          setAutoHideTimer();
          onPrevious?.();
          logger.debug('Keyboard: Previous item');
          break;

        case 'ArrowRight':
          event.preventDefault();
          event.stopPropagation();
          setAutoHideTimer();
          onNext?.();
          logger.debug('Keyboard: Next item');
          break;

        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          scrollInList('up');
          break;

        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          scrollInList('down');
          break;

        case 'Home':
          event.preventDefault();
          event.stopPropagation();
          scrollInList('home');
          break;

        case 'End':
          event.preventDefault();
          event.stopPropagation();
          scrollInList('end');
          break;

        case ' ': // 스페이스바로 UI 토글
          event.preventDefault();
          event.stopPropagation();
          onToggleUI(true);
          break;

        default:
          break;
      }
    },
    [onClose, onPrevious, onNext, setAutoHideTimer, scrollInList, onToggleUI]
  );

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  return {
    handleKeyDown,
    scrollInList,
    setAutoHideTimer,
  };
}
