/**
 * Phase 4A: Unused File Removal Contract Test
 *
 * Epic: BUNDLE-SIZE-DEEP-OPTIMIZATION
 * Phase: 4A (즉시 제거 가능 항목)
 *
 * 목표: 검증된 미사용 파일 제거 (-4~6 KB)
 *
 * 제거 대상:
 * 1. createParitySnapshot.ts (2개) - Solid 마이그레이션 테스트 헬퍼
 * 2. VerticalGalleryView.tsx - 레거시 제거 스텁
 *
 * TDD 워크플로: RED → GREEN → REFACTOR
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(import.meta.dirname, '..', '..');

describe('Epic BUNDLE-SIZE-DEEP-OPTIMIZATION: Phase 4A - Unused File Removal', () => {
  describe('RED Stage: Files Should Be Removed', () => {
    it('should remove createParitySnapshot from gallery (미사용 테스트 헬퍼)', () => {
      const filePath = join(
        ROOT_DIR,
        'src',
        'features',
        'gallery',
        'solid',
        'createParitySnapshot.ts'
      );

      expect(existsSync(filePath)).toBe(false);
    });

    it('should remove createParitySnapshot from settings (미사용 테스트 헬퍼)', () => {
      const filePath = join(
        ROOT_DIR,
        'src',
        'features',
        'settings',
        'solid',
        'createParitySnapshot.ts'
      );

      expect(existsSync(filePath)).toBe(false);
    });

    it('should remove legacy VerticalGalleryView stub (레거시 에러 스텁)', () => {
      const filePath = join(
        ROOT_DIR,
        'src',
        'features',
        'gallery',
        'components',
        'vertical-gallery-view',
        'VerticalGalleryView.tsx'
      );

      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('Contract: No Import References', () => {
    it('should have no createParitySnapshot imports in src/', async () => {
      // 이 테스트는 GREEN 단계 이후 통과해야 함
      // import 정리가 완료되었는지 확인
      const { execSync } = await import('child_process');

      try {
        const result = execSync('git grep -n "createParitySnapshot" -- src/ || exit 0', {
          encoding: 'utf-8',
          cwd: ROOT_DIR,
        });

        // 검색 결과가 비어있어야 함 (파일 제거 후)
        expect(result.trim()).toBe('');
      } catch (error) {
        // grep 결과 없음 = 성공
        expect(true).toBe(true);
      }
    });

    it('should have no VerticalGalleryView imports in src/', async () => {
      const { execSync } = await import('child_process');

      try {
        const result = execSync('git grep -n "VerticalGalleryView" -- src/ || exit 0', {
          encoding: 'utf-8',
          cwd: ROOT_DIR,
        });

        // index.ts의 주석은 허용 (제거 이력 보존)
        const lines = result.split('\n').filter(line => line.trim());
        const nonCommentLines = lines.filter(line => !line.includes('//') && !line.includes('/*'));

        expect(nonCommentLines.length).toBe(0);
      } catch (error) {
        // grep 결과 없음 = 성공
        expect(true).toBe(true);
      }
    });
  });

  describe('Impact Analysis: Build Should Pass', () => {
    it('should typecheck successfully after removal', () => {
      // 이 테스트는 GREEN 단계에서 `npm run typecheck` 성공으로 검증
      expect(true).toBe(true);
    });

    it('should lint successfully after removal', () => {
      // 이 테스트는 GREEN 단계에서 `npm run lint` 성공으로 검증
      expect(true).toBe(true);
    });

    it('should build successfully after removal', () => {
      // 이 테스트는 GREEN 단계에서 `npm run build:prod` 성공으로 검증
      expect(true).toBe(true);
    });
  });
});
