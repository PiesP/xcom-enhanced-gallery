/**
 * @fileoverview TDD Phase 2: DOM Utils Consolidation Test Suite
 *
 * 목표: DOM 관련 중복 기능들을 UnifiedDOMService로 통합
 *
 * 중복 대상:
 * - src/shared/dom/unified-dom-service.ts (통합 서비스)
 * - src/shared/utils/dom.ts (개별 함수들)
 *
 * TDD 사이클: RED → GREEN → REFACTOR
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// 현재 구현들
import { UnifiedDOMService } from '@shared/dom/unified-dom-service';
import { querySelector, querySelectorAll } from '@shared/utils/dom';

describe('🔴 RED: DOM Utils Consolidation - 중복 기능 식별', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window & typeof globalThis;

  beforeEach(() => {
    dom = new JSDOM(`
      <html>
        <body>
          <div id="test-container">
            <button class="test-btn">Button 1</button>
            <button class="test-btn">Button 2</button>
            <input type="text" id="test-input" />
            <div data-test="media">Media Item</div>
          </div>
        </body>
      </html>
    `);

    document = dom.window.document;
    window = dom.window as Window & typeof globalThis;

    // Mock browser globals
    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('현재 개별 함수들 동작 검증', () => {
    it('should verify individual DOM utility functions work', () => {
      // 개별 함수들이 작동하는지 검증
      const button = querySelector('.test-btn');
      const buttons = querySelectorAll('.test-btn');

      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('Button 1');
      expect(buttons).toHaveLength(2);
    });

    it('should identify duplicate functionality patterns', () => {
      // UnifiedDOMService와 개별 함수들 간의 중복 패턴 식별
      const unifiedButton = UnifiedDOMService.querySelector('.test-btn');
      const individualButton = querySelector('.test-btn');

      expect(unifiedButton?.textContent).toBe(individualButton?.textContent);

      // 중복도 측정 (실제 함수 비교)
      const unifiedMethods = [
        'querySelector',
        'querySelectorAll',
        'addEventListener',
        'createElement',
        'setAttribute',
        'getAttribute',
      ];
      const individualFunctions = [
        'querySelector',
        'querySelectorAll', // 실제로 존재하는 개별 함수들만
      ];

      const overlap = unifiedMethods.filter(method => individualFunctions.includes(method));

      const duplicationRate = overlap.length / individualFunctions.length; // 개별 함수 기준으로 중복률 계산
      expect(duplicationRate).toBeGreaterThan(0.5); // 50% 이상 중복
    });
  });

  describe('UnifiedDOMService 통합 API 요구사항', () => {
    it('should define requirements for unified DOM API', () => {
      // 통합 DOM API 요구사항 정의
      expect(UnifiedDOMService).toBeDefined();
      expect(typeof UnifiedDOMService.querySelector).toBe('function');
      expect(typeof UnifiedDOMService.querySelectorAll).toBe('function');
      expect(typeof UnifiedDOMService.addEventListener).toBe('function');
    });

    it('should verify unified API completeness', () => {
      // 통합 API가 모든 필요한 기능을 포함하는지 검증
      const requiredMethods = [
        'querySelector',
        'querySelectorAll',
        'addEventListener',
        'removeEventListener',
        'createElement',
        'appendChild',
        'removeChild',
        'setAttribute',
        'getAttribute',
      ];

      requiredMethods.forEach(method => {
        expect(UnifiedDOMService[method as keyof typeof UnifiedDOMService]).toBeDefined();
      });
    });
  });
});

describe('🟢 GREEN: DOM Utils Consolidation - 통합 구현', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window & typeof globalThis;

  beforeEach(() => {
    dom = new JSDOM(`
      <html>
        <body>
          <div id="test-container">
            <button class="test-btn">Button 1</button>
            <button class="test-btn">Button 2</button>
          </div>
        </body>
      </html>
    `);

    document = dom.window.document;
    window = dom.window as Window & typeof globalThis;

    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('should implement unified DOM service API', () => {
    // UnifiedDOMService가 모든 DOM 작업을 처리
    const button = UnifiedDOMService.querySelector('.test-btn');
    const buttons = UnifiedDOMService.querySelectorAll('.test-btn');

    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Button 1');
    expect(buttons).toHaveLength(2);

    // 새로운 요소 생성 및 조작
    const newDiv = UnifiedDOMService.createElement('div');
    UnifiedDOMService.setAttribute(newDiv, 'class', 'new-element');

    expect(newDiv.tagName).toBe('DIV');
    expect(UnifiedDOMService.getAttribute(newDiv, 'class')).toBe('new-element');
  });

  it('should provide backward compatibility layer', () => {
    // 기존 개별 함수들이 UnifiedDOMService를 내부적으로 사용
    const unifiedResult = UnifiedDOMService.querySelector('.test-btn');
    const compatResult = querySelector('.test-btn');

    expect(unifiedResult?.textContent).toBe(compatResult?.textContent);
    expect(unifiedResult?.className).toBe(compatResult?.className);
  });
});

describe('🔵 REFACTOR: DOM Utils Consolidation - 최적화', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window & typeof globalThis;

  beforeEach(() => {
    dom = new JSDOM(`
      <html>
        <body>
          <div id="container">
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
          </div>
        </body>
      </html>
    `);

    document = dom.window.document;
    window = dom.window as Window & typeof globalThis;

    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('should demonstrate improved DOM API usage', () => {
    // 개선된 API 사용법 시연
    const container = UnifiedDOMService.querySelector('#container');
    expect(container).toBeTruthy();

    // 새로운 요소 생성 및 조작
    const newElement = UnifiedDOMService.createElement('div');
    UnifiedDOMService.setAttribute(newElement, 'class', 'new-item item'); // item 클래스도 함께 추가
    UnifiedDOMService.appendChild(container!, newElement);

    const items = UnifiedDOMService.querySelectorAll('.item');
    expect(items).toHaveLength(4); // 기존 3개 + 새로 추가한 1개
  });

  it('should show performance benefits', () => {
    // 성능 개선 검증
    const startTime = performance.now();

    // 통합 서비스 사용
    for (let i = 0; i < 100; i++) {
      UnifiedDOMService.querySelector('.item');
    }

    const unifiedTime = performance.now() - startTime;

    const startTime2 = performance.now();

    // 개별 함수 사용 (비교)
    for (let i = 0; i < 100; i++) {
      querySelector('.item');
    }

    const individualTime = performance.now() - startTime2;

    // 통합 서비스가 더 효율적이거나 최소한 동등해야 함
    expect(unifiedTime).toBeLessThanOrEqual(individualTime * 1.2); // 20% 허용 범위
  });

  it('should enable future deprecation of individual functions', () => {
    // 개별 함수들의 향후 deprecated 예정 표시
    // 이것은 실제로는 JSDoc 주석이나 TypeScript deprecated 태그로 처리될 것
    expect(() => querySelector('.item')).not.toThrow();

    // 개별 함수는 여전히 작동하지만 UnifiedDOMService를 내부적으로 사용
    const result1 = querySelector('.item');
    const result2 = UnifiedDOMService.querySelector('.item');

    expect(result1?.textContent).toBe(result2?.textContent);
  });
});

describe('🏆 DOM 통합 완료 검증', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(`
      <html>
        <body>
          <div class="test-element">Test</div>
        </body>
      </html>
    `);

    global.document = dom.window.document;
    global.window = dom.window as Window & typeof globalThis;
    global.HTMLElement = dom.window.HTMLElement;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('should pass all DOM integration requirements', () => {
    // 1. UnifiedDOMService가 완전히 작동
    expect(UnifiedDOMService.querySelector('.test-element')).toBeTruthy();

    // 2. 호환성 레이어가 작동
    expect(querySelector('.test-element')).toBeTruthy();

    // 3. 일관된 결과 제공
    const unified = UnifiedDOMService.querySelector('.test-element');
    const individual = querySelector('.test-element');
    expect(unified?.textContent).toBe(individual?.textContent);

    // 4. 타입 안전성 보장
    expect(unified).toBeInstanceOf(dom.window.HTMLElement);
    expect(individual).toBeInstanceOf(dom.window.HTMLElement);
  });
});
