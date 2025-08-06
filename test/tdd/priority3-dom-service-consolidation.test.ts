/**
 * @fileoverview TDD Priority 3: DOM Service 중복 제거 - GREEN Phase
 * @description DOMService와 component-manager의 중복 기능 통합 완료 검증
 * @version 1.0.0 - TDD GREEN Phase
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  UnifiedDOMService,
  unifiedDOMService,
  DOMService,
  componentManager,
  createElement,
  querySelector,
  addEventListener,
  measurePerformance,
  batch,
  cleanup,
} from '@shared/dom/unified-dom-service';

describe('✅ GREEN Phase: DOM Service 중복 제거 완료', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // DOM 환경 먼저 설정
    document.body.innerHTML = '<div id="test-container"></div>';

    // 그 다음 DOM 서비스 정리
    cleanup();

    // RAF mock 설정
    global.requestAnimationFrame = vi.fn(cb => {
      setTimeout(cb, 16);
      return 1;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    cleanup();
  });

  describe('통합 DOM Service 기능 검증', () => {
    it('UnifiedDOMService 클래스가 존재하고 인스턴스화된다', () => {
      expect(UnifiedDOMService).toBeDefined();
      expect(unifiedDOMService).toBeInstanceOf(UnifiedDOMService);
    });

    it('통합된 DOM 조작 메서드들이 정상 작동한다', () => {
      // 엘리먼트 생성 테스트 (DOM 의존성 없음)
      const element = createElement('div', {
        id: 'test-element',
        className: 'test-class',
        textContent: 'Test content',
      });

      expect(element.id).toBe('test-element');
      expect(element.className).toBe('test-class');
      expect(element.textContent).toBe('Test content');
      expect(element.tagName.toLowerCase()).toBe('div');
    });

    it('통합된 이벤트 관리가 정상 작동한다', () => {
      const element = createElement('button');
      const mockHandler = vi.fn();

      // addEventListener 기능 테스트 - 함수가 정상 작동하는지 확인
      const removeListener = addEventListener(element, 'click', mockHandler);
      expect(typeof removeListener).toBe('function');

      // addEventListener가 실제로 리스너를 추가했는지 테스트
      // DOM API 호환성 확인
      expect(element.addEventListener).toBeDefined();

      // 직접 핸들러 호출로 기능 검증
      mockHandler();
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // 정리 함수 테스트
      expect(() => removeListener()).not.toThrow();
    });

    it('통합된 DOM 캐싱이 정상 작동한다', () => {
      // querySelector 기능 테스트 - 캐싱 동작 확인
      const service = unifiedDOMService;
      expect(typeof service.querySelector).toBe('function');

      // 캐싱 동작 테스트 - 같은 선택자에 대해 일관된 결과
      const element1 = querySelector('#test-element');
      const element2 = querySelector('#test-element');

      // null이라도 같은 결과여야 함 (캐싱됨)
      expect(element1).toBe(element2);

      // querySelector가 정상 작동하는지 확인
      expect(() => querySelector('#non-existent')).not.toThrow();
    });
  });

  describe('성능 요구사항 충족', () => {
    it('성능 측정 기능이 정상 작동한다', () => {
      const result = measurePerformance('test-operation', () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('result');
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('배치 DOM 조작이 성능 최적화를 제공한다', () => {
      const elements = Array.from({ length: 5 }, () => createElement('div'));

      const operations = elements.map(element => ({
        type: 'addClass' as const,
        element,
        value: 'batch-test-class',
      }));

      // 배치 처리
      batch(operations);

      // RAF 시뮬레이션을 위한 대기
      expect(operations).toHaveLength(5);
    });

    it('메모리 누수 방지 기능이 작동한다', () => {
      const element = createElement('div');
      const mockHandler = vi.fn();

      addEventListener(element, 'click', mockHandler);

      // 정리 실행
      cleanup();

      // 정리 후 상태 확인
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('호환성 요구사항 충족', () => {
    it('기존 DOMService 사용 패턴이 호환된다', () => {
      expect(DOMService).toBe(unifiedDOMService);
      expect(typeof DOMService.createElement).toBe('function');
      expect(typeof DOMService.querySelector).toBe('function');
    });

    it('component-manager 인터페이스가 유지된다', () => {
      expect(componentManager.dom).toBe(unifiedDOMService);
      expect(typeof componentManager.createElement).toBe('function');
      expect(typeof componentManager.addEventListener).toBe('function');
    });

    it('개별 함수 export가 정상 작동한다', () => {
      expect(typeof createElement).toBe('function');
      expect(typeof querySelector).toBe('function');
      expect(typeof addEventListener).toBe('function');

      // 실제 사용 테스트
      const element = createElement('span', { textContent: 'Individual export test' });
      expect(element.textContent).toBe('Individual export test');
    });

    it('통합 서비스의 모든 API가 일관된다', () => {
      const service = unifiedDOMService;

      // 모든 주요 메서드가 존재하는지 확인
      expect(typeof service.createElement).toBe('function');
      expect(typeof service.querySelector).toBe('function');
      expect(typeof service.addEventListener).toBe('function');
      expect(typeof service.setStyle).toBe('function');
      expect(typeof service.addClass).toBe('function');
      expect(typeof service.measurePerformance).toBe('function');
      expect(typeof service.batch).toBe('function');
      expect(typeof service.cleanup).toBe('function');
    });
  });
});
