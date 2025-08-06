/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Enhanced Gallery Keyboard Hook
 * @description 갤러리 키보드 지원을 제공하는 커스텀 훅 (Esc 키만 지원)
 */

import { ComponentManager } from '@shared/components/component-manager';
import { logger } from '@shared/logging';

interface UseGalleryKeyboardOptions {
  onClose: () => void;
}

export function useGalleryKeyboard({ onClose }: UseGalleryKeyboardOptions) {
  const { useCallback, useEffect } = ComponentManager.getHookManager();

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

      // 키보드 이벤트 처리
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          onClose();
          logger.debug('Gallery: Esc key pressed, closing gallery');
          break;
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}
