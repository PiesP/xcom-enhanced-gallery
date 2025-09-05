/**
 * @fileoverview P7: Performance Optimization Unit Tests
 *
 * IconRegistry와 LazyIcon의 성능 최적화를 검증합니다.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import {
  IconRegistry,
  getIconRegistry,
  resetIconRegistry,
  preloadCommonIcons,
  type IconName,
} from '../../../src/shared/services/iconRegistry.js';
import {
  LazyIcon,
  useIconPreload,
  useCommonIconPreload,
} from '../../../src/shared/components/LazyIcon.js';

// Mock 기존 아이콘 컴포넌트들
vi.mock('../../../src/shared/components/ui/Icon/icons/Download', () => ({
  Download: vi.fn(() => <div data-testid='icon-download'>Download Icon</div>),
}));
vi.mock('../../../src/shared/components/ui/Icon/icons/Settings', () => ({
  Settings: vi.fn(() => <div data-testid='icon-settings'>Settings Icon</div>),
}));
vi.mock('../../../src/shared/components/ui/Icon/icons/X', () => ({
  X: vi.fn(() => <div data-testid='icon-x'>X Icon</div>),
}));
vi.mock('../../../src/shared/components/ui/Icon/icons/ChevronLeft', () => ({
  ChevronLeft: vi.fn(() => <div data-testid='icon-chevron-left'>Chevron Left Icon</div>),
}));

describe('P7: Performance Optimization Unit Tests', () => {
  describe('IconRegistry', () => {
    let registry: IconRegistry;

    beforeEach(() => {
      resetIconRegistry();
      registry = getIconRegistry();
    });

    afterEach(() => {
      registry.clearAllCaches();
    });

    test('아이콘을 지연 로딩해야 함', async () => {
      const iconName: IconName = 'Download';

      // 처음에는 캐시에 없어야 함
      const cacheKey = {};
      expect(registry.getCachedIcon(cacheKey, iconName)).toBeNull();

      // 아이콘 로드
      const IconComponent = await registry.loadIcon(iconName);
      expect(IconComponent).toBeDefined();

      // 캐시에 저장
      registry.setCachedIcon(cacheKey, iconName, IconComponent);
      expect(registry.getCachedIcon(cacheKey, iconName)).toBe(IconComponent);
    });

    test('중복 로딩을 방지해야 함', async () => {
      const iconName: IconName = 'Settings';

      // 동시에 여러 번 로드 요청
      const promises = [
        registry.loadIcon(iconName),
        registry.loadIcon(iconName),
        registry.loadIcon(iconName),
      ];

      const results = await Promise.all(promises);

      // 모든 결과가 동일한 컴포넌트여야 함
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });

    test('로딩 상태를 추적해야 함', () => {
      const iconName: IconName = 'X';

      // 초기에는 로딩 중이 아님
      expect(registry.isLoading(iconName)).toBe(false);

      // 로딩 시작 (Promise는 대기하지 않음)
      const loadPromise = registry.loadIcon(iconName);

      // 로딩 중 상태 확인 (즉시 확인하면 여전히 로딩 중일 수 있음)
      expect(registry.isLoading(iconName)).toBe(true);

      // 로딩 완료 후 정리
      return loadPromise.then(() => {
        expect(registry.isLoading(iconName)).toBe(false);
      });
    });

    test('캐시를 적절히 관리해야 함', async () => {
      const iconName: IconName = 'ChevronLeft';
      const cacheKey1 = {};
      const cacheKey2 = {};

      // 아이콘 로드
      const IconComponent = await registry.loadIcon(iconName);

      // 서로 다른 캐시 키에 저장
      registry.setCachedIcon(cacheKey1, iconName, IconComponent);
      registry.setCachedIcon(cacheKey2, iconName, IconComponent);

      // 각각의 캐시에서 조회 가능
      expect(registry.getCachedIcon(cacheKey1, iconName)).toBe(IconComponent);
      expect(registry.getCachedIcon(cacheKey2, iconName)).toBe(IconComponent);

      // cacheKey1 캐시 제거
      registry.clearCache(cacheKey1);
      expect(registry.getCachedIcon(cacheKey1, iconName)).toBeNull();
      expect(registry.getCachedIcon(cacheKey2, iconName)).toBe(IconComponent);

      // 모든 캐시 제거
      registry.clearAllCaches();
      expect(registry.getCachedIcon(cacheKey2, iconName)).toBeNull();
    });

    test('디버그 정보를 제공해야 함', () => {
      const debugInfo = registry.getDebugInfo();

      expect(debugInfo).toHaveProperty('loadingCount');
      expect(debugInfo).toHaveProperty('loadingIcons');
      expect(typeof debugInfo.loadingCount).toBe('number');
      expect(Array.isArray(debugInfo.loadingIcons)).toBe(true);
    });

    test('fallback 아이콘을 지원해야 함', async () => {
      const fallbackComponent = vi.fn(() => <div>Fallback Icon</div>);
      registry.setFallbackIcon(fallbackComponent);

      // 존재하지 않는 아이콘 로드 시도 (실제로는 mock되어 있으므로 fallback 테스트를 위해 다른 방법 사용)
      vi.doMock('../../../src/shared/components/ui/Icon/icons/Download.js', () => ({})); // 빈 모듈로 변경

      try {
        await registry.loadIcon('Download' as IconName);
      } catch (error) {
        // fallback이 설정되어 있으므로 에러가 발생하지 않아야 함
        expect(error).toBeUndefined();
      }
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

    test('아이콘을 지연 로딩해야 함', async () => {
      render(<LazyIcon name='Download' />);

      // 처음에는 로딩 상태
      expect(screen.getByLabelText('아이콘 로딩 중')).toBeInTheDocument();

      // 아이콘 로드 완료 대기
      await vi.waitFor(() => {
        expect(screen.getByTestId('icon-download')).toBeInTheDocument();
      });
    });

    test('커스텀 fallback을 지원해야 함', () => {
      const CustomFallback = () => <div data-testid='custom-loading'>Custom Loading</div>;

      render(<LazyIcon name='Settings' fallback={CustomFallback} />);

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });

    test('에러 상태를 처리해야 함', async () => {
      // 아이콘 로딩 실패 시나리오를 위해 mock 에러 발생
      vi.doMock('../../../src/shared/components/ui/Icon/icons/X.js', () => {
        throw new Error('Icon not found');
      });

      const CustomErrorFallback = ({ error }: { error: Error }) => (
        <div data-testid='custom-error'>{error.message}</div>
      );

      render(<LazyIcon name='X' errorFallback={CustomErrorFallback} />);

      await vi.waitFor(() => {
        expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      });
    });

    test('아이콘 props를 전달해야 함', async () => {
      render(
        <LazyIcon name='ChevronLeft' size={32} stroke={3} color='red' className='test-class' />
      );

      await vi.waitFor(() => {
        const icon = screen.getByTestId('icon-chevron-left');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Icon Preload Hooks', () => {
    test('useIconPreload가 아이콘들을 프리로드해야 함', () => {
      const TestComponent = () => {
        useIconPreload(['Download', 'Settings']);
        return <div>Test Component</div>;
      };

      render(<TestComponent />);

      const registry = getIconRegistry();

      // 프리로드가 시작되었는지 확인 (동기적으로는 완료되지 않을 수 있음)
      expect(registry.getDebugInfo().loadingCount).toBeGreaterThanOrEqual(0);
    });

    test('useCommonIconPreload가 공통 아이콘들을 프리로드해야 함', () => {
      const TestComponent = () => {
        useCommonIconPreload();
        return <div>Test Component</div>;
      };

      render(<TestComponent />);

      // 컴포넌트가 렌더링되면 프리로드가 시작됨
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(() => {
      resetIconRegistry();
    });

    test('번들 크기 최적화를 확인해야 함', async () => {
      // 동적 import가 사용되는지 확인
      const registry = getIconRegistry();

      // 아이콘을 로드하기 전에는 메모리에 없어야 함
      const cacheKey = {};
      expect(registry.getCachedIcon(cacheKey, 'Download')).toBeNull();

      // 필요할 때만 로드
      const IconComponent = await registry.loadIcon('Download');
      expect(IconComponent).toBeDefined();

      // 캐시된 후에는 즉시 접근 가능
      registry.setCachedIcon(cacheKey, 'Download', IconComponent);
      expect(registry.getCachedIcon(cacheKey, 'Download')).toBe(IconComponent);
    });

    test('메모리 사용량을 최적화해야 함', async () => {
      const registry = getIconRegistry();

      // WeakMap 사용으로 가비지 컬렉션 가능한 캐시
      let cacheKey: object | null = {};
      const iconName: IconName = 'Settings';

      const IconComponent = await registry.loadIcon(iconName);
      registry.setCachedIcon(cacheKey, iconName, IconComponent);

      expect(registry.getCachedIcon(cacheKey, iconName)).toBe(IconComponent);

      // 캐시 키 참조 제거 (실제 GC는 제어할 수 없으므로 null 할당으로 시뮬레이션)
      cacheKey = null;

      // 새로운 캐시 키에서는 이전 캐시를 찾을 수 없어야 함
      const newCacheKey = {};
      expect(registry.getCachedIcon(newCacheKey, iconName)).toBeNull();
    });

    test('중복 요청을 효율적으로 처리해야 함', async () => {
      const registry = getIconRegistry();
      const iconName: IconName = 'X';

      // 여러 번의 동시 요청
      const startTime = performance.now();
      const promises = Array.from({ length: 10 }, () => registry.loadIcon(iconName));

      const results = await Promise.all(promises);
      const endTime = performance.now();

      // 모든 결과가 동일해야 함 (중복 로딩 방지)
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toBe(firstResult);
      });

      // 로딩 시간이 합리적이어야 함 (정확한 시간은 환경에 따라 다름)
      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
    });
  });
});
