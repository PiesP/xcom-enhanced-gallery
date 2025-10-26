/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Enhanced Gallery Keyboard Hook
 * @description 갤러리 키보드 지원을 제공하는 커스텀 훅 (Esc 키 및 도움말 토글)
 */

// NOTE: Vitest(vite-node) Windows alias 해석 이슈 회피 — 내부 의존성은 상대 경로 사용
import { logger } from '@shared/logging';
import { getSolid } from '../../../../../shared/external/vendors';
import { keyboardNavigator } from '../../../../../shared/services/input/keyboard-navigator';

interface UseGalleryKeyboardOptions {
  onClose: () => void;
  /**
   * 키보드 도움말 오버레이 열기 콜백 (Shift + / 또는 '?')
   * 갤러리 컨텍스트에서만 활성화됩니다.
   */
  onOpenHelp?: () => void;
}

export function useGalleryKeyboard({ onClose, onOpenHelp }: UseGalleryKeyboardOptions) {
  const { createEffect, onCleanup } = getSolid();

  createEffect(() => {
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
          onOpenHelp?.();
        },
      },
      { context: 'use-gallery-keyboard', capture: true }
    );

    onCleanup(() => unsubscribe());
  });
}
