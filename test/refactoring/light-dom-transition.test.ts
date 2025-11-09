/**
 * @fileoverview Shadow DOM → Light DOM 전환 검증 테스트
 * @description TDD 리팩토링 계획에 따른 Light DOM 전환 검증
 *
 * Phase 1: 이 테스트는 현재 RED 상태를 목표로 합니다.
 * - Shadow DOM 제거 테스트: 현재 FAIL → Phase 3-4 후 PASS
 * - Light DOM 스타일 격리 테스트: 현재 FAIL → Phase 2 후 PASS
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import fs from 'node:fs';
import path from 'node:path';
import { readAllDesignTokens } from '../shared/design-token-helpers';

describe('Shadow DOM → Light DOM 전환 검증', () => {
  setupGlobalTestIsolation();

  describe('Shadow DOM 제거 검증 (Phase 3-4 후 PASS 목표)', () => {
    it('GalleryRenderer에서 Shadow DOM을 사용하지 않아야 함', () => {
      const rendererPath = path.join(process.cwd(), 'src/features/gallery/GalleryRenderer.ts');
      const source = fs.readFileSync(rendererPath, 'utf8');

      // Shadow DOM 사용 금지
      expect(source).not.toContain('useShadowDOM: true');

      // shadowRoot 참조 금지 (주석 제외)
      const codeLines = source.split('\n').filter(line => !line.trim().startsWith('//'));
      const codeWithoutComments = codeLines.join('\n');
      expect(codeWithoutComments).not.toContain('shadowRoot');
    });

    it('GalleryContainer에서 Shadow DOM 로직이 없어야 함', () => {
      const containerPath = path.join(
        process.cwd(),
        'src/shared/components/isolation/GalleryContainer.tsx'
      );
      const source = fs.readFileSync(containerPath, 'utf8');

      // Shadow DOM API 사용 금지
      expect(source).not.toContain('attachShadow');
      expect(source).not.toContain('shadowRoot');

      // useShadowDOM prop 존재하지 않아야 함
      expect(source).not.toMatch(/useShadowDOM\s*[?:]/);
    });

    it('GalleryContainer 타입에서 useShadowDOM prop이 없어야 함', () => {
      const containerPath = path.join(
        process.cwd(),
        'src/shared/components/isolation/GalleryContainer.tsx'
      );
      const source = fs.readFileSync(containerPath, 'utf8');

      // GalleryContainerProps에 useShadowDOM 없어야 함
      const propsMatch = source.match(/export interface GalleryContainerProps\s*{([^}]+)}/s);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        expect(propsContent).not.toContain('useShadowDOM');
      }
    });
  });

  describe('Light DOM 스타일 격리 검증 (Phase 2 후 PASS 목표)', () => {
    it('Cascade Layers에 gallery 레이어가 정의되어야 함', () => {
      const layersPath = path.join(process.cwd(), 'src/shared/styles/cascade-layers.css');
      const source = fs.readFileSync(layersPath, 'utf8');

      // gallery 레이어가 @layer 선언에 포함되어야 함
      const layerDeclaration = source.match(/@layer\s+([^;]+);/);
      expect(layerDeclaration).toBeTruthy();

      if (layerDeclaration) {
        const layers = layerDeclaration[1].split(',').map(l => l.trim());
        expect(layers).toContain('gallery');
      }
    });

    it('Cascade Layers 순서가 올바르게 정의되어야 함', () => {
      const layersPath = path.join(process.cwd(), 'src/shared/styles/cascade-layers.css');
      const source = fs.readFileSync(layersPath, 'utf8');

      // 예상 순서: reset, tokens, base, layout, components, gallery, utilities, overrides
      const layerDeclaration = source.match(/@layer\s+([^;]+);/);
      expect(layerDeclaration).toBeTruthy();

      if (layerDeclaration) {
        const layers = layerDeclaration[1].split(',').map(l => l.trim());

        // gallery는 components 이후, utilities 이전에 와야 함
        const componentsIndex = layers.indexOf('components');
        const galleryIndex = layers.indexOf('gallery');
        const utilitiesIndex = layers.indexOf('utilities');

        expect(componentsIndex).toBeGreaterThanOrEqual(0);
        expect(galleryIndex).toBeGreaterThan(componentsIndex);
        expect(utilitiesIndex).toBeGreaterThan(galleryIndex);
      }
    });

    it('gallery 레이어 정의가 존재해야 함', () => {
      const layersPath = path.join(process.cwd(), 'src/shared/styles/cascade-layers.css');
      const source = fs.readFileSync(layersPath, 'utf8');

      // @layer gallery { } 블록이 존재해야 함
      expect(source).toMatch(/@layer\s+gallery\s*{/);
    });

    it('갤러리 전역 스타일이 xeg- 프리픽스를 사용해야 함', () => {
      const globalStylePath = path.join(
        process.cwd(),
        'src/features/gallery/styles/gallery-global.css'
      );

      if (fs.existsSync(globalStylePath)) {
        const source = fs.readFileSync(globalStylePath, 'utf8');

        // xeg- 프리픽스 클래스가 존재하는지 확인
        const xegClasses = source.match(/\.xeg-[\w-]+/g);
        expect(xegClasses).toBeTruthy();
        expect(xegClasses!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('스타일 격리 메커니즘 검증', () => {
    it('CSS Modules가 활성화되어 있어야 함', () => {
      const vitePath = path.join(process.cwd(), 'vite.config.ts');
      const source = fs.readFileSync(vitePath, 'utf8');

      // CSS Modules 설정 확인 (기본적으로 활성화되어 있음)
      // *.module.css 파일이 존재하는지 확인
      const moduleCssFiles = fs
        .readdirSync(path.join(process.cwd(), 'src'), { recursive: true })
        .filter((file: unknown) => String(file).endsWith('.module.css'));

      expect(moduleCssFiles.length).toBeGreaterThan(0);
    });

    it('디자인 토큰이 CSS 변수로 정의되어 있어야 함', () => {
      const source = readAllDesignTokens();

      // --xeg- 프리픽스 CSS 변수가 존재해야 함
      const xegVars = source.match(/--xeg-[\w-]+/g);
      expect(xegVars).toBeTruthy();
      expect(xegVars!.length).toBeGreaterThan(0);
    });
  });

  describe('코드 품질 검증', () => {
    it('갤러리 관련 파일에서 deprecated Shadow DOM API 참조가 없어야 함', () => {
      const galleryDir = path.join(process.cwd(), 'src/features/gallery');

      // 재귀적으로 모든 .ts, .tsx 파일 찾기
      const findFiles = (dir: string, ext: string[]): string[] => {
        const files: string[] = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            files.push(...findFiles(fullPath, ext));
          } else if (ext.some(e => item.name.endsWith(e))) {
            files.push(fullPath);
          }
        }

        return files;
      };

      const galleryFiles = findFiles(galleryDir, ['.ts', '.tsx']);

      for (const file of galleryFiles) {
        const source = fs.readFileSync(file, 'utf8');

        // 주석 제외
        const codeLines = source.split('\n').filter(line => !line.trim().startsWith('//'));
        const codeWithoutComments = codeLines.join('\n');

        // Shadow DOM API 사용 금지
        expect(codeWithoutComments, `${file} should not use attachShadow`).not.toContain(
          'attachShadow'
        );
        expect(codeWithoutComments, `${file} should not use shadowRoot`).not.toContain(
          'shadowRoot'
        );
      }
    });
  });
});
