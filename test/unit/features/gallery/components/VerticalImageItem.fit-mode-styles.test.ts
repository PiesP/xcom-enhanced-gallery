/**
 * @fileoverview VerticalImageItem fit mode CSS 속성 검증 테스트
 *
 * Purpose: 각 fit mode의 CSS 속성이 의도대로 설정되었는지 검증
 * - fitOriginal: 원본 크기 (축소/확대 없음)
 * - fitWidth: 폭에 맞추기 (작으면 원본, 크면 축소)
 * - fitHeight: 높이에 맞추기 (작으면 원본, 크면 축소)
 * - fitContainer: 컨테이너에 맞추기 (비율 유지하며 축소/확대)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cssFilePath = resolve(
  __dirname,
  '../../../../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
);

const cssContent = readFileSync(cssFilePath, 'utf-8');

/**
 * CSS 규칙에서 특정 속성 값을 추출하는 헬퍼 함수
 */
function extractPropertyValue(cssText: string, selector: string, property: string): string | null {
  // 선택자 찾기 (코멘트 제외)
  const selectorRegex = new RegExp(`\\.${selector.replace('.', '\\.')}\\s*{([^}]*)}`, 'g');
  const matches = [...cssText.matchAll(selectorRegex)];

  for (const match of matches) {
    const ruleBlock = match[1];
    // 속성 찾기
    const propertyRegex = new RegExp(`${property}\\s*:\\s*([^;]+);`, 'i');
    const propertyMatch = ruleBlock.match(propertyRegex);
    if (propertyMatch) {
      return propertyMatch[1].trim();
    }
  }

  return null;
}

describe('VerticalImageItem.module.css – fit mode styles', () => {
  describe('Image fit modes', () => {
    describe('fitOriginal (원본 크기)', () => {
      it('should have object-fit: none', () => {
        const objectFit = extractPropertyValue(cssContent, 'image.fitOriginal', 'object-fit');
        expect(objectFit).toBe('none');
      });

      it('should have max-inline-size: none', () => {
        const maxInlineSize = extractPropertyValue(
          cssContent,
          'image.fitOriginal',
          'max-inline-size'
        );
        expect(maxInlineSize).toBe('none');
      });

      it('should have max-block-size: none', () => {
        const maxBlockSize = extractPropertyValue(
          cssContent,
          'image.fitOriginal',
          'max-block-size'
        );
        expect(maxBlockSize).toBe('none');
      });

      it('should have inline-size: auto', () => {
        const inlineSize = extractPropertyValue(cssContent, 'image.fitOriginal', 'inline-size');
        expect(inlineSize).toBe('auto');
      });

      it('should have block-size: auto', () => {
        const blockSize = extractPropertyValue(cssContent, 'image.fitOriginal', 'block-size');
        expect(blockSize).toBe('auto');
      });
    });

    describe('fitWidth (폭에 맞추기 with scale-down)', () => {
      it('should have object-fit: scale-down', () => {
        const objectFit = extractPropertyValue(cssContent, 'image.fitWidth', 'object-fit');
        expect(objectFit).toBe('scale-down');
      });

      it('should have max-inline-size: 100%', () => {
        const maxInlineSize = extractPropertyValue(cssContent, 'image.fitWidth', 'max-inline-size');
        expect(maxInlineSize).toBe('100%');
      });

      it('should have max-block-size: none', () => {
        const maxBlockSize = extractPropertyValue(cssContent, 'image.fitWidth', 'max-block-size');
        expect(maxBlockSize).toBe('none');
      });

      it('should have inline-size: auto', () => {
        const inlineSize = extractPropertyValue(cssContent, 'image.fitWidth', 'inline-size');
        expect(inlineSize).toBe('auto');
      });

      it('should have block-size: auto', () => {
        const blockSize = extractPropertyValue(cssContent, 'image.fitWidth', 'block-size');
        expect(blockSize).toBe('auto');
      });
    });

    describe('fitHeight (높이에 맞추기 with scale-down)', () => {
      it('should have object-fit: scale-down', () => {
        const objectFit = extractPropertyValue(cssContent, 'image.fitHeight', 'object-fit');
        expect(objectFit).toBe('scale-down');
      });

      it('should have max-inline-size: none', () => {
        const maxInlineSize = extractPropertyValue(
          cssContent,
          'image.fitHeight',
          'max-inline-size'
        );
        expect(maxInlineSize).toBe('none');
      });

      it('should have max-block-size with viewport constraint', () => {
        const maxBlockSize = extractPropertyValue(cssContent, 'image.fitHeight', 'max-block-size');
        expect(maxBlockSize).toContain('var(--xeg-viewport-height-constrained');
      });

      it('should have inline-size: auto', () => {
        const inlineSize = extractPropertyValue(cssContent, 'image.fitHeight', 'inline-size');
        expect(inlineSize).toBe('auto');
      });

      it('should have block-size: auto', () => {
        const blockSize = extractPropertyValue(cssContent, 'image.fitHeight', 'block-size');
        expect(blockSize).toBe('auto');
      });
    });

    describe('fitContainer (컨테이너에 맞추기)', () => {
      it('should have object-fit: contain', () => {
        const objectFit = extractPropertyValue(cssContent, 'image.fitContainer', 'object-fit');
        expect(objectFit).toBe('contain');
      });

      it('should have max-inline-size: 100%', () => {
        const maxInlineSize = extractPropertyValue(
          cssContent,
          'image.fitContainer',
          'max-inline-size'
        );
        expect(maxInlineSize).toBe('100%');
      });

      it('should have max-block-size with viewport constraint', () => {
        const maxBlockSize = extractPropertyValue(
          cssContent,
          'image.fitContainer',
          'max-block-size'
        );
        expect(maxBlockSize).toContain('var(--xeg-viewport-height-constrained');
      });

      it('should have inline-size: auto', () => {
        const inlineSize = extractPropertyValue(cssContent, 'image.fitContainer', 'inline-size');
        expect(inlineSize).toBe('auto');
      });

      it('should have block-size: auto', () => {
        const blockSize = extractPropertyValue(cssContent, 'image.fitContainer', 'block-size');
        expect(blockSize).toBe('auto');
      });
    });
  });

  describe('Video fit modes', () => {
    describe('fitOriginal (원본 크기)', () => {
      it('should have object-fit: none', () => {
        const objectFit = extractPropertyValue(cssContent, 'video.fitOriginal', 'object-fit');
        expect(objectFit).toBe('none');
      });

      it('should have max-inline-size: none', () => {
        const maxInlineSize = extractPropertyValue(
          cssContent,
          'video.fitOriginal',
          'max-inline-size'
        );
        expect(maxInlineSize).toBe('none');
      });

      it('should have max-block-size: none', () => {
        const maxBlockSize = extractPropertyValue(
          cssContent,
          'video.fitOriginal',
          'max-block-size'
        );
        expect(maxBlockSize).toBe('none');
      });
    });

    describe('fitWidth (폭에 맞추기 with scale-down)', () => {
      it('should have object-fit: scale-down', () => {
        const objectFit = extractPropertyValue(cssContent, 'video.fitWidth', 'object-fit');
        expect(objectFit).toBe('scale-down');
      });

      it('should have max-inline-size: 100%', () => {
        const maxInlineSize = extractPropertyValue(cssContent, 'video.fitWidth', 'max-inline-size');
        expect(maxInlineSize).toBe('100%');
      });

      it('should have max-block-size: none', () => {
        const maxBlockSize = extractPropertyValue(cssContent, 'video.fitWidth', 'max-block-size');
        expect(maxBlockSize).toBe('none');
      });
    });

    describe('fitHeight (높이에 맞추기 with scale-down)', () => {
      it('should have object-fit: scale-down', () => {
        const objectFit = extractPropertyValue(cssContent, 'video.fitHeight', 'object-fit');
        expect(objectFit).toBe('scale-down');
      });

      it('should have max-inline-size: none', () => {
        const maxInlineSize = extractPropertyValue(
          cssContent,
          'video.fitHeight',
          'max-inline-size'
        );
        expect(maxInlineSize).toBe('none');
      });

      it('should have max-block-size with viewport constraint', () => {
        const maxBlockSize = extractPropertyValue(cssContent, 'video.fitHeight', 'max-block-size');
        expect(maxBlockSize).toContain('var(--xeg-viewport-height-constrained');
      });
    });

    describe('fitContainer (컨테이너에 맞추기)', () => {
      it('should have object-fit: contain', () => {
        const objectFit = extractPropertyValue(cssContent, 'video.fitContainer', 'object-fit');
        expect(objectFit).toBe('contain');
      });

      it('should have max-inline-size: 100%', () => {
        const maxInlineSize = extractPropertyValue(
          cssContent,
          'video.fitContainer',
          'max-inline-size'
        );
        expect(maxInlineSize).toBe('100%');
      });

      it('should have max-block-size with viewport constraint', () => {
        const maxBlockSize = extractPropertyValue(
          cssContent,
          'video.fitContainer',
          'max-block-size'
        );
        expect(maxBlockSize).toContain('var(--xeg-viewport-height-constrained');
      });
    });
  });

  describe('Consistency checks', () => {
    it('image and video fitOriginal should have identical object-fit', () => {
      const imageObjectFit = extractPropertyValue(cssContent, 'image.fitOriginal', 'object-fit');
      const videoObjectFit = extractPropertyValue(cssContent, 'video.fitOriginal', 'object-fit');
      expect(imageObjectFit).toBe(videoObjectFit);
    });

    it('image and video fitWidth should have identical object-fit', () => {
      const imageObjectFit = extractPropertyValue(cssContent, 'image.fitWidth', 'object-fit');
      const videoObjectFit = extractPropertyValue(cssContent, 'video.fitWidth', 'object-fit');
      expect(imageObjectFit).toBe(videoObjectFit);
    });

    it('image and video fitHeight should have identical object-fit', () => {
      const imageObjectFit = extractPropertyValue(cssContent, 'image.fitHeight', 'object-fit');
      const videoObjectFit = extractPropertyValue(cssContent, 'video.fitHeight', 'object-fit');
      expect(imageObjectFit).toBe(videoObjectFit);
    });

    it('image and video fitContainer should have identical object-fit', () => {
      const imageObjectFit = extractPropertyValue(cssContent, 'image.fitContainer', 'object-fit');
      const videoObjectFit = extractPropertyValue(cssContent, 'video.fitContainer', 'object-fit');
      expect(imageObjectFit).toBe(videoObjectFit);
    });

    it('fitWidth and fitHeight should both use scale-down', () => {
      const fitWidthObjectFit = extractPropertyValue(cssContent, 'image.fitWidth', 'object-fit');
      const fitHeightObjectFit = extractPropertyValue(cssContent, 'image.fitHeight', 'object-fit');
      expect(fitWidthObjectFit).toBe('scale-down');
      expect(fitHeightObjectFit).toBe('scale-down');
    });

    it('fitOriginal should use none, fitContainer should use contain', () => {
      const fitOriginalObjectFit = extractPropertyValue(
        cssContent,
        'image.fitOriginal',
        'object-fit'
      );
      const fitContainerObjectFit = extractPropertyValue(
        cssContent,
        'image.fitContainer',
        'object-fit'
      );
      expect(fitOriginalObjectFit).toBe('none');
      expect(fitContainerObjectFit).toBe('contain');
    });
  });
});
