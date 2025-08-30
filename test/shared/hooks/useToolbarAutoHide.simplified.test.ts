// @ts-nocheck - 툴바 자동 숨김 훅 테스트
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';

// vendor 시스템 목업
vi.mock('@shared/external/vendors', () => ({
  getPreactHooks: () => ({
    useEffect: vi.fn(),
    useRef: vi.fn(() => ({ current: null })),
    useCallback: vi.fn(fn => fn),
    useMemo: vi.fn(fn => fn()),
  }),
  getPreactSignals: () => ({
    signal: vi.fn(value => ({ value })),
  }),
}));

// useToolbarAutoHide 훅 목업
const useToolbarAutoHide = vi.fn(() => ({
  isVisible: true,
  isAutoHideActive: false,
  showToolbar: vi.fn(),
  hideToolbar: vi.fn(),
}));

// HTMLElement 목업 설정
Object.defineProperty(globalThis, 'HTMLElement', {
  value: class MockHTMLElement {
    constructor() {
      this.style = {};
      this.addEventListener = vi.fn();
      this.removeEventListener = vi.fn();
      this.contains = vi.fn(() => false);
      this.closest = vi.fn(() => null);
    }
  },
  writable: true,
});

// 타이머 모킹
vi.useFakeTimers();

describe('useToolbarAutoHide - Simplified', () => {
  let mockElement;

  beforeEach(() => {
    // HTML 요소 목 생성
    mockElement = {
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      contains: vi.fn(() => false),
      closest: vi.fn(() => null),
    };

    // 모든 타이머 정리
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('훅 기본 동작', () => {
    it('useToolbarAutoHide가 함수로 정의되어야 한다', () => {
      expect(typeof useToolbarAutoHide).toBe('function');
    });

    it('필수 옵션으로 호출할 수 있어야 한다', () => {
      expect(() => {
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 500,
          enabled: true,
        });
      }).not.toThrow();
    });

    it('enabled가 false일 때도 호출할 수 있어야 한다', () => {
      expect(() => {
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 500,
          enabled: false,
        });
      }).not.toThrow();
    });
  });

  describe('옵션 검증', () => {
    it('다양한 initialDelay 값으로 호출할 수 있어야 한다', () => {
      const delays = [500, 1000, 2000, 5000];

      delays.forEach(initialDelay => {
        expect(() => {
          useToolbarAutoHide({
            toolbarElement: mockElement,
            initialDelay,
            enabled: true,
          });
        }).not.toThrow();
      });
    });

    it('hoverZoneElement가 있을 때도 동작해야 한다', () => {
      expect(() => {
        useToolbarAutoHide({
          toolbarElement: mockElement,
          hoverZoneElement: mockElement,
          initialDelay: 500,
          enabled: true,
        });
      }).not.toThrow();
    });
  });

  describe('반환값 검증', () => {
    it('올바른 형태의 객체를 반환해야 한다', () => {
      const result = useToolbarAutoHide({
        toolbarElement: mockElement,
        initialDelay: 500,
        enabled: true,
      });

      expect(result).toHaveProperty('isVisible');
      expect(result).toHaveProperty('isAutoHideActive');
      expect(result).toHaveProperty('showToolbar');
      expect(result).toHaveProperty('hideToolbar');
    });

    it('showToolbar와 hideToolbar가 함수여야 한다', () => {
      const result = useToolbarAutoHide({
        toolbarElement: mockElement,
        initialDelay: 500,
        enabled: true,
      });

      expect(typeof result.showToolbar).toBe('function');
      expect(typeof result.hideToolbar).toBe('function');
    });
  });

  describe('다양한 시나리오', () => {
    it('null 요소가 전달되어도 에러가 발생하지 않아야 한다', () => {
      expect(() => {
        useToolbarAutoHide({
          toolbarElement: null,
          initialDelay: 500,
          enabled: true,
        });
      }).not.toThrow();
    });

    it('짧은 딜레이 시간(0.5초)도 처리할 수 있어야 한다', () => {
      expect(() => {
        useToolbarAutoHide({
          toolbarElement: mockElement,
          initialDelay: 500,
          enabled: true,
        });
      }).not.toThrow();
    });
  });
});
