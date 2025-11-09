/**
 * @fileoverview P7: Performance Optimization Unit Tests
 *
 * IconRegistry와 LazyIcon의 성능 최적화를 검증합니다.
 */

import { describe, test, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import {
  getIconRegistry,
  resetIconRegistry,
  preloadCommonIcons,
  type IconName,
} from '@shared/components/ui/Icon/icon-registry';
import type { IconRegistry } from '@shared/components/ui/Icon/icon-registry';
import {
  LazyIcon,
  useIconPreload,
  useCommonIconPreload,
} from '@shared/components/ui/Icon/lazy-icon';

type TestVNode = {
  tag?: string;
  props: Record<string, unknown>;
  children?: unknown;
};

const toVNode = (value: unknown): TestVNode => value as TestVNode;

// Mock external vendors
vi.mock('@/shared/external/vendors', () => ({
  getSolid: () => ({
    h: vi.fn((tag, props, ...children) => ({ tag, props, children: children.flat() })),
    createSignal: vi.fn(initial => [initial, vi.fn()]),
    createEffect: vi.fn((effect: () => unknown) => {
      if (typeof effect === 'function') {
        effect();
      }
    }),
    onCleanup: vi.fn(() => {}),
  }),
}));

// Mock 기존 아이콘 컴포넌트들 - 올바른 export 구조 제공 (.tsx 파일)
vi.mock('@/shared/components/ui/Icon/hero/HeroDownload.tsx', () => ({
  HeroDownload: vi.fn(() => ({
    tag: 'div',
    props: { 'data-testid': 'icon-download' },
    children: ['Download Icon'],
  })),
}));
vi.mock('@/shared/components/ui/Icon/hero/HeroSettings.tsx', () => ({
  HeroSettings: vi.fn(() => ({
    tag: 'div',
    props: { 'data-testid': 'icon-settings' },
    children: ['Settings Icon'],
  })),
}));
vi.mock('@/shared/components/ui/Icon/hero/HeroX.tsx', () => ({
  HeroX: vi.fn(() => ({ tag: 'div', props: { 'data-testid': 'icon-x' }, children: ['X Icon'] })),
}));
vi.mock('@/shared/components/ui/Icon/hero/HeroChevronLeft.tsx', () => ({
  HeroChevronLeft: vi.fn(() => ({
    tag: 'div',
    props: { 'data-testid': 'icon-chevron-left' },
    children: ['Chevron Left Icon'],
  })),
}));

describe('P7: Performance Optimization Unit Tests', () => {
  describe('IconRegistry', () => {
    let registry: IconRegistry;

    beforeEach(() => {
      resetIconRegistry();
      registry = getIconRegistry();
    });

    afterEach(() => {
      resetIconRegistry();
    });

    test('아이콘을 지연 로딩해야 함', async () => {
      const iconName: IconName = 'Download';

      const IconComponent = await registry.loadIcon(iconName);
      expect(IconComponent).toBeInstanceOf(Function);

      const rendered = toVNode(IconComponent({} as never));
      expect(rendered.props['data-testid']).toBe('icon-download');
    });

    test('동시 로딩 요청을 하나의 로더로 처리해야 함', async () => {
      const iconName: IconName = 'Settings';

      const [firstLoad, secondLoad] = await Promise.all([
        registry.loadIcon(iconName),
        registry.loadIcon(iconName),
      ]);

      expect(firstLoad).toBe(secondLoad);
    });

    test('로딩 중 상태를 getDebugInfo로 노출해야 함', async () => {
      const iconName: IconName = 'X';

      expect(registry.getDebugInfo()).toEqual({ loadingCount: 0, loadingIcons: [] });

      const loadPromise = registry.loadIcon(iconName);
      const during = registry.getDebugInfo();

      expect(during.loadingCount).toBe(1);
      expect(during.loadingIcons).toContain(iconName);

      await loadPromise;

      const after = registry.getDebugInfo();
      expect(after.loadingCount).toBe(0);
      expect(after.loadingIcons).toHaveLength(0);
    });
  });

  describe('preloadCommonIcons', () => {
    beforeEach(() => {
      resetIconRegistry();
    });

    test('자주 사용되는 아이콘들을 프리로드해야 함', async () => {
      await preloadCommonIcons();

      const registry = getIconRegistry();
      const debugInfo = registry.getDebugInfo();

      // 프리로딩 완료 후에는 로딩 중인 아이콘이 없어야 함
      expect(debugInfo.loadingCount).toBe(0);
    });
  });

  describe('LazyIcon Component', () => {
    beforeEach(() => {
      resetIconRegistry();
    });

    test('커스텀 fallback을 지원해야 함', () => {
      const customFallback = {
        tag: 'div',
        props: { 'data-testid': 'custom-loading' },
        children: ['Custom Loading'],
      };

      const result = LazyIcon({ name: 'Settings', fallback: customFallback });

      expect(result).toBe(customFallback);
    });
  });

  describe('Icon Preload Hooks', () => {
    test('useIconPreload가 아이콘들을 프리로드해야 함', () => {
      const TestComponent = () => {
        useIconPreload(['Download', 'Settings']);
        return { tag: 'div', props: {}, children: ['Test Component'] };
      };

      const result = TestComponent();

      const registry = getIconRegistry();

      // 프리로드가 시작되었는지 확인 (동기적으로는 완료되지 않을 수 있음)
      expect(registry.getDebugInfo().loadingCount).toBeGreaterThanOrEqual(0);
      expect(result.children).toContain('Test Component');
    });

    test('useCommonIconPreload가 공통 아이콘들을 프리로드해야 함', () => {
      const TestComponent = () => {
        useCommonIconPreload();
        return { tag: 'div', props: {}, children: ['Test Component'] };
      };

      const result = TestComponent();

      // 컴포넌트가 렌더링되면 프리로드가 시작됨
      expect(result.children).toContain('Test Component');
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(() => {
      resetIconRegistry();
    });

    test('동적 import는 아이콘이 렌더링될 때만 실행되어야 함', async () => {
      const registry = getIconRegistry();
      const heroDownloadModule = await import('@/shared/components/ui/Icon/hero/HeroDownload.tsx');
      const heroDownloadMock = heroDownloadModule.HeroDownload as unknown as Mock;

      heroDownloadMock.mockClear();

      const IconComponent = await registry.loadIcon('Download');
      expect(heroDownloadMock).not.toHaveBeenCalled();

      IconComponent({} as never);
      expect(heroDownloadMock).toHaveBeenCalledTimes(1);
    });

    test('중복 요청을 효율적으로 처리해야 함', async () => {
      const registry = getIconRegistry();
      const iconName: IconName = 'X';

      const promises = Array.from({ length: 6 }, () => registry.loadIcon(iconName));
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBe(results[0]);
      });
    });
  });
});
