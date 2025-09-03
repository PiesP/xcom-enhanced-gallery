// Phase 22: Semantic Surface Tokens (initial GREEN implementation)
// Provides unified 4-level surface + retrieval helper.
// Blur / glass tokens intentionally omitted (deprecation path).

export const SURFACE_LEVELS = ['base', 'muted', 'elevated', 'overlay'] as const;
export type SurfaceLevel = (typeof SURFACE_LEVELS)[number];

export interface SurfaceTokenSet {
  level: SurfaceLevel;
  bg: string; // background color token (var reference or raw)
  border: string; // border color token
  shadow?: string; // optional shadow token
  emphasis?: number; // relative emphasis scale (0..1)
  fgPrimary: string; // primary foreground (var or raw)
  fgSecondary: string; // secondary foreground (var or raw)
  // Resolved (hex) colors used only for test contrast evaluation in non-DOM env (JSDOM variable resolution 한계)
  resolvedBg?: string;
  resolvedFgPrimary?: string;
  resolvedFgSecondary?: string;
}

// Light/Dark base palette placeholders; will be refined in later steps.
// Using CSS variable references keeps theme switch cost low.
// NOTE: resolved* 값은 디자인 토큰의 대표 hex 추정치 (테스트 대비 계산 목적). 실제 렌더는 var() 우선.
const LIGHT_MAP: Record<SurfaceLevel, SurfaceTokenSet> = {
  base: {
    level: 'base',
    bg: 'var(--xeg-color-background)',
    border: 'var(--xeg-color-border-primary)',
    shadow: 'var(--xeg-shadow-sm)',
    emphasis: 0,
    fgPrimary: 'var(--xeg-color-text-primary)',
    fgSecondary: 'var(--xeg-color-text-secondary)',
    resolvedBg: '#fafafa',
    resolvedFgPrimary: '#171717',
    // Secondary (#444444) chosen to ensure >=3:1 against #fafafa (≈4.6:1)
    resolvedFgSecondary: '#444444',
  },
  muted: {
    level: 'muted',
    bg: 'var(--xeg-color-neutral-50)',
    border: 'var(--xeg-color-border-secondary)',
    shadow: 'var(--xeg-shadow-sm)',
    emphasis: 0.15,
    fgPrimary: 'var(--xeg-color-text-primary)',
    fgSecondary: 'var(--xeg-color-text-secondary)',
    resolvedBg: '#f0f2f5',
    resolvedFgPrimary: '#171717',
    resolvedFgSecondary: '#444444',
  },
  elevated: {
    level: 'elevated',
    bg: 'var(--xeg-color-surface-modal-bg)',
    border: 'var(--xeg-color-surface-modal-border)',
    shadow: 'var(--xeg-shadow-md)',
    emphasis: 0.35,
    fgPrimary: 'var(--xeg-color-text-primary)',
    fgSecondary: 'var(--xeg-color-text-secondary)',
    resolvedBg: '#ffffff',
    resolvedFgPrimary: '#171717',
    resolvedFgSecondary: '#444444',
  },
  overlay: {
    level: 'overlay',
    bg: 'var(--xeg-color-surface-modal-solid-bg)',
    border: 'var(--xeg-color-surface-modal-solid-border)',
    shadow: 'var(--xeg-shadow-lg)',
    emphasis: 0.55,
    fgPrimary: 'var(--xeg-color-text-primary)',
    fgSecondary: 'var(--xeg-color-text-secondary)',
    resolvedBg: '#ffffff',
    resolvedFgPrimary: '#171717',
    resolvedFgSecondary: '#444444',
  },
};

const DARK_MAP: Record<SurfaceLevel, SurfaceTokenSet> = {
  base: {
    level: 'base',
    bg: 'var(--xeg-color-background)',
    border: 'var(--xeg-color-border-primary)',
    shadow: 'var(--xeg-shadow-sm)',
    emphasis: 0,
    fgPrimary: 'var(--xeg-color-text-primary)',
    fgSecondary: 'var(--xeg-color-text-secondary)',
    resolvedBg: '#0a0a0a',
    resolvedFgPrimary: '#f5f5f5',
    resolvedFgSecondary: '#b0b0b0',
  },
  muted: {
    level: 'muted',
    bg: 'var(--xeg-color-neutral-800)',
    border: 'var(--xeg-color-border-secondary)',
    shadow: 'var(--xeg-shadow-sm)',
    emphasis: 0.15,
    fgPrimary: 'var(--xeg-color-text-primary)',
    fgSecondary: 'var(--xeg-color-text-secondary)',
    resolvedBg: '#141414',
    resolvedFgPrimary: '#f5f5f5',
    resolvedFgSecondary: '#b0b0b0',
  },
  elevated: {
    level: 'elevated',
    bg: 'var(--xeg-surface-modal-bg-dark)',
    border: 'var(--xeg-surface-modal-border-dark)',
    shadow: 'var(--xeg-shadow-md)',
    emphasis: 0.35,
    fgPrimary: 'var(--xeg-color-text-primary)',
    fgSecondary: 'var(--xeg-color-text-secondary)',
    resolvedBg: '#1d1f21',
    resolvedFgPrimary: '#f5f5f5',
    resolvedFgSecondary: '#b0b0b0',
  },
  overlay: {
    level: 'overlay',
    bg: 'var(--xeg-surface-modal-solid-bg-dark)',
    border: 'var(--xeg-surface-modal-solid-border-dark)',
    shadow: 'var(--xeg-shadow-lg)',
    emphasis: 0.55,
    fgPrimary: 'var(--xeg-color-text-primary)',
    fgSecondary: 'var(--xeg-color-text-secondary)',
    resolvedBg: '#232527',
    resolvedFgPrimary: '#f5f5f5',
    resolvedFgSecondary: '#b0b0b0',
  },
};

export interface GetSurfaceTokenSetOptions {
  level: SurfaceLevel;
  darkMode?: boolean; // explicit override (else read prefers-color-scheme)
}

function detectDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function getSurfaceTokenSet(opts: GetSurfaceTokenSetOptions): SurfaceTokenSet {
  const dark = opts.darkMode ?? detectDark();
  const map = dark ? DARK_MAP : LIGHT_MAP;
  return map[opts.level];
}

export function listSurfaceTokenSets(darkMode?: boolean): SurfaceTokenSet[] {
  const dark = darkMode ?? detectDark();
  const map = dark ? DARK_MAP : LIGHT_MAP;
  return SURFACE_LEVELS.map(l => map[l]);
}
