/**
 * @fileoverview Accessibility Hooks
 * @version 3.0.0 - Accessibility System
 *
 * 접근성을 위한 통합 커스텀 훅들
 * - 키보드 네비게이션
 * - 포커스 트랩
 * - 스크린 리더 지원
 * - ARIA 상태 관리
 */

import { createEventListener } from '../utils/type-safety-helpers';

import { getSolid } from '../external/vendors';
import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/timer-management';

/**
 * 간소화된 키보드 네비게이션 훅 (Esc 키만 지원)
 */
export function useKeyboardNavigation(handlers: { onEscape?: () => void } = {}): void {
  const { createEffect, onCleanup } = getSolid();

  createEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handlers.onEscape?.();
      }
    };

    const { EventManager } = require('../services/EventManager');
    // Phase 137: Type Guard 래퍼로 EventListener 타입 변환
    EventManager.getInstance().addListener(
      document,
      'keydown',
      createEventListener(handleKeyDown),
      { capture: false },
      'use-accessibility'
    );

    onCleanup(() => {
      const { EventManager } = require('../services/EventManager');
      EventManager.getInstance().removeByContext('use-accessibility');
    });
  });
}

/**
 * 포커스 트랩 훅
 */
export function useFocusTrap(enabled: boolean = true) {
  const { useRef, createEffect, onCleanup } = getSolid();
  const containerRef = useRef<HTMLElement | null>(null);

  createEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]',
    ].join(', ');

    const focusableElements = Array.from(
      container.querySelectorAll(focusableSelector)
    ) as HTMLElement[];

    if (focusableElements.length === 0) {
      logger.debug('[useFocusTrap] No focusable elements found');
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (
          document.activeElement === firstElement ||
          !container.contains(document.activeElement)
        ) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const activeElement = document.activeElement;
    if (!container.contains(activeElement)) {
      firstElement?.focus();
    }

    container.addEventListener('keydown', handleTabKey);
    onCleanup(() => container.removeEventListener('keydown', handleTabKey));
  });

  return containerRef;
}

/**
 * ARIA 라이브 리전 훅
 */
export function useAriaLive(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  const { createEffect } = getSolid();
  createEffect(() => {
    if (!message) return;
    try {
      const { announce } = require('../utils/accessibility/live-region-manager');
      announce(message, politeness);
    } catch {
      // fallback: 무시 (테스트/비브라우저 환경)
    }
  });
}

/**
 * 라이브 리전 메시지 알림 훅
 */
export function useLiveRegion(politeness: 'polite' | 'assertive' = 'polite') {
  return (message: string) => {
    if (!message) return;

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('class', 'sr-only');
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    document.body.appendChild(liveRegion);

    globalTimerManager.setTimeout(() => {
      liveRegion.textContent = message;
      globalTimerManager.setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      }, 1000);
    }, 100);
  };
}

/**
 * 외부 클릭 감지 훅
 */
export function useClickOutside(callback: () => void, enabled: boolean = true) {
  const { useRef, createEffect, onCleanup } = getSolid();
  const ref = useRef<HTMLElement | null>(null);

  createEffect(() => {
    if (!enabled) {
      return;
    }

    const handleClickOutside = (event: Event) => {
      const element = ref.current;
      if (element && !element.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });
  });

  return ref;
}

/**
 * 화면 크기 감지 훅
 */
export function useMediaQuery(query: string): () => boolean {
  const { createSignal, createEffect, onCleanup } = getSolid();

  const getMatches = (query: string): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = createSignal(getMatches(query));

  createEffect(() => {
    const matchMedia = window.matchMedia(query);

    const handleChange = () => {
      setMatches(getMatches(query));
    };

    if (matchMedia.addEventListener) {
      matchMedia.addEventListener('change', handleChange);
      onCleanup(() => matchMedia.removeEventListener('change', handleChange));
    } else {
      matchMedia.addListener(handleChange);
      onCleanup(() => matchMedia.removeListener(handleChange));
    }
  });

  return matches;
}
