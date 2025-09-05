/**
 * @file button.ts
 * @description Semantic Button Design Tokens (Phase 2) - 런타임/테스트 용 매핑.
 * 모든 값은 기존 전역 CSS 변수(또는 현재 Button.module.css 사용 변수)를 참조하며
 * 직접 색상(hex, rgba) / px 값 하드코딩을 금지한다.
 */

// Token 구조 타입 정의 (확장 시 안정성 확보)
export interface ButtonTokens {
  readonly color: {
    readonly bg: {
      readonly primary: string;
      readonly secondary: string;
      readonly danger: string;
      readonly ghost: string;
      readonly icon: string;
    };
    readonly text: {
      readonly primary: string;
      readonly inverse: string;
      readonly subtle: string;
      readonly danger: string;
    };
    readonly border: {
      readonly primary: string;
      readonly secondary: string;
      readonly danger: string;
      readonly subtle: string;
    };
    readonly state: {
      readonly hoverPrimary: string;
      readonly hoverSecondary: string;
      readonly hoverDanger: string;
      readonly hoverGhost: string;
      readonly hoverIcon: string;
      readonly focusRing: string;
    };
  };
  readonly radius: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
  };
  readonly spacing: {
    readonly gap: string;
    readonly padSm: string;
    readonly padMd: string;
    readonly padLg: string;
  };
  readonly elevation: {
    readonly resting: string;
    readonly hover: string;
    readonly active: string; // optional 동일 shadow 재사용 가능
  };
  readonly motion: {
    readonly lift: string; // translateY 변수
    readonly duration: string;
    readonly easing: string;
  };
  readonly opacity: {
    readonly disabled: string;
  };
}

// 실제 매핑 (모두 var(--*) 형태)
export const buttonTokens: ButtonTokens = {
  color: {
    bg: {
      primary: 'var(--color-primary)',
      secondary: 'var(--xeg-color-neutral-100)',
      danger: 'var(--color-error)',
      ghost: 'transparent', // 고스트는 transparent 허용
      icon: 'transparent',
    },
    text: {
      primary: 'var(--xeg-color-text-primary)',
      inverse: 'var(--color-text-inverse)',
      subtle: 'var(--xeg-color-text-secondary)',
      danger: 'var(--color-error)',
    },
    border: {
      primary: 'var(--color-primary)',
      secondary: 'var(--xeg-color-border-primary)',
      danger: 'var(--color-error)',
      subtle: 'transparent',
    },
    state: {
      hoverPrimary: 'var(--color-primary-hover)',
      hoverSecondary: 'var(--xeg-color-neutral-200)',
      hoverDanger: 'var(--color-error-hover)',
      hoverGhost: 'var(--xeg-color-neutral-100)',
      hoverIcon: 'var(--xeg-color-neutral-100)',
      focusRing: 'var(--xeg-focus-ring)',
    },
  },
  radius: {
    sm: 'var(--xeg-radius-sm)',
    md: 'var(--xeg-radius-md)',
    lg: 'var(--xeg-radius-lg)',
  },
  spacing: {
    gap: 'var(--xeg-spacing-sm)',
    padSm: 'var(--xeg-spacing-xs)',
    padMd: 'var(--xeg-spacing-sm)',
    padLg: 'var(--xeg-spacing-md)',
  },
  elevation: {
    resting: 'var(--xeg-shadow-sm)',
    hover: 'var(--xeg-shadow-md)',
    active: 'var(--xeg-shadow-sm)',
  },
  motion: {
    lift: 'var(--xeg-button-lift)',
    duration: 'var(--xeg-duration-fast)',
    easing: 'var(--xeg-easing-ease-out)',
  },
  opacity: {
    disabled: 'var(--xeg-opacity-disabled)',
  },
} as const;

// Getter (격리된 접근: 테스트/컴포넌트에서 직접 객체 수정 금지)
export function getButtonTokens(): ButtonTokens {
  return buttonTokens;
}

// 런타임 안전 검사 (개발 모드)
if (process.env.NODE_ENV !== 'production') {
  const rawValues = JSON.stringify(buttonTokens);
  if (/(#[0-9a-fA-F]{3,8})|(rgba?\()/g.test(rawValues)) {
    console.warn('[buttonTokens] Raw color literal detected. Please use CSS variables.');
  }
}

export default buttonTokens;
