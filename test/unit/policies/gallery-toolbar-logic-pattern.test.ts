/**
 * @fileoverview Props 접근 패턴 검증 테스트 (Phase 14.2 - TDD RED) - 이동됨
 * @description useGalleryToolbarLogic에서 props를 getter 함수로 일관되게 접근하는지 검증
 * @location 원본: test/unit/hooks/use-gallery-toolbar-logic-props.test.ts
 * @movedFrom Phase 14.2 정책 검증을 위해 test/unit/policies로 통합
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const filePath = join(process.cwd(), 'src/shared/hooks/use-gallery-toolbar-logic.ts');
const fileContent = readFileSync(filePath, 'utf-8');

describe('Policy: useGalleryToolbarLogic Props 접근 패턴 (Phase 14.2)', () => {
  describe('canGoPrevious/canGoNext - Getter 함수 패턴', () => {
    it('canGoPrevious는 getter 함수여야 함 (const canGoPrevious = () => ...)', () => {
      // Phase 62: 순환 네비게이션 - totalCount > 1 패턴
      const hasGetterPattern =
        /const\s+canGoPrevious\s*=\s*\(\)\s*=>\s*props\.totalCount\s*>\s*1/.test(fileContent);

      expect(hasGetterPattern).toBe(true);
    });

    it('canGoNext는 getter 함수여야 함 (const canGoNext = () => ...)', () => {
      // Phase 62: 순환 네비게이션 - totalCount > 1 패턴
      const hasGetterPattern = /const\s+canGoNext\s*=\s*\(\)\s*=>\s*props\.totalCount\s*>\s*1/.test(
        fileContent
      );

      expect(hasGetterPattern).toBe(true);
    });

    it('canGoPrevious는 직접 값 할당을 사용하지 않아야 함', () => {
      // Anti-pattern: const canGoPrevious = props.totalCount > 1;
      const hasDirectAssignment = /const\s+canGoPrevious\s*=\s*props\.totalCount\s*>\s*1;/.test(
        fileContent
      );

      expect(hasDirectAssignment).toBe(false);
    });

    it('canGoNext는 직접 값 할당을 사용하지 않아야 함', () => {
      // Anti-pattern: const canGoNext = props.totalCount > 1;
      const hasDirectAssignment = /const\s+canGoNext\s*=\s*props\.totalCount\s*>\s*1;/.test(
        fileContent
      );

      expect(hasDirectAssignment).toBe(false);
    });
  });

  describe('mediaCounter - createMemo 패턴 (Phase 64 Step 4)', () => {
    it('mediaCounter는 createMemo로 래핑되어야 함 (const mediaCounter = createMemo(() => ({ ... })))', () => {
      // Phase 64: focusedIndex 반응성 추적을 위해 createMemo 사용
      const hasCreateMemoPattern = /const\s+mediaCounter\s*=\s*createMemo\(\(\)\s*=>\s*\({/.test(
        fileContent
      );

      expect(hasCreateMemoPattern).toBe(true);
    });

    it('mediaCounter는 직접 객체 할당을 사용하지 않아야 함', () => {
      // Anti-pattern: const mediaCounter = { current: props.currentIndex + 1, ... };
      const hasDirectObjectAssignment =
        /const\s+mediaCounter\s*=\s*{[^}]*current:\s*props\.currentIndex\s*\+\s*1/.test(
          fileContent
        );

      expect(hasDirectObjectAssignment).toBe(false);
    });
  });

  describe('ToolbarState 타입 - Getter 함수 시그니처', () => {
    it('ToolbarState.canGoPrevious는 () => boolean 타입이어야 함', () => {
      const hasGetterType = /canGoPrevious:\s*\(\)\s*=>\s*boolean/.test(fileContent);

      expect(hasGetterType).toBe(true);
    });

    it('ToolbarState.canGoNext는 () => boolean 타입이어야 함', () => {
      const hasGetterType = /canGoNext:\s*\(\)\s*=>\s*boolean/.test(fileContent);

      expect(hasGetterType).toBe(true);
    });

    it('ToolbarState.mediaCounter는 Accessor<MediaCounter> 타입이어야 함 (Phase 64)', () => {
      // Phase 64: createMemo는 Accessor<T>를 반환하므로 타입도 변경됨
      const hasAccessorType = /mediaCounter:\s*Accessor<MediaCounter>/.test(fileContent);

      expect(hasAccessorType).toBe(true);
    });
  });

  describe('getActionProps 내부 - Getter 함수 호출', () => {
    it('getActionProps에서 canGoPrevious()를 함수로 호출해야 함', () => {
      // props.disabled || !canGoPrevious() 패턴
      const hasGetterCall = /disabled:\s*props\.disabled\s*\|\|\s*!canGoPrevious\(\)/.test(
        fileContent
      );

      expect(hasGetterCall).toBe(true);
    });

    it('getActionProps에서 canGoNext()를 함수로 호출해야 함', () => {
      // props.disabled || !canGoNext() 패턴
      const hasGetterCall = /disabled:\s*props\.disabled\s*\|\|\s*!canGoNext\(\)/.test(fileContent);

      expect(hasGetterCall).toBe(true);
    });
  });

  describe('state 객체 - Getter 함수 할당', () => {
    it('state.canGoPrevious에 getter 함수를 할당해야 함', () => {
      // state 객체 내에서 canGoPrevious, (쉼표나 줄바꿈)
      const hasGetterInState = /state:\s*ToolbarState\s*=\s*{[^}]*canGoPrevious,/.test(
        fileContent.replace(/\s+/g, ' ')
      );

      expect(hasGetterInState).toBe(true);
    });

    it('state.canGoNext에 getter 함수를 할당해야 함', () => {
      const hasGetterInState = /state:\s*ToolbarState\s*=\s*{[^}]*canGoNext,/.test(
        fileContent.replace(/\s+/g, ' ')
      );

      expect(hasGetterInState).toBe(true);
    });

    it('state.mediaCounter에 getter 함수를 할당해야 함', () => {
      const hasGetterInState = /state:\s*ToolbarState\s*=\s*{[^}]*mediaCounter,/.test(
        fileContent.replace(/\s+/g, ' ')
      );

      expect(hasGetterInState).toBe(true);
    });
  });
});
