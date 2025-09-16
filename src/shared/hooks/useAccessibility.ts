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

import { getPreactHooks } from '../external/vendors';
import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/timer-management';

/**
 * 간소화된 키보드 네비게이션 훅 (Esc 키만 지원)
 */
export function useKeyboardNavigation(
  handlers: {
    onEscape?: () => void;
  } = {},
  dependencies: unknown[] = []
) {
  const { useEffect } = getPreactHooks();
  const { onEscape } = handlers;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.();
          break;
        // 다른 키들은 더 이상 지원하지 않음
        default:
          break;
      }
    };

    // 중앙 이벤트 매니저 경유 등록 (정책상 직접 등록 금지)
    const { EventManager } = require('../services/EventManager');
    EventManager.getInstance().addListener(
      document,
      'keydown',
      handleKeyDown as unknown as EventListener,
      { capture: false },
      'use-accessibility'
    );
    return () => {
      const { EventManager } = require('../services/EventManager');
      EventManager.getInstance().removeByContext('use-accessibility');
    };
  }, dependencies);
}

/**
 * 포커스 트랩 훅
 */
export function useFocusTrap(enabled: boolean = true) {
  const { useRef, useEffect } = getPreactHooks();
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
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
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [enabled]);

  return containerRef;
}

/**
 * ARIA 라이브 리전 훅
 */
export function useAriaLive(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  const { useEffect } = getPreactHooks();
  useEffect(() => {
    if (!message) return;
    // 중앙 라이브 리전 매니저를 사용하여 단일 인스턴스에 공지
    try {
      const { announce } = require('../utils/accessibility/live-region-manager');
      announce(message, politeness);
    } catch {
      // fallback: 무시 (테스트/비브라우저 환경)
    }
    return () => void 0;
  }, [message, politeness]);
}

/**
 * 라이브 리전 메시지 알림 훅
 */
export function useLiveRegion(politeness: 'polite' | 'assertive' = 'polite') {
  const { useCallback } = getPreactHooks();
  const announce = useCallback(
    (message: string) => {
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
    },
    [politeness]
  );

  return announce;
}

/**
 * 외부 클릭 감지 훅
 */
export function useClickOutside(callback: () => void, enabled: boolean = true) {
  const { useRef, useCallback, useEffect } = getPreactHooks();
  const ref = useRef<HTMLElement>(null);

  const handleClickOutside = useCallback(
    (event: Event) => {
      if (enabled && ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    },
    [callback, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside, enabled]);

  return ref;
}

/**
 * 화면 크기 감지 훅
 */
export function useMediaQuery(query: string): boolean {
  const { useState, useEffect } = getPreactHooks();

  const getMatches = (query: string): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState(getMatches(query));

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    const handleChange = () => {
      setMatches(getMatches(query));
    };

    if (matchMedia.addEventListener) {
      matchMedia.addEventListener('change', handleChange);
      return () => matchMedia.removeEventListener('change', handleChange);
    } else {
      matchMedia.addListener(handleChange);
      return () => matchMedia.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}
