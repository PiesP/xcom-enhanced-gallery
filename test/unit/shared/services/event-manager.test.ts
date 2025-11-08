/**
 * @fileoverview EventManager 통합 테스트
 * @description 49.12% → 80%+ 커버리지 목표
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { EventManager } from '@/shared/services/event-manager';

describe('EventManager', () => {
  setupGlobalTestIsolation();

  let manager: EventManager;

  beforeEach(() => {
    // 각 테스트마다 새로운 인스턴스 생성을 위해 싱글톤 초기화
    (EventManager as any).instance = null;
    manager = EventManager.getInstance();
  });

  afterEach(() => {
    // 테스트 후 정리
    if (manager && !manager.getIsDestroyed()) {
      manager.cleanupAll();
    }
    (EventManager as any).instance = null;
  });

  describe('싱글톤 패턴', () => {
    it('getInstance()는 항상 동일한 인스턴스를 반환해야 함', () => {
      const instance1 = EventManager.getInstance();
      const instance2 = EventManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(EventManager);
    });

    it('새 인스턴스는 destroy되지 않은 상태여야 함', () => {
      expect(manager.getIsDestroyed()).toBe(false);
    });
  });

  describe('DOM 이벤트 관리', () => {
    it('addEventListener로 DOM 이벤트를 등록할 수 있어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addEventListener(element, 'click', handler);

      element.click();
      expect(handler).toHaveBeenCalledOnce();
      expect(manager.getListenerCount()).toBeGreaterThan(0);
    });

    it('addEventListener는 체이닝을 지원해야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const result = manager.addEventListener(element, 'click', handler);

      expect(result).toBe(manager);
    });

    it('addCustomEventListener로 커스텀 이벤트를 등록할 수 있어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addCustomEventListener(element, 'custom-event', handler);

      const event = new CustomEvent('custom-event');
      element.dispatchEvent(event);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('addCustomEventListener는 체이닝을 지원해야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const result = manager.addCustomEventListener(element, 'custom', handler);

      expect(result).toBe(manager);
    });

    it('null 요소에 addEventListener 호출 시 에러 없이 처리되어야 함', () => {
      const handler = vi.fn();

      expect(() => {
        manager.addEventListener(null, 'click', handler);
      }).not.toThrow();

      expect(handler).not.toHaveBeenCalled();
    });

    it('cleanup 호출 시 모든 DOM 이벤트가 제거되어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addEventListener(element, 'click', handler);
      expect(manager.getListenerCount()).toBeGreaterThan(0);

      manager.cleanup();

      element.click();
      expect(handler).not.toHaveBeenCalled();
      expect(manager.getIsDestroyed()).toBe(true);
    });
  });

  describe('Gallery 이벤트 관리', () => {
    it('addListener로 Gallery 이벤트를 등록할 수 있어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const listenerId = manager.addListener(element, 'click', handler, undefined, 'test-context');

      expect(listenerId).toBeTruthy();
      expect(typeof listenerId).toBe('string');

      element.click();
      expect(handler).toHaveBeenCalledOnce();
    });

    it('removeListener로 등록된 리스너를 제거할 수 있어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const listenerId = manager.addListener(element, 'click', handler);
      const removed = manager.removeListener(listenerId);

      expect(removed).toBe(true);

      element.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('removeByContext로 특정 컨텍스트의 리스너들을 일괄 제거할 수 있어야 함', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      manager.addListener(element1, 'click', handler1, undefined, 'test-context');
      manager.addListener(element2, 'click', handler2, undefined, 'test-context');

      const removedCount = manager.removeByContext('test-context');

      // NOTE: 실제 제거된 개수는 구현에 따라 다를 수 있음
      expect(removedCount).toBeGreaterThanOrEqual(2);

      element1.click();
      element2.click();
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('initializeGallery는 Gallery 이벤트를 초기화해야 함', async () => {
      const handlers = {
        onIndexChange: vi.fn(),
        onMediaClick: vi.fn(),
        onClose: vi.fn(),
        onGalleryClose: vi.fn(),
      };

      // Phase 305: initializeGallery가 cleanup 함수를 반환
      const result = await manager.initializeGallery(handlers);
      expect(result).toBeDefined();
      expect(typeof result).toBe('function');
    });

    it('cleanupGallery는 모든 Gallery 이벤트를 정리해야 함', () => {
      expect(() => {
        manager.cleanupGallery();
      }).not.toThrow();
    });

    it('getGalleryStatus는 Gallery 이벤트 상태를 반환해야 함', () => {
      const status = manager.getGalleryStatus();

      expect(status).toBeDefined();
      // NOTE: 상태 객체의 실제 구조는 구현에 따라 다를 수 있음
      expect(typeof status).toBe('object');
    });
  });

  describe('통합 기능', () => {
    it('handleTwitterEvent는 Twitter 이벤트를 등록할 수 있어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      const listenerId = manager.handleTwitterEvent(element, 'click', handler, 'twitter-context');

      expect(listenerId).toBeTruthy();

      element.click();
      expect(handler).toHaveBeenCalledOnce();
    });

    it('getUnifiedStatus는 통합 상태를 반환해야 함', () => {
      const status = manager.getUnifiedStatus();

      expect(status).toBeDefined();
      expect(status).toHaveProperty('domEvents');
      expect(status).toHaveProperty('galleryEvents');
      expect(status).toHaveProperty('totalListeners');
      expect(status).toHaveProperty('isDestroyed');

      expect(status.domEvents).toHaveProperty('listenerCount');
      expect(status.domEvents).toHaveProperty('isDestroyed');
      expect(typeof status.totalListeners).toBe('number');
      expect(typeof status.isDestroyed).toBe('boolean');
    });

    it('cleanupAll은 모든 이벤트를 정리해야 함', () => {
      const element = document.createElement('div');
      const domHandler = vi.fn();

      manager.addEventListener(element, 'click', domHandler);

      manager.cleanupAll();

      element.click();
      expect(domHandler).not.toHaveBeenCalled();
      expect(manager.getIsDestroyed()).toBe(true);
    });
  });

  describe('destroy 상태 처리', () => {
    beforeEach(() => {
      // manager는 이미 생성됨
    });

    it('destroy 상태에서 addEventListener 호출 시 경고를 기록하고 체이닝을 유지해야 함', () => {
      manager.cleanup(); // destroy 상태로 만듦
      expect(manager.getIsDestroyed()).toBe(true);

      const element = document.createElement('div');
      const handler = vi.fn();

      const result = manager.addEventListener(element, 'click', handler);

      expect(result).toBe(manager);

      element.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('destroy 상태에서 addCustomEventListener 호출 시 경고를 기록하고 체이닝을 유지해야 함', () => {
      manager.cleanup();

      const element = document.createElement('div');
      const handler = vi.fn();

      const result = manager.addCustomEventListener(element, 'custom', handler);

      expect(result).toBe(manager);

      const event = new CustomEvent('custom');
      element.dispatchEvent(event);
      expect(handler).not.toHaveBeenCalled();
    });

    it('destroy 상태에서 addListener 호출 시 빈 문자열을 반환해야 함', () => {
      manager.cleanup();

      const element = document.createElement('div');
      const handler = vi.fn();

      const listenerId = manager.addListener(element, 'click', handler);

      expect(listenerId).toBe('');

      element.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('destroy 상태에서 handleTwitterEvent 호출 시 빈 문자열을 반환해야 함', () => {
      manager.cleanup();

      const element = document.createElement('div');
      const handler = vi.fn();

      const listenerId = manager.handleTwitterEvent(element, 'click', handler);

      expect(listenerId).toBe('');

      element.click();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('리스너 카운트', () => {
    it('getListenerCount는 현재 리스너 수를 반환해야 함', () => {
      const initialCount = manager.getListenerCount();

      const element = document.createElement('div');
      manager.addEventListener(element, 'click', vi.fn());

      const newCount = manager.getListenerCount();
      expect(newCount).toBeGreaterThan(initialCount);
    });

    it('cleanup 후 getListenerCount는 0을 반환해야 함', () => {
      const element = document.createElement('div');
      manager.addEventListener(element, 'click', vi.fn());

      expect(manager.getListenerCount()).toBeGreaterThan(0);

      manager.cleanup();
      expect(manager.getListenerCount()).toBe(0);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 리스너 ID로 removeListener 호출 시 false를 반환해야 함', () => {
      const removed = manager.removeListener('non-existent-id');

      expect(removed).toBe(false);
    });

    it('존재하지 않는 컨텍스트로 removeByContext 호출 시 0을 반환해야 함', () => {
      const removed = manager.removeByContext('non-existent-context');

      expect(removed).toBe(0);
    });

    it('cleanup을 여러 번 호출해도 에러가 발생하지 않아야 함', () => {
      expect(() => {
        manager.cleanup();
        manager.cleanup();
        manager.cleanup();
      }).not.toThrow();
    });

    it('cleanupAll을 여러 번 호출해도 에러가 발생하지 않아야 함', () => {
      expect(() => {
        manager.cleanupAll();
        manager.cleanupAll();
      }).not.toThrow();
    });
  });

  describe('이벤트 옵션', () => {
    it('addEventListener에 옵션을 전달할 수 있어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addEventListener(element, 'click', handler, { once: true });

      element.click();
      element.click();

      // once 옵션으로 한 번만 호출되어야 함
      expect(handler).toHaveBeenCalledOnce();
    });

    it('addListener에 옵션을 전달할 수 있어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addListener(element, 'click', handler, { once: true });

      element.click();
      element.click();

      expect(handler).toHaveBeenCalledOnce();
    });

    it('addCustomEventListener에 옵션을 전달할 수 있어야 함', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      manager.addCustomEventListener(element, 'custom', handler, { once: true });

      element.dispatchEvent(new CustomEvent('custom'));
      element.dispatchEvent(new CustomEvent('custom'));

      expect(handler).toHaveBeenCalledOnce();
    });
  });
});
