import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateMockCompleteness,
  validateMockFunctions,
  diagnoseMockState,
  logMockDiagnosticsResults,
  expectValidMocks,
} from '../validation/mock-validation.js';

// Mock vendor API structure for testing
const mockPreactAPI = {
  h: vi.fn(),
  render: vi.fn(),
  Fragment: vi.fn(),
  createRef: vi.fn(),
  isValidElement: vi.fn(),
  options: {},
  createElement: vi.fn(),
  memo: vi.fn(),
};

const mockPreactHooksAPI = {
  useState: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useMemo: vi.fn(),
  useCallback: vi.fn(),
  useContext: vi.fn(),
  useReducer: vi.fn(),
  useLayoutEffect: vi.fn(),
  useErrorBoundary: vi.fn(),
  useDebugValue: vi.fn(),
};

const mockPreactSignalsAPI = {
  signal: vi.fn(),
  computed: vi.fn(),
  effect: vi.fn(),
  batch: vi.fn(),
  untracked: vi.fn(),
};

const mockFflateAPI = {
  zip: vi.fn(),
  unzip: vi.fn(),
  strToU8: vi.fn(),
  strFromU8: vi.fn(),
  gzip: vi.fn(),
  gunzip: vi.fn(),
  deflate: vi.fn(),
  inflate: vi.fn(),
};

describe('Mock Validation System', function () {
  beforeEach(function () {
    vi.clearAllMocks();
  });

  afterEach(function () {
    vi.restoreAllMocks();
  });

  describe('validateMockCompleteness', function () {
    it('올바른 mock이 모든 필수 API를 포함한 경우 true를 반환해야 한다', function () {
      const requiredAPI = ['h', 'render', 'Fragment'];
      const result = validateMockCompleteness(mockPreactAPI, requiredAPI);

      expect(result.isValid).toBe(true);
      expect(result.missingAPIs).toEqual([]);
    });

    it('누락된 API가 있는 경우 false를 반환하고 누락된 API 목록을 제공해야 한다', function () {
      const incompleteMock = {
        h: vi.fn(),
        render: vi.fn(),
        // Fragment 누락
      };
      const requiredAPI = ['h', 'render', 'Fragment'];
      const result = validateMockCompleteness(incompleteMock, requiredAPI);

      expect(result.isValid).toBe(false);
      expect(result.missingAPIs).toEqual(['Fragment']);
    });

    it('빈 mock 객체인 경우 모든 API가 누락되었다고 보고해야 한다', function () {
      const emptyMock = {};
      const requiredAPI = ['h', 'render', 'Fragment'];
      const result = validateMockCompleteness(emptyMock, requiredAPI);

      expect(result.isValid).toBe(false);
      expect(result.missingAPIs).toEqual(['h', 'render', 'Fragment']);
    });
  });

  describe('validateMockFunctions', function () {
    it('모든 함수가 vi.fn()으로 생성된 경우 true를 반환해야 한다', function () {
      const result = validateMockFunctions(mockPreactAPI, 'Preact');
      expect(result).toBe(true);
    });

    it('일반 함수가 포함된 경우 false를 반환해야 한다', function () {
      const invalidMock = {
        h: vi.fn(),
        render: function () {}, // 일반 함수
        Fragment: vi.fn(),
      };

      const result = validateMockFunctions(invalidMock, 'Preact');
      expect(result).toBe(false);
    });

    it('비함수 값이 포함된 경우 해당 값은 무시해야 한다', function () {
      const mixedMock = {
        h: vi.fn(),
        render: vi.fn(),
        Fragment: vi.fn(),
        version: '1.0.0', // 문자열 값
      };

      const result = validateMockFunctions(mixedMock, 'Preact');
      expect(result).toBe(true);
    });
  });

  describe('diagnoseMockState', function () {
    it('유효한 mock manager에 대해 진단 결과를 생성해야 한다', function () {
      const mockManager = {
        getPreactSafe: function () {
          return mockPreactAPI;
        },
        getPreactHooksSafe: function () {
          return mockPreactHooksAPI;
        },
        getPreactSignalsSafe: function () {
          return mockPreactSignalsAPI;
        },
        getFflateSafe: function () {
          return mockFflateAPI;
        },
      };

      const diagnostics = diagnoseMockState(mockManager);

      expect(diagnostics).toBeDefined();
      expect(diagnostics.completeness).toBeDefined();
      expect(diagnostics.mockFunctions).toBeDefined();
      expect(diagnostics.summary).toBeDefined();
      expect(Array.isArray(diagnostics.completeness)).toBe(true);
      expect(Array.isArray(diagnostics.mockFunctions)).toBe(true);
    });

    it('요약 정보에 전체 API 수와 유효한 API 수를 포함해야 한다', function () {
      const mockManager = {
        getPreactSafe: function () {
          return mockPreactAPI;
        },
        getPreactHooksSafe: function () {
          return mockPreactHooksAPI;
        },
        getPreactSignalsSafe: function () {
          return mockPreactSignalsAPI;
        },
        getFflateSafe: function () {
          return mockFflateAPI;
        },
      };

      const diagnostics = diagnoseMockState(mockManager);

      expect(typeof diagnostics.summary.totalAPIs).toBe('number');
      expect(typeof diagnostics.summary.validAPIs).toBe('number');
      expect(diagnostics.summary.totalAPIs).toBeGreaterThan(0);
      expect(diagnostics.summary.validAPIs).toBeGreaterThanOrEqual(0);
      expect(diagnostics.summary.validAPIs).toBeLessThanOrEqual(diagnostics.summary.totalAPIs);
    });
  });

  describe('expectValidMocks', function () {
    it('유효한 mock manager인 경우 예외를 발생시키지 않아야 한다', function () {
      const mockManager = {
        getPreactSafe: function () {
          return mockPreactAPI;
        },
        getPreactHooksSafe: function () {
          return mockPreactHooksAPI;
        },
        getPreactSignalsSafe: function () {
          return mockPreactSignalsAPI;
        },
        getFflateSafe: function () {
          return mockFflateAPI;
        },
      };

      expect(function () {
        expectValidMocks(mockManager);
      }).not.toThrow();
    });

    it('누락된 API가 있는 경우 에러를 발생시켜야 한다', function () {
      const incompleteMockManager = {
        getPreactSafe: function () {
          return { h: vi.fn() }; // render와 Fragment 누락
        },
        getPreactHooksSafe: function () {
          return mockPreactHooksAPI;
        },
        getPreactSignalsSafe: function () {
          return mockPreactSignalsAPI;
        },
        getFflateSafe: function () {
          return mockFflateAPI;
        },
      };

      expect(function () {
        expectValidMocks(incompleteMockManager);
      }).toThrow();
    });
  });

  describe('logMockDiagnosticsResults', function () {
    it('진단 결과를 성공적으로 로깅해야 한다', function () {
      const mockManager = {
        getPreactSafe: function () {
          return mockPreactAPI;
        },
        getPreactHooksSafe: function () {
          return mockPreactHooksAPI;
        },
        getPreactSignalsSafe: function () {
          return mockPreactSignalsAPI;
        },
        getFflateSafe: function () {
          return mockFflateAPI;
        },
      };

      // 로깅 함수가 에러 없이 실행되는지 확인
      expect(function () {
        const diagnostics = diagnoseMockState(mockManager);
        logMockDiagnosticsResults(diagnostics);
      }).not.toThrow();
    });
  });
});
