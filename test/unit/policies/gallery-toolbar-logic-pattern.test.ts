/**
 * @fileoverview Toolbar settings controller 구조 정책 테스트 (Phase 254)
 * @description useToolbarSettingsController가 벤더 getter와 시그널 패턴을 준수하는지 검증
 * @history Phase 14.2의 useGalleryToolbarLogic 패턴 검증을 기반으로 최신 훅 구조에 맞게 갱신
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const filePath = join(process.cwd(), 'src/shared/hooks/toolbar/use-toolbar-settings-controller.ts');
const fileContent = readFileSync(filePath, 'utf-8');

describe('Policy: useToolbarSettingsController 구조 검증 (Phase 254)', () => {
  setupGlobalTestIsolation();

  describe('벤더 getter 및 시그널 패턴', () => {
    it('getSolid()를 통해 Solid API를 주입해야 함', () => {
      expect(/const\s+solid\s*=\s*getSolid\(\);/.test(fileContent)).toBe(true);
    });

    it('createSignal/createEffect/onCleanup을 destructuring으로 추출해야 함', () => {
      const hasDestructure =
        /const\s+\{\s*createSignal,\s*createEffect,\s*onCleanup\s*\}\s*=\s*solid;/.test(
          fileContent
        );
      expect(hasDestructure).toBe(true);
    });

    it('Solid 코어에서 직접 import하지 않아야 함 (벤더 getter 제한)', () => {
      expect(/from\s+'solid-js'/.test(fileContent)).toBe(false);
    });

    it('toolbar/settings 참조를 createSignal로 관리해야 함', () => {
      const compact = fileContent.replace(/\s+/g, ' ');
      expect(/\[toolbarRef,\s*setToolbarRef\]\s*=\s*createSignal/.test(compact)).toBe(true);
      expect(/\[settingsPanelRef,\s*setSettingsPanelRef\]\s*=\s*createSignal/.test(compact)).toBe(
        true
      );
      expect(/\[settingsButtonRef,\s*setSettingsButtonRef\]\s*=\s*createSignal/.test(compact)).toBe(
        true
      );
    });
  });

  describe('고대비 감지 및 스크롤 감시', () => {
    it('DEFAULT_HIGH_CONTRAST_OFFSETS가 0.25/0.5/0.75를 포함해야 함', () => {
      expect(
        /const\s+DEFAULT_HIGH_CONTRAST_OFFSETS\s*=\s*\[0\.25,\s*0\.5,\s*0\.75\]\s*as\s*const;/.test(
          fileContent
        )
      ).toBe(true);
    });

    it('evaluateHighContrast 유틸을 사용해야 함', () => {
      expect(/evaluateHighContrast\(/.test(fileContent)).toBe(true);
    });

    it('eventManager.addListener로 scroll 감시를 등록해야 함', () => {
      expect(/eventManager\.addListener\(\s*windowRef,\s*'scroll'/.test(fileContent)).toBe(true);
    });
  });

  describe('설정 패널 토글 및 외부 클릭 처리', () => {
    it('toggleSettingsExpanded() 호출로 패널 확장 상태를 토글해야 함', () => {
      expect(/toggleSettingsExpanded\(\);/.test(fileContent)).toBe(true);
    });

    it('documentRef.addEventListener("mousedown", handleOutsideClick) 패턴을 유지해야 함', () => {
      expect(
        /documentRef\.addEventListener\('mousedown',\s*handleOutsideClick/.test(fileContent)
      ).toBe(true);
    });

    it('outside click 처리에서 setSettingsExpanded(false)를 호출해야 함', () => {
      expect(/setSettingsExpanded\(false\);/.test(fileContent)).toBe(true);
    });
  });

  describe('반환 객체 구조', () => {
    it('handleSettingsClick과 handlePanelMouseDown 핸들러를 반환해야 함', () => {
      expect(fileContent.includes('handleSettingsClick,')).toBe(true);
      expect(fileContent.includes('handlePanelMouseDown,')).toBe(true);
    });

    it('assignToolbarRef와 assignSettingsPanelRef가 반환 객체에 포함되어야 함', () => {
      expect(fileContent.includes('assignToolbarRef:')).toBe(true);
      expect(fileContent.includes('assignSettingsPanelRef:')).toBe(true);
    });
  });
});
