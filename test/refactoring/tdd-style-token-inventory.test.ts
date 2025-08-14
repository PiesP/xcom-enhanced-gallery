/**
 * TDD RED 단계: 툴바 / 설정 모달 CSS 변수 사용 인벤토리 테스트 (실패 예상)
 * 목적: 컴포넌트에서 사용하는 CSS 커스텀 프로퍼티 중 디자인 토큰에 정의되지 않은 누락 토큰을 탐지한다.
 * 최초 실패 요건:
 *  - 다음 토큰들이 누락 목록에 포함되어야 한다:
 *    --xeg-modal-overlay-backdrop (SettingsOverlay.module.css에서 사용, 정의 없음)
 *    --xeg-modal-bg-hover (SettingsOverlay.module.css에서 사용, 정의 없음)
 *    --xeg-modal-shadow-strong (hover 스타일에서 사용, 정의 없음)
 */
import { describe, it, expect } from 'vitest';
import { analyzeStyleTokens } from '../../src/dev-scripts/styleTokenAnalyzer';

describe('Style Token Inventory (Toolbar vs Settings Modal)', () => {
  it('모달 관련 토큰이 모두 정의되어 누락되지 않는다 (GREEN)', async () => {
    const result = await analyzeStyleTokens({
      definitionRoots: [
        'src/shared/styles/design-tokens.css',
        'src/shared/styles/design-tokens-solid.css',
      ],
      componentFiles: [
        'src/shared/components/ui/Toolbar/Toolbar.module.css',
        'src/features/settings/components/SettingsOverlay.module.css',
      ],
    });

    // 최소 누락 토큰 집합 (테스트 기준)
    expect(result.missingTokens.size).toBe(0);
  });
});
