/**
 * @file chroma-attenuation.ts
 * @description OKLCH chroma 감쇠 유틸 (Phase22 마무리).
 * 고채도 색상을 다크/라이트 테마에서 살짝 줄여 대비와 가독성 안정성을 확보.
 * 외부 라이브러리 없이 최소 계산만 수행 (번들 영향 < 0.1KB 예상).
 */

export interface OKLCHColor {
  l: number;
  c: number;
  h: number;
}

export interface AttenuateOptions {
  /** UI 테마 */
  mode: 'light' | 'dark';
  /** 감쇠 임계값 (이 값 이하는 변경 없음) */
  threshold?: number; // default 0.16
  /** 감쇠 계수 (적용 모드 기준 기본) */
  factor?: number; // default: dark 0.88 / light 0.93
  /** 감쇠 후 최소 chroma 플로어 */
  floor?: number; // default 0.04
  /** 상한 clamp (보호) */
  ceiling?: number; // default 0.37 (일반 UI 안전 영역)
}

const DEFAULTS = {
  threshold: 0.16,
  factorDark: 0.88,
  factorLight: 0.93,
  floor: 0.04,
  ceiling: 0.37,
};

/** clamp helper */
function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n;
}

/**
 * 고채도 색상 OKLCH.c 를 테마별 감쇠 규칙으로 약간 낮춘다.
 * - c <= threshold 일 경우 원본 유지 (저채도 안전)
 * - 감쇠 후 floor 이하로 떨어지지 않도록 보호
 * - ceiling 초과 입력은 먼저 clamp
 */
export function attenuateChroma(color: OKLCHColor, opts: AttenuateOptions): OKLCHColor {
  const { l, h } = color;
  let { c } = color;
  const threshold = opts.threshold ?? DEFAULTS.threshold;
  const floor = opts.floor ?? DEFAULTS.floor;
  const ceiling = opts.ceiling ?? DEFAULTS.ceiling;
  c = clamp(c, 0, ceiling);
  if (c <= threshold) return { l, c, h }; // 변경 없음
  const factor = opts.factor ?? (opts.mode === 'dark' ? DEFAULTS.factorDark : DEFAULTS.factorLight);
  const attenuated = clamp(c * factor, floor, ceiling);
  return { l, c: attenuated, h };
}

// 간단한 문자열 파서: 형태 oklch(L C H) 만 처리 (테스트/내부 용도)
export function parseOKLCH(str: string): OKLCHColor | null {
  const m = /oklch\(\s*([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s*\)/i.exec(str);
  if (!m) return null;
  return { l: parseFloat(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]) };
}

export function formatOKLCH(c: OKLCHColor): string {
  return `oklch(${c.l} ${+c.c.toFixed(4)} ${c.h})`;
}

/**
 * 색상 문자열 단축 변환 유틸 (성공 시 감쇠 적용) – 실패 시 원본 반환
 */
export function attenuateOKLCHString(input: string, opts: AttenuateOptions): string {
  const parsed = parseOKLCH(input);
  if (!parsed) return input;
  return formatOKLCH(attenuateChroma(parsed, opts));
}

// 간단 계약 설명 (문서/테스트 참고용)
/**
 * Contract:
 * input.c > threshold -> output.c <= input.c AND >= floor
 * input.c <= threshold -> output.c === input.c
 */
export const __CHROMA_ATTENUATION_CONTRACT__ = true;
