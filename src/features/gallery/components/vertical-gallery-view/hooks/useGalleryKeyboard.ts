/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Enhanced Gallery Keyboard Hook
 * @description 갤러리 키보드 지원을 제공하는 커스텀 훅 (Esc 키만 지원)
 */

// NOTE: Vitest(vite-node) Windows alias 해석 이슈 회피 — 내부 의존성은 상대 경로 사용
import { logger } from '../../../../../shared/logging/logger';
import { getPreactHooks } from '../../../../../shared/external/vendors';
import { keyboardNavigator } from '../../../../../shared/services/input/KeyboardNavigator';

interface UseGalleryKeyboardOptions {
  onClose: () => void;
  /**
   * 키보드 도움말 오버레이 열기 콜백 (Shift + / 또는 '?')
   * 갤러리 컨텍스트에서만 활성화됩니다.
   */
  onOpenHelp?: () => void;
}

export function useGalleryKeyboard({ onClose, onOpenHelp }: UseGalleryKeyboardOptions) {
  const { useCallback, useEffect } = getPreactHooks();

  // 갤러리 키보드 이벤트 핸들러 (확장된 버전)
  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // 입력 필드에서는 키보드 이벤트 무시
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // 키보드 이벤트 처리 (PC 전용 키)
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          onClose();
          logger.debug('Gallery: Esc key pressed, closing gallery');
          break;
        case '?':
          // Shift + / 의 결과로 key가 '?'가 되기도 함 (브라우저/레어 환경 차이 고려)
          event.preventDefault();
          event.stopPropagation();
          if (onOpenHelp) {
            onOpenHelp();
          }
          break;
        case '/':
          // 일부 환경에서 key는 '/'이고 shiftKey가 true인 형태로 전달됨
          if (event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            if (onOpenHelp) {
              onOpenHelp();
            }
          }
          break;
      }
    },
    [onClose, onOpenHelp]
  );

  useEffect(() => {
    const unsubscribe = keyboardNavigator.subscribe(
      {
        onEscape: () => {
          try {
            logger.debug('Gallery: Esc key pressed, closing gallery');
          } catch {
            /* no-op */
          }
          onClose();
        },
        onHelp: () => {
          if (onOpenHelp) onOpenHelp();
        },
      },
      { context: 'use-gallery-keyboard', capture: true }
    );
    return () => unsubscribe();
  }, [handleKeyDown]);
}
