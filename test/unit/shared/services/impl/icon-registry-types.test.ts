/**
 * Phase 98.1: Icon Registry 타입 안전성 테스트
 *
 * 목표: IconComponent 타입이 JSXElement를 반환하도록 개선하여
 * 불필요한 'as unknown as' 타입 단언 제거
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { JSXElement } from '../../../../../../src/shared/external/vendors';

describe('Phase 98: IconComponent 타입 안전성', () => {
  describe('IconComponent 타입 정의', () => {
    it('IconComponent는 JSXElement를 반환하는 함수여야 한다', () => {
      // Type-level test: IconComponent should accept JSXElement return type
      type IconComponent = (props?: Record<string, unknown>) => JSXElement;

      // This should compile without type assertion
      const validIcon: IconComponent = () =>
        ({
          type: 'div',
          props: {},
        }) as JSXElement;

      expect(typeof validIcon).toBe('function');
    });

    it('실제 Icon 컴포넌트는 IconComponent 타입과 호환되어야 한다', async () => {
      // Dynamic import test
      const { HeroDownload } = await import(
        '../../../src/shared/components/ui/Icon/hero/HeroDownload'
      );

      // Type assertion should not be needed
      type IconComponent = (props?: Record<string, unknown>) => JSXElement;
      const iconComponent: IconComponent = HeroDownload;

      expect(typeof iconComponent).toBe('function');
      expect(iconComponent.name).toBe('HeroDownload');
    });
  });

  describe('dynamicImport 타입 안전성', () => {
    it('icon import는 타입 단언 없이 IconComponent로 할당 가능해야 한다', async () => {
      // Test 'Download' icon
      const downloadModule = await import(
        '../../../src/shared/components/ui/Icon/hero/HeroDownload'
      );

      // This should compile without 'as unknown as IconComponent'
      type IconComponent = (props?: Record<string, unknown>) => JSXElement;
      const downloadIcon: IconComponent = downloadModule.HeroDownload;

      expect(typeof downloadIcon).toBe('function');
    });

    it('icon import는 Promise<IconComponent>로 체이닝 가능해야 한다', async () => {
      type IconComponent = (props?: Record<string, unknown>) => JSXElement;

      // Simulate dynamicImport pattern
      const loadIcon = (): Promise<IconComponent> =>
        import('../../../src/shared/components/ui/Icon/hero/HeroSettings').then(
          m => m.HeroSettings // ❌ RED: 현재 코드에서는 'as unknown as' 필요
        );

      const icon = await loadIcon();
      expect(typeof icon).toBe('function');
    });
  });

  describe('Icon Registry 통합 테스트', () => {
    let getIconRegistry: () => {
      loadIcon: (name: string) => Promise<unknown>;
    };

    beforeEach(async () => {
      const { getIconRegistry: importedGetter } = await import(
        '../../../src/shared/services/icon-registry'
      );
      getIconRegistry = importedGetter;
    });

    it('loadIcon은 타입 단언 없이 JSXElement 반환 함수를 로드해야 한다', async () => {
      const registry = getIconRegistry();
      const icon = await registry.loadIcon('Download');

      expect(typeof icon).toBe('function');
    });

    it('모든 기본 icon은 타입 체크를 통과해야 한다', async () => {
      const registry = getIconRegistry();
      const iconNames = ['Download', 'Settings', 'X', 'ChevronLeft', 'ChevronRight'];

      for (const name of iconNames) {
        const icon = await registry.loadIcon(name);
        expect(typeof icon).toBe('function');
      }
    });
  });

  describe('타입 단언 제거 검증', () => {
    it('icon-registry.ts는 "as unknown as IconComponent" 패턴을 사용하지 않아야 한다', async () => {
      // Source code inspection test
      const fs = await import('node:fs');
      const path = await import('node:path');

      const iconRegistryPath = path.resolve(process.cwd(), 'src/shared/services/icon-registry.ts');
      const source = fs.readFileSync(iconRegistryPath, 'utf-8');

      // ❌ RED: 현재는 5개의 'as unknown as IconComponent' 존재
      const assertionCount = (source.match(/as unknown as IconComponent/g) || []).length;

      expect(assertionCount).toBe(0);
    });
  });
});
