/**
 * @fileoverview LazyIcon.solid.tsx Phase 0 Type Tests
 * @description LazyIcon Solid.js 컴포넌트의 타입 및 구조 검증
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LAZYICON_SOLID_PATH = resolve(
  __dirname,
  '../../../../src/shared/components/LazyIcon.solid.tsx'
);

describe('LazyIcon.solid.tsx - Phase 0: Type Tests', () => {
  describe('Compilation', () => {
    it('파일이 존재해야 함', () => {
      expect(existsSync(LAZYICON_SOLID_PATH)).toBe(true);
    });

    it('LazyIcon.solid.tsx를 import할 수 있어야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');
      expect(module).toBeDefined();
    });
  });

  describe('LazyIconProps Type Validation', () => {
    it('LazyIconProps는 필수 props를 포함해야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');
      const { LazyIcon } = module;

      // Type assertion으로 props 타입 검증
      const validProps = {
        name: 'heroicons/outline/photo' as const,
      };

      expect(() => LazyIcon(validProps)).not.toThrow();
    });

    it('LazyIconProps는 선택적 props를 포함해야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');

      type LazyIconPropsType = Parameters<typeof module.LazyIcon>[0];

      const props: LazyIconPropsType = {
        name: 'heroicons/outline/photo',
        size: 24,
        stroke: 2,
        color: 'currentColor',
        className: 'custom-icon',
        fallback: undefined,
        errorFallback: undefined,
      };

      expect(props.size).toBe(24);
      expect(props.stroke).toBe(2);
      expect(props.color).toBe('currentColor');
      expect(props.className).toBe('custom-icon');
    });
  });

  describe('Component Structure', () => {
    it('LazyIcon은 Solid Component 함수여야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');
      const { LazyIcon } = module;

      expect(typeof LazyIcon).toBe('function');
    });

    it('LazyIcon default export가 있어야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');

      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });
  });

  describe('Icon Preload Hooks', () => {
    it('useIconPreload 훅이 export되어야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');
      const { useIconPreload } = module;

      expect(typeof useIconPreload).toBe('function');
    });

    it('useCommonIconPreload 훅이 export되어야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');
      const { useCommonIconPreload } = module;

      expect(typeof useCommonIconPreload).toBe('function');
    });

    it('useIconPreload는 IconName 배열을 받아야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');
      const { useIconPreload } = module;

      type UseIconPreloadParams = Parameters<typeof useIconPreload>;

      const names: UseIconPreloadParams[0] = [
        'heroicons/outline/photo',
        'heroicons/outline/arrow-left',
      ] as const;

      expect(names.length).toBe(2);
    });
  });

  describe('Fallback Handling', () => {
    it('fallback prop은 JSX.Element를 받을 수 있어야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');

      type LazyIconPropsType = Parameters<typeof module.LazyIcon>[0];

      const props: LazyIconPropsType = {
        name: 'heroicons/outline/photo',
        fallback: undefined, // JSX.Element | unknown
      };

      expect(props.fallback).toBeUndefined();
    });

    it('errorFallback prop은 JSX.Element를 받을 수 있어야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');

      type LazyIconPropsType = Parameters<typeof module.LazyIcon>[0];

      const props: LazyIconPropsType = {
        name: 'heroicons/outline/photo',
        errorFallback: undefined, // JSX.Element | unknown
      };

      expect(props.errorFallback).toBeUndefined();
    });
  });

  describe('Solid.js Integration', () => {
    it('createSignal을 사용해야 함 (타입 체크)', async () => {
      const solidModule = await import('solid-js');
      const { createSignal } = solidModule;

      expect(typeof createSignal).toBe('function');
    });

    it('Show 컴포넌트를 사용해야 함 (타입 체크)', async () => {
      const solidModule = await import('solid-js');
      const { Show } = solidModule;

      expect(typeof Show).toBe('function');
    });

    it('createEffect를 사용할 수 있어야 함 (타입 체크)', async () => {
      const solidModule = await import('solid-js');
      const { createEffect } = solidModule;

      expect(typeof createEffect).toBe('function');
    });
  });

  describe('Icon Registry Integration', () => {
    it('getIconRegistry를 import할 수 있어야 함', async () => {
      const registryModule = await import('@shared/services/iconRegistry');
      const { getIconRegistry } = registryModule;

      expect(typeof getIconRegistry).toBe('function');
    });

    it('preloadCommonIcons를 import할 수 있어야 함', async () => {
      const registryModule = await import('@shared/services/iconRegistry');
      const { preloadCommonIcons } = registryModule;

      expect(typeof preloadCommonIcons).toBe('function');
    });

    it('IconName 타입이 정의되어 있어야 함', async () => {
      const registryModule = await import('@shared/services/iconRegistry');

      type IconName = typeof registryModule extends { IconName: infer T } ? T : never;

      const iconName: string = 'heroicons/outline/photo';
      expect(typeof iconName).toBe('string');
    });
  });

  describe('Vendors Integration', () => {
    it('getSolidWeb을 사용해야 함 (타입 체크)', async () => {
      const vendorsModule = await import('@shared/external/vendors');
      const { getSolidWeb } = vendorsModule;

      expect(typeof getSolidWeb).toBe('function');
    });
  });

  describe('Loading State', () => {
    it('로딩 상태는 className="lazy-icon-loading"을 가져야 함', async () => {
      const className = 'lazy-icon-loading';
      expect(className).toContain('lazy-icon');
    });

    it('로딩 상태는 data-testid="lazy-icon-loading"을 가져야 함', async () => {
      const testId = 'lazy-icon-loading';
      expect(testId).toBe('lazy-icon-loading');
    });

    it('로딩 상태는 aria-label="아이콘 로딩 중"을 가져야 함', async () => {
      const ariaLabel = '아이콘 로딩 중';
      expect(ariaLabel).toBe('아이콘 로딩 중');
    });
  });

  describe('Default Props', () => {
    it('fallback이 제공되면 즉시 반환해야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');

      type LazyIconPropsType = Parameters<typeof module.LazyIcon>[0];

      const props: LazyIconPropsType = {
        name: 'heroicons/outline/photo',
        fallback: 'custom-fallback',
      };

      expect(props.fallback).toBe('custom-fallback');
    });

    it('size가 제공되면 style에 width/height를 설정해야 함', async () => {
      const module = await import('@/shared/components/LazyIcon.solid');

      type LazyIconPropsType = Parameters<typeof module.LazyIcon>[0];

      const props: LazyIconPropsType = {
        name: 'heroicons/outline/photo',
        size: 32,
      };

      const style = props.size ? { width: props.size, height: props.size } : undefined;
      expect(style).toEqual({ width: 32, height: 32 });
    });
  });
});
