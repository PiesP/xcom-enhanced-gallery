/**
 * @fileoverview 갤러리 이벤트 생명주기 관리
 * 초기화, 정리, 옵션 관리
 */

import { logger } from '@shared/logging';
import { resetKeyboardDebounceState } from '../../keyboard-debounce';
import { handleKeyboardEvent } from '../handlers/keyboard-handler';
import { handleMediaClick } from '../handlers/media-click-handler';
import { removeEventListenersByContext } from '../core/listener-manager';
import {
  clearScopedListeners,
  cancelScopeRefresh,
  ensureScopedEventTarget,
  bindScopedListeners,
  clearScopeState,
} from '../scope/scope-manager';
import type { EventHandlers, GalleryEventOptions } from '../core/event-context';

/**
 * 생명주기 상태 관리
 */
interface LifecycleState {
  initialized: boolean;
  options: GalleryEventOptions | null;
  handlers: EventHandlers | null;
  keyListener: EventListener | null;
  clickListener: EventListener | null;
  spaRouterCleanup: (() => void) | null;
}

let lifecycleState: LifecycleState = {
  initialized: false,
  options: null,
  handlers: null,
  keyListener: null,
  clickListener: null,
  spaRouterCleanup: null,
};

/**
 * 갤러리 이벤트 초기화
 * Phase 305: cleanup 함수를 반환
 */
export async function initializeGalleryEvents(
  handlers: EventHandlers,
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): Promise<() => void> {
  try {
    if (lifecycleState.initialized) {
      cleanupGalleryEvents();
    }

    // Phase 305: galleryRoot 파라미터 지원 (선택적)
    let finalOptions: GalleryEventOptions;
    let explicitGalleryRoot: HTMLElement | null = null;

    if (optionsOrRoot instanceof HTMLElement) {
      // galleryRoot가 명시적으로 제공된 경우
      explicitGalleryRoot = optionsOrRoot;
      finalOptions = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
      };
    } else {
      // 기존 options 객체 또는 undefined
      const options = optionsOrRoot || {};
      finalOptions = {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'gallery',
        ...options,
      };
    }

    lifecycleState.options = finalOptions;
    lifecycleState.handlers = handlers;

    // 키보드 이벤트 핸들러
    const keyHandler: EventListener = (evt: Event) => {
      const event = evt as KeyboardEvent;
      handleKeyboardEvent(event, handlers, finalOptions);
    };

    // 클릭 이벤트 핸들러
    const clickHandler: EventListener = async (evt: Event) => {
      const event = evt as MouseEvent;
      const result = await handleMediaClick(event, handlers, finalOptions);
      if (result.handled && finalOptions.preventBubbling) {
        event.stopPropagation();
        event.preventDefault();
      }
    };

    lifecycleState.keyListener = keyHandler;
    lifecycleState.clickListener = clickHandler;

    // Phase 305: 명시적 galleryRoot가 있으면 직접 바인딩
    if (explicitGalleryRoot) {
      bindScopedListeners(explicitGalleryRoot, keyHandler, clickHandler, finalOptions);
    } else {
      // 기존 로직: Twitter 범위 자동 감지
      ensureScopedEventTarget(keyHandler, clickHandler, finalOptions);
    }

    lifecycleState.initialized = true;

    // **SPA Router Observer Setup**
    // Observe SPA routing changes and re-initialize event listeners
    try {
      const { initializeSPARouterObserver, onRouteChange } = await import(
        '../../spa-router-observer'
      );

      // Initialize the SPA router observer once
      initializeSPARouterObserver();

      // Register callback for route changes
      const unsubscribe = onRouteChange((oldUrl, newUrl) => {
        logger.info('[GalleryEvents] SPA route changed, re-initializing event listeners', {
          oldUrl,
          newUrl,
        });

        // Re-establish event listeners on new page
        if (lifecycleState.keyListener && lifecycleState.clickListener && lifecycleState.options) {
          ensureScopedEventTarget(
            lifecycleState.keyListener,
            lifecycleState.clickListener,
            lifecycleState.options
          );
        }
      });

      lifecycleState.spaRouterCleanup = unsubscribe;

      logger.debug('[GalleryEvents] SPA router observer registered');
    } catch (error) {
      logger.warn('[GalleryEvents] Failed to setup SPA router observer:', error);
    }

    // Phase 305: cleanup 함수 반환
    return () => {
      cleanupGalleryEvents();
    };
  } catch (error) {
    logger.error('Failed to initialize gallery events:', error);
    throw error;
  }
}

/**
 * 갤러리 이벤트 정리
 */
export function cleanupGalleryEvents(): void {
  try {
    if (lifecycleState.options?.context) {
      removeEventListenersByContext(lifecycleState.options.context);
    }

    cancelScopeRefresh();
    clearScopedListeners();

    // 키보드 debounce 상태 초기화
    resetKeyboardDebounceState();

    // **SPA Router Cleanup**
    if (lifecycleState.spaRouterCleanup) {
      try {
        lifecycleState.spaRouterCleanup();
        logger.debug('[GalleryEvents] SPA router observer unregistered');
      } catch (error) {
        logger.warn('[GalleryEvents] Failed to cleanup SPA router observer:', error);
      }
    }

    lifecycleState = {
      initialized: false,
      options: null,
      handlers: null,
      keyListener: null,
      clickListener: null,
      spaRouterCleanup: null,
    };

    clearScopeState();
  } catch (error) {
    logger.error('Error cleaning up gallery events:', error);
  }
}

/**
 * 갤러리 이벤트 옵션 업데이트
 */
export function updateGalleryEventOptions(newOptions: Partial<GalleryEventOptions>): void {
  if (lifecycleState.options) {
    lifecycleState.options = { ...lifecycleState.options, ...newOptions };
  }
}

/**
 * 갤러리 이벤트 상태 스냅샷
 */
export function getGalleryEventSnapshot() {
  return {
    initialized: lifecycleState.initialized,
    options: lifecycleState.options,
    isConnected: lifecycleState.initialized,
  };
}
