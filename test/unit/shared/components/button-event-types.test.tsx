/**
 * @fileoverview Phase 102.1 - Button/Toolbar 이벤트 타입 단언 제거 테스트
 * @description 파일 스캔 기반 타입 단언 검증
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('Phase 102: 이벤트 핸들러 타입 단언 제거 (파일 스캔)', () => {
  describe('Button.tsx 타입 단언 검증', () => {
    it('Button.tsx는 "as unknown as MouseEvent" 타입 단언을 사용하지 않아야 함', async () => {
      const buttonPath = join(process.cwd(), 'src/shared/components/ui/Button/Button.tsx');
      const content = await readFile(buttonPath, 'utf-8');

      // 타입 단언 패턴 검사
      expect(content).not.toMatch(/event as unknown as MouseEvent/);
      expect(content).not.toMatch(/\(event\) as MouseEvent/);
    });

    it('Button.tsx onClick 타입은 MouseEvent를 허용해야 함', async () => {
      const buttonPath = join(process.cwd(), 'src/shared/components/ui/Button/Button.tsx');
      const content = await readFile(buttonPath, 'utf-8');

      // ButtonProps 인터페이스에서 onClick 타입 확인
      expect(content).toMatch(/readonly onClick\?:\s*\(event:\s*MouseEvent\)\s*=>\s*void/);
      expect(content).toMatch(/readonly onKeyDown\?:\s*\(event:\s*KeyboardEvent\)\s*=>\s*void/);
    });
  });

  describe('Toolbar.tsx 타입 단언 검증', () => {
    it('Toolbar.tsx는 "as unknown as Event" 타입 단언을 사용하지 않아야 함', async () => {
      const toolbarPath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
      const content = await readFile(toolbarPath, 'utf-8');

      // 타입 단언 패턴 검사
      expect(content).not.toMatch(/event as unknown as Event/);
      expect(content).not.toMatch(/\(event\) as Event[^a-zA-Z]/); // Event 뒤에 글자가 없는 경우만
    });

    it('Toolbar.tsx에서 getFitHandler는 MouseEvent를 그대로 전달해야 함', async () => {
      const toolbarPath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
      const content = await readFile(toolbarPath, 'utf-8');

      // MouseEvent를 Event로 변환하는 타입 단언이 없어야 함
      const fitHandlerSection = content.match(/const handleFitModeClick[\s\S]*?}\);/);
      expect(fitHandlerSection).toBeTruthy();

      if (fitHandlerSection) {
        expect(fitHandlerSection[0]).not.toMatch(/event as unknown as Event/);
      }
    });
  });

  describe('Toolbar.types.ts 타입 정의 검증', () => {
    it('ToolbarProps의 onFit* 핸들러는 Event를 받도록 정의되어 있어야 함', async () => {
      const typesPath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.types.ts');
      const content = await readFile(typesPath, 'utf-8');

      // onFit* 타입 정의 확인
      expect(content).toMatch(/onFitOriginal\?:\s*\(event\?:\s*Event\)\s*=>\s*void/);
      expect(content).toMatch(/onFitWidth\?:\s*\(event\?:\s*Event\)\s*=>\s*void/);
      expect(content).toMatch(/onFitHeight\?:\s*\(event\?:\s*Event\)\s*=>\s*void/);
      expect(content).toMatch(/onFitContainer\?:\s*\(event\?:\s*Event\)\s*=>\s*void/);
    });
  });
});
