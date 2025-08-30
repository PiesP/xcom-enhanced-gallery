/**
 * @fileoverview 누락된 훅 함수들의 모의 구현
 * @description 테스트 환경에서 사용할 기본 훅 모의 함수들
 */

import { vi } from 'vitest';

// 기본 모의 훅 구현
export const mockHooks = {
  useEffect: vi.fn(),
  useState: vi.fn(),
  useCallback: vi.fn(),
  useMemo: vi.fn(),
  useRef: vi.fn(),
};

export default mockHooks;
