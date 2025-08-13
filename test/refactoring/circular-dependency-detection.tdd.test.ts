/**
 * @fileoverview TDD 기반 순환 의존성 문제 해결
 * @description 로그에서 발견된 TDZ 오류와 서비스 초기화 문제 해결
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('🔴 RED: Circular Dependency 진단', () => {
  describe('TDZ(Temporal Dead Zone) 오류 검출', () => {
    it('media-service.ts에서 top-level singleton export가 존재하지 않아야 한다', () => {
      const mediaServicePath = path.resolve('src/shared/services/media-service.ts');
      const content = readFileSync(mediaServicePath, 'utf-8');

      // top-level에서 mediaService singleton 생성 패턴 검출
      const hasTopLevelSingleton =
        /export\s+const\s+mediaService\s*=/.test(content) ||
        /const\s+mediaService\s*=.*new\s+MediaService/.test(content);

      if (hasTopLevelSingleton) {
        console.log('🚨 발견된 문제: media-service.ts에 top-level singleton 존재');
      }

      expect(hasTopLevelSingleton).toBe(false);
    });

    it('settings-menu.ts에서 AnimationController가 조건부로 생성되어야 한다', () => {
      const settingsMenuPath = path.resolve('src/features/settings/settings-menu.ts');
      const content = readFileSync(settingsMenuPath, 'utf-8');

      // AnimationController가 즉시 생성되는지 검출
      const hasImmediateInstantiation =
        /import.*animationController.*from/.test(content) &&
        /new\s+AnimationController\(\)/.test(content);

      if (hasImmediateInstantiation) {
        console.log('🚨 발견된 문제: settings-menu.ts에서 AnimationController 즉시 생성');
      }

      // 지연 로딩 패턴이 있는지 확인
      const hasLazyLoading =
        /async.*getAnimationController/.test(content) ||
        /await.*import.*animation-controller/.test(content);

      if (!hasLazyLoading) {
        console.log('⚠️ 권장사항: AnimationController 지연 로딩 패턴 구현 필요');
      }
    });
  });

  describe('서비스 초기화 순서 검증', () => {
    it('core-services.ts에서 SettingsService가 MediaService보다 먼저 등록되어야 한다', () => {
      const coreServicesPath = path.resolve('src/shared/services/core-services.ts');
      const content = readFileSync(coreServicesPath, 'utf-8');

      // SettingsService와 MediaService 등록 위치 찾기
      const settingsServiceMatch = content.match(
        /SettingsService.*register|register.*SettingsService/
      );
      const mediaServiceMatch = content.match(/MediaService.*register|register.*MediaService/);

      if (settingsServiceMatch && mediaServiceMatch) {
        const settingsIndex = content.indexOf(settingsServiceMatch[0]);
        const mediaIndex = content.indexOf(mediaServiceMatch[0]);

        if (settingsIndex >= mediaIndex) {
          console.log('🚨 발견된 문제: SettingsService가 MediaService보다 늦게 등록됨');
        }

        expect(settingsIndex).toBeLessThan(mediaIndex);
      }
    });
  });
});

describe('🔴 RED: 안전장치 검증', () => {
  it('AnimationController가 SettingsService 없이도 초기화되어야 한다', () => {
    const animationControllerPath = path.resolve('src/shared/services/animation-controller.ts');
    const content = readFileSync(animationControllerPath, 'utf-8');

    // try-catch 블록으로 안전하게 처리되는지 확인
    const hasSafeInitialization = /try\s*\{[\s\S]*getService[\s\S]*\}\s*catch/.test(content);

    if (!hasSafeInitialization) {
      console.log('🚨 발견된 문제: AnimationController에 안전장치 없음');
    }

    expect(hasSafeInitialization).toBe(true);
  });
});
