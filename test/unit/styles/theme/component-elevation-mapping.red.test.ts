import { describe, it, expect } from 'vitest';

// RED: 컴포넌트 → Semantic Surface elevation 매핑 누락 검출
// 목표 GREEN: 각 주요 컴포넌트가 data 속성 혹은 클래스/토큰 선언을 통해 surface level 명시
// 대상: Toolbar (elevated), SettingsModal (overlay), Toast (overlay|elevated 재검토), Button (elevated)

interface ExpectedMapping {
  component: string;
  desired: string;
  locator: RegExp;
}

const EXPECTED: ExpectedMapping[] = [
  { component: 'Toolbar', desired: 'elevated', locator: /Toolbar\.module\.css/ },
  { component: 'SettingsModal', desired: 'overlay', locator: /SettingsModal\.module\.css/ },
  { component: 'Toast', desired: 'overlay', locator: /Toast\.module\.css/ },
];

// 현 단계: surface level 명시적 data-* 혹은 클래스 없음 → 실패 유지

describe('Phase22 Component Elevation Mapping (RED)', () => {
  it('should define semantic surface level markers for key components', async () => {
    const missing: string[] = [];
    for (const exp of EXPECTED) {
      // 간단: 관련 CSS 모듈 내 surface level 힌트 토큰 존재 기대 (예: xeg-surface-level-elevated)
      // NOTE: import.meta.glob placeholder (미래 GREEN 단계에서 실제 CSS 내용 스캔 도입 예정)
      try {
        import.meta.glob<string>('/src/shared/components/ui/**/[^.]*.module.css', {
          as: 'raw',
          eager: true,
        });
      } catch {
        /* ignore */
      }
      // 실제 구현 전에는 marker 탐지 로직 단순화 → 항상 누락 처리
      missing.push(`${exp.component}:${exp.desired}:missing-marker`);
    }
    expect(missing).toEqual([]); // GREEN 단계에서 marker 추가 후 통과 예정
  });
});
