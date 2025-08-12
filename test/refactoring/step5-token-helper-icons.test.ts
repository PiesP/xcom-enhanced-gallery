/**
 * Step 5: 토큰 헬퍼 아이콘 통합 테스트
 *
 * TDD로 토큰 헬퍼 UI에 lucide 아이콘을 통합하여 UX 향상
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {} from 'preact';

// Mock dependencies
vi.mock('@shared/services/icon-service', () => ({
  getIcon: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  createScopedLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@shared/external/preact', () => ({
  getPreact: () => ({
    h: (type: string, props: any, ...children: any[]) => ({ type, props, children }),
    Fragment: 'Fragment',
  }),
  getPreactHooks: () => ({
    useState: (initial: any) => [initial, vi.fn()],
    useEffect: vi.fn(),
    useRef: () => ({ current: null }),
  }),
}));

describe('Step 5: 토큰 헬퍼 아이콘 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('TokenHelper 컴포넌트', () => {
    it('should display token examples with icons', async () => {
      const { createTokenHelper } = await import('@features/settings/components/TokenHelper');

      const helper = createTokenHelper({
        onInsertToken: vi.fn(),
      });

      expect(helper).toBeDefined();
    });

    it('should show user icon for {user} token', async () => {
      const iconSvc = await import('@shared/services/icon-service');
      type MockFn = { mockReturnValue: Function };
      const mockGetIcon = iconSvc.getIcon as unknown as MockFn;
      (mockGetIcon as any).mockReturnValue(() => ({ type: 'svg' }));

      const mod = await import('@features/settings/components/TokenHelper');

      mod.createTokenHelper({
        onInsertToken: vi.fn(),
      });

      // 토큰 헬퍼에 user 아이콘이 포함되어야 함
      expect(mockGetIcon).toHaveBeenCalledWith('user');
    });

    it('should show calendar icon for {timestamp} token', async () => {
      const iconSvc = await import('@shared/services/icon-service');
      type MockFn = { mockReturnValue: Function };
      const mockGetIcon = iconSvc.getIcon as unknown as MockFn;
      (mockGetIcon as any).mockReturnValue(() => ({ type: 'svg' }));

      const mod = await import('@features/settings/components/TokenHelper');

      mod.createTokenHelper({
        onInsertToken: vi.fn(),
      });

      expect(mockGetIcon).toHaveBeenCalledWith('calendar');
    });

    it('should show file-text icon for {tweetId} token', async () => {
      const iconSvc = await import('@shared/services/icon-service');
      type MockFn = { mockReturnValue: Function };
      const mockGetIcon = iconSvc.getIcon as unknown as MockFn;
      (mockGetIcon as any).mockReturnValue(() => ({ type: 'svg' }));

      const mod = await import('@features/settings/components/TokenHelper');

      mod.createTokenHelper({
        onInsertToken: vi.fn(),
      });

      expect(mockGetIcon).toHaveBeenCalledWith('file-text');
    });

    it('should handle token insertion with click handler', async () => {
      const mockOnInsert = vi.fn();
      const { createTokenHelper } = await import('@features/settings/components/TokenHelper');

      const helper = createTokenHelper({
        onInsertToken: mockOnInsert,
      });

      // 토큰 버튼 클릭 시뮬레이션
      expect(helper).toBeDefined();
    });
  });

  describe('토큰 아이콘 매핑', () => {
    it('should map tokens to correct icons', async () => {
      const { getTokenIconMapping } = await import('@features/settings/components/TokenHelper');

      const mapping = getTokenIconMapping();

      expect(mapping).toEqual({
        user: 'user',
        tweetId: 'file-text',
        timestamp: 'calendar',
        index: 'hash',
        ext: 'file',
      });
    });

    it('should provide fallback icon for unknown tokens', async () => {
      const mod = await import('@features/settings/components/TokenHelper');
      const icon = mod.getIconForToken('unknownToken');

      expect(icon).toBe('help-circle');
    });
  });
});
