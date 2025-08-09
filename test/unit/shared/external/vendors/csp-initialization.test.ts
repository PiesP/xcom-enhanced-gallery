/**
 * @file CSP 환경에서 외부 스크립트 삽입 없이도 vendor 초기화가 완료되어야 한다
 * - initializeVendors는 네트워크 로딩(onceScript) 없이 번들 내장 모듈로 동작
 * - script 엘리먼트 생성 시도를 하지 않는지 검증
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock으로 덮어씌워지지 않도록 테스트에서 실제 모듈 사용
vi.doUnmock('@shared/external/vendors/vendor-api');

// Mock the external libraries to simulate bundled environment
vi.mock('preact', () => ({
  default: {
    createElement: vi.fn(),
    Component: vi.fn(),
    render: vi.fn(),
  },
}));

vi.mock('preact/compat', () => ({
  default: {
    memo: vi.fn(),
    forwardRef: vi.fn(),
    createElement: vi.fn(),
  },
  memo: vi.fn(),
  forwardRef: vi.fn(),
  createElement: vi.fn(),
}));

vi.mock('preact/hooks', () => ({
  useState: vi.fn(),
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useCallback: vi.fn(),
  useRef: vi.fn(),
  useContext: vi.fn(),
  useReducer: vi.fn(),
  useLayoutEffect: vi.fn(),
}));

vi.mock('@preact/signals', () => ({
  signal: vi.fn(),
  computed: vi.fn(),
  effect: vi.fn(),
  batch: vi.fn(),
}));

vi.mock('fflate', () => ({
  zip: vi.fn(),
  unzip: vi.fn(),
  // bundled facade requires these named exports
  strToU8: vi.fn((s: string) => new TextEncoder().encode(s)),
  strFromU8: vi.fn((u8: Uint8Array) => new TextDecoder().decode(u8)),
  zipSync: vi.fn(() => new Uint8Array()),
  unzipSync: vi.fn(() => ({})),
  deflate: vi.fn(),
  inflate: vi.fn(),
}));

describe('Vendor initialization under CSP (no network loads)', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // ensure clean vendor cache between tests
    vi.resetModules();
  });

  afterEach(() => {
    createElementSpy?.mockRestore();
  });

  it('initializeVendors completes without creating <script> tags and getPreactCompat works', async () => {
    // Arrange: spy on document.createElement to detect script injection attempts
    createElementSpy = vi.spyOn(document, 'createElement');

    // Import the real vendor-api module (not mocked)
    const vendors = await import('../../../../../src/shared/external/vendors/vendor-api');

    // reset any previous state
    vendors.resetVendorCache();

    // Act - this should succeed with bundled modules
    await vendors.initializeVendors();

    // Assert: should not have attempted to create any script element
    const createdScriptCalls = createElementSpy.mock.calls.filter(args => args[0] === 'script');
    expect(createdScriptCalls.length).toBe(0);

    // And compat should be available synchronously
    const compat = vendors.getPreactCompat();
    expect(typeof compat.memo).toBe('function');
    expect(typeof compat.forwardRef).toBe('function');
  });
});
