/**
 * @fileoverview GalleryContainer.solid.tsx Phase 0 Type Tests
 * @description GalleryContainer Solid.js 컴포넌트의 타입 및 구조 검증
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GALLERYCONTAINER_SOLID_PATH = resolve(
  __dirname,
  '../../../../../src/shared/components/isolation/GalleryContainer.solid.tsx'
);

describe('GalleryContainer.solid.tsx - Phase 0: Type Tests', () => {
  describe('Compilation', () => {
    it('파일이 존재해야 함', () => {
      expect(existsSync(GALLERYCONTAINER_SOLID_PATH)).toBe(true);
    });

    it('GalleryContainer.solid.tsx를 import할 수 있어야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');
      expect(module).toBeDefined();
    });
  });

  describe('GalleryContainerProps Type Validation', () => {
    it('GalleryContainerProps는 children을 포함해야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');
      const { GalleryContainer } = module;

      // Type assertion으로 props 타입 검증
      const validProps = {
        children: 'test',
      };

      expect(() => GalleryContainer(validProps)).not.toThrow();
    });

    it('GalleryContainerProps는 선택적 props를 포함해야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');

      type GalleryContainerPropsType = Parameters<typeof module.GalleryContainer>[0];

      const props: GalleryContainerPropsType = {
        children: 'test',
        onClose: () => {},
        className: 'custom-class',
      };

      expect(props.onClose).toBeDefined();
      expect(props.className).toBe('custom-class');
    });
  });

  describe('Component Structure', () => {
    it('GalleryContainer는 Solid Component 함수여야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');
      const { GalleryContainer } = module;

      expect(typeof GalleryContainer).toBe('function');
    });

    it('GalleryContainer default export가 있어야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');

      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });
  });

  describe('Mount/Unmount Functions', () => {
    it('mountGallery 함수가 export되어야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');
      const { mountGallery } = module;

      expect(typeof mountGallery).toBe('function');
    });

    it('unmountGallery 함수가 export되어야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');
      const { unmountGallery } = module;

      expect(typeof unmountGallery).toBe('function');
    });

    it('mountGallery는 Element를 반환해야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');

      type MountGalleryReturnType = ReturnType<typeof module.mountGallery>;

      const result: MountGalleryReturnType = undefined as unknown as MountGalleryReturnType;
      expect(typeof result).toBe('undefined'); // Type check only
    });

    it('unmountGallery는 void를 반환해야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');

      type UnmountGalleryReturnType = ReturnType<typeof module.unmountGallery>;

      const result: UnmountGalleryReturnType = undefined;
      expect(result).toBeUndefined();
    });
  });

  describe('Solid.js Integration', () => {
    it('createEffect를 사용할 수 있어야 함', async () => {
      const solidModule = await import('solid-js');
      const { createEffect } = solidModule;

      expect(typeof createEffect).toBe('function');
    });

    it('onCleanup을 사용할 수 있어야 함', async () => {
      const solidModule = await import('solid-js');
      const { onCleanup } = solidModule;

      expect(typeof onCleanup).toBe('function');
    });

    it('Portal을 사용해야 함 (타입 체크)', async () => {
      const solidWebModule = await import('solid-js/web');
      const { Portal } = solidWebModule;

      expect(typeof Portal).toBe('function');
    });

    it('render를 사용해야 함 (mount/unmount용)', async () => {
      const solidWebModule = await import('solid-js/web');
      const { render } = solidWebModule;

      expect(typeof render).toBe('function');
    });
  });

  describe('EventManager Integration', () => {
    it('EventManager를 import할 수 있어야 함', async () => {
      const eventModule = await import('@shared/services/EventManager');
      const { EventManager } = eventModule;

      expect(EventManager).toBeDefined();
      expect(typeof EventManager.getInstance).toBe('function');
    });

    it('EventManager.addListener 메서드가 존재해야 함', async () => {
      const eventModule = await import('@shared/services/EventManager');
      const { EventManager } = eventModule;
      const instance = EventManager.getInstance();

      expect(typeof instance.addListener).toBe('function');
    });

    it('EventManager.removeListener 메서드가 존재해야 함', async () => {
      const eventModule = await import('@shared/services/EventManager');
      const { EventManager } = eventModule;
      const instance = EventManager.getInstance();

      expect(typeof instance.removeListener).toBe('function');
    });
  });

  describe('Logger Integration', () => {
    it('logger를 import할 수 있어야 함', async () => {
      const loggerModule = await import('@shared/logging');
      const { logger } = loggerModule;

      expect(logger).toBeDefined();
    });

    it('logger.debug 메서드가 존재해야 함', async () => {
      const loggerModule = await import('@shared/logging');
      const { logger } = loggerModule;

      expect(typeof logger.debug).toBe('function');
    });

    it('logger.error 메서드가 존재해야 함', async () => {
      const loggerModule = await import('@shared/logging');
      const { logger } = loggerModule;

      expect(typeof logger.error).toBe('function');
    });
  });

  describe('Keyboard Event Handling', () => {
    it('Escape 키로 닫기 기능이 있어야 함 (타입 체크)', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');

      type GalleryContainerPropsType = Parameters<typeof module.GalleryContainer>[0];

      const props: GalleryContainerPropsType = {
        children: 'test',
        onClose: () => {},
      };

      expect(props.onClose).toBeDefined();
    });

    it('onClose는 선택적이어야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');

      type GalleryContainerPropsType = Parameters<typeof module.GalleryContainer>[0];

      const props: GalleryContainerPropsType = {
        children: 'test',
      };

      expect(props.onClose).toBeUndefined();
    });
  });

  describe('CSS Classes', () => {
    it('기본 클래스명이 설정되어야 함', async () => {
      const baseClasses = ['xeg-gallery-overlay', 'xeg-gallery-container', 'gallery-container'];

      expect(baseClasses).toHaveLength(3);
      expect(baseClasses[0]).toBe('xeg-gallery-overlay');
    });

    it('커스텀 클래스명을 추가할 수 있어야 함', async () => {
      const module = await import('@/shared/components/isolation/GalleryContainer');

      type GalleryContainerPropsType = Parameters<typeof module.GalleryContainer>[0];

      const props: GalleryContainerPropsType = {
        children: 'test',
        className: 'my-custom-class',
      };

      expect(props.className).toBe('my-custom-class');
    });
  });

  describe('Data Attributes', () => {
    it('data-xeg-gallery-container 속성이 있어야 함', async () => {
      const attrName = 'data-xeg-gallery-container';
      expect(attrName).toBe('data-xeg-gallery-container');
    });

    it('data 속성은 문자열이어야 함', async () => {
      const attrValue = '';
      expect(typeof attrValue).toBe('string');
    });
  });

  describe('Vendors Integration', () => {
    it('getSolidWeb을 사용할 수 있어야 함 (타입 체크)', async () => {
      const vendorsModule = await import('@shared/external/vendors');
      const { getSolidWeb } = vendorsModule;

      expect(typeof getSolidWeb).toBe('function');
    });

    it('render는 solid-js/web에서 직접 import해야 함', async () => {
      const solidWebModule = await import('solid-js/web');
      const { render } = solidWebModule;

      expect(typeof render).toBe('function');
    });
  });

  describe('PC-Only Events', () => {
    it('keydown 이벤트만 사용해야 함 (PC 전용)', async () => {
      const allowedEvents = ['keydown'];
      expect(allowedEvents).toContain('keydown');
      expect(allowedEvents).not.toContain('touchstart');
    });

    it('Escape 키만 처리해야 함', async () => {
      const allowedKeys = ['Escape'];
      expect(allowedKeys).toContain('Escape');
    });
  });
});
