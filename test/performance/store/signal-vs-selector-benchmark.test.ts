/**
 * Benchmark: direct signal access vs unified store selector
 * 목적: galleryState.value.isOpen 과 selectors.isOpen() 호출 오버헤드 비교
 *
 * 기준(문서): 차이 < 1% → Store selector 전환 고려 가능
 * 테스트는 회귀 가드가 아닌 수치 출력 목적이므로 실패 기준 없음.
 */
import { describe, it } from 'vitest';
import { galleryState, isGalleryOpen } from '@shared/state/signals/gallery.signals';
import { selectors } from '@shared/state/gallery.store';
import { FEATURE_STORE_SIGNAL_FASTPATH } from '@/constants';
import { normalizeWheelDelta } from '@shared/utils/scroll/wheel-normalize';
import { createWheelDeltaAccumulator } from '@shared/utils/scroll/wheel-delta-accumulator';

// 고해상도 타이머 (Node 환경 가정)
function nowNs(): bigint {
  return typeof process !== 'undefined' && process.hrtime ? process.hrtime.bigint() : BigInt(0);
}

interface BenchResult {
  label: string;
  totalNs: bigint;
  perOpNs: number; // float
  runs: number[]; // per-run ns
}

function formatNs(ns: bigint): string {
  const n = Number(ns);
  if (n < 1e3) return `${n}ns`;
  if (n < 1e6) return `${(n / 1e3).toFixed(2)}µs`;
  if (n < 1e9) return `${(n / 1e6).toFixed(2)}ms`;
  return `${(n / 1e9).toFixed(2)}s`;
}

function runLoop(loopCount: number, mode: 'signal' | 'selector'): bigint {
  let acc = 0;
  const start = nowNs();
  for (let i = 0; i < loopCount; i++) {
    // hot-path 조건부 분기 시뮬레이션
    if (mode === 'signal') {
      if (!galleryState.value.isOpen) acc++;
    } else {
      if (!selectors.isOpen()) acc++;
    }
  }
  const end = nowNs();
  // acc 사용 방지 최적화 방어
  if (acc === -1) console.log('unreachable');
  return end - start;
}

function bench(loopCount: number, runs: number, mode: 'signal' | 'selector'): BenchResult {
  // 워밍업
  runLoop(loopCount, mode);
  const perRun: number[] = [];
  let total = BigInt(0);
  for (let i = 0; i < runs; i++) {
    const dur = runLoop(loopCount, mode);
    perRun.push(Number(dur));
    total += dur;
  }
  const avgNs = Number(total) / (loopCount * runs);
  return { label: mode, totalNs: total, perOpNs: avgNs, runs: perRun };
}

// 글로벌 반복 확장: 최소 10회로 스케일 (벤치 안정성)
const globalRepeatRaw = (globalThis as unknown as { __XEG_BENCH_REPEAT__?: unknown })
  .__XEG_BENCH_REPEAT__;
let GLOBAL_REPEAT =
  typeof globalRepeatRaw === 'number' && globalRepeatRaw > 0 ? globalRepeatRaw : 10;
if (GLOBAL_REPEAT < 10) GLOBAL_REPEAT = 10;
(globalThis as any).__XEG_BENCH_REPEAT__ = GLOBAL_REPEAT;

function regressionWarn(tag: string, diffPct: number, threshold = 10): void {
  if (diffPct > threshold) {
    // eslint-disable-next-line no-console
    console.warn(
      `[BENCH][REGRESSION?][${tag}] selector slower by ${diffPct.toFixed(2)}% (> ${threshold}%)`
    );
  }
}

// Fast path 플래그 적용: selectors.isOpen 을 direct signal 로 alias
if (FEATURE_STORE_SIGNAL_FASTPATH) {
  // runtime alias 실험 목적 (타입 안전성 희생: 퍼포먼스 비교 전용)
  (selectors as unknown as { isOpen: typeof isGalleryOpen }).isOpen = isGalleryOpen;
}

describe('Performance: signal vs selector (isOpen hot path)', () => {
  it('10k loop x 5 runs benchmark 출력 (repeat override 지원 + min10)', () => {
    galleryState.value = { ...galleryState.value, isOpen: true };
    const LOOP = 10_000 * GLOBAL_REPEAT;
    const RUNS = 5;
    const signalRes = bench(LOOP, RUNS, 'signal');
    const selectorRes = bench(LOOP, RUNS, 'selector');
    const diffPct = ((selectorRes.perOpNs - signalRes.perOpNs) / signalRes.perOpNs) * 100;
    // 로그 출력
    // eslint-disable-next-line no-console
    console.log('[BENCH][isOpen 10k]', {
      loop: LOOP,
      runs: RUNS,
      signalPerOpNs: signalRes.perOpNs.toFixed(3),
      selectorPerOpNs: selectorRes.perOpNs.toFixed(3),
      diffPct: diffPct.toFixed(2) + '%',
      signalTotal: formatNs(signalRes.totalNs),
      selectorTotal: formatNs(selectorRes.totalNs),
    });
    regressionWarn('isOpen-10k', diffPct);
  });
});

// Wheel handler 시나리오 (간소화된 핸들러) 500회
function wheelHandlerFactory(mode: 'signal' | 'selector') {
  let consumed = 0;
  return (delta: number): number => {
    if (mode === 'signal') {
      if (!galleryState.value.isOpen) return consumed;
    } else if (!selectors.isOpen()) {
      return consumed;
    }
    consumed += delta;
    return consumed;
  };
}

function benchWheel(invocations: number, mode: 'signal' | 'selector'): bigint {
  const handler = wheelHandlerFactory(mode);
  const start = nowNs();
  for (let i = 0; i < invocations; i++) {
    handler(i & 1 ? 12 : -8);
  }
  return nowNs() - start;
}

describe('Performance: wheel handler signal vs selector', () => {
  it('mock wheel 500회 비교 (repeat override 지원 + min10)', () => {
    galleryState.value = { ...galleryState.value, isOpen: true };
    const N = 500 * GLOBAL_REPEAT;
    benchWheel(N, 'signal');
    benchWheel(N, 'selector');
    const sig = benchWheel(N, 'signal');
    const sel = benchWheel(N, 'selector');
    const diffPct = ((Number(sel) - Number(sig)) / Number(sig)) * 100;
    console.log('[BENCH][wheel basic]', {
      iterations: N,
      signal: formatNs(sig),
      selector: formatNs(sel),
      diffPct: diffPct.toFixed(2) + '%',
    });
    regressionWarn('wheel-basic', diffPct);
  });
});

// 현실적인 wheel 이벤트 처리 시나리오 (normalize + fractional 누적 + 조건 분기 일부)
function realisticWheelScenario(invocations: number, mode: 'signal' | 'selector'): bigint {
  const deltas: number[] = [];
  for (let i = 0; i < invocations; i++) {
    // 다양한 가속 패턴: 작은/큰 delta 섞기
    const raw =
      i % 7 === 0 ? 0.8 : i % 11 === 0 ? 13.4 : i % 5 === 0 ? -6.2 : i % 3 === 0 ? 2.4 : -3.1;
    deltas.push(raw);
  }
  const accumulator = createWheelDeltaAccumulator();
  let consumed = 0;
  const start = nowNs();
  for (let i = 0; i < deltas.length; i++) {
    // isOpen 게이트
    const open = mode === 'signal' ? galleryState.value.isOpen : selectors.isOpen();
    if (!open) continue;
    const base = normalizeWheelDelta(deltas[i]);
    const merged = accumulator.push(base);
    const effective = merged !== 0 ? merged : base;
    if (effective === 0) continue;
    consumed += effective;
    // preventDefault 분기 대체: atTop/Bottom 계산 흉내 (상수 스크롤 범위)
    // 실제 스크롤 위치 의존성 제거 – 분기 비용만 시뮬레이트
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const atEdge = (effective > 0 && (i & 31) === 0) || (effective < 0 && (i & 63) === 0);
  }
  const end = nowNs();
  if (consumed === -999999) console.log('unreachable');
  return end - start;
}

describe('Performance: realistic wheel scenario (normalize + accumulation)', () => {
  it('realistic 2000 events (repeat override 지원 + min10)', () => {
    galleryState.value = { ...galleryState.value, isOpen: true };
    const EVENTS = 2_000 * GLOBAL_REPEAT;
    // 워밍업
    realisticWheelScenario(EVENTS, 'signal');
    realisticWheelScenario(EVENTS, 'selector');
    const sig = realisticWheelScenario(EVENTS, 'signal');
    const sel = realisticWheelScenario(EVENTS, 'selector');
    const diffPct = ((Number(sel) - Number(sig)) / Number(sig)) * 100;
    console.log('[BENCH][wheel realistic]', {
      events: EVENTS,
      signal: formatNs(sig),
      selector: formatNs(sel),
      diffPct: diffPct.toFixed(2) + '%',
    });
    regressionWarn('wheel-realistic', diffPct);
  });
});

// selector 최적화 실험: selectors.isOpen 을 isGalleryOpen 직접 alias 후 재측정
describe('Performance: selector alias optimization experiment', () => {
  it('alias 적용 후 loop & realistic wheel 재측정 (repeat 적용)', () => {
    galleryState.value = { ...galleryState.value, isOpen: true };
    const original = selectors.isOpen;
    // 런타임 실험 목적 재할당 (벤치 전용)
    (selectors as unknown as { isOpen: typeof isGalleryOpen }).isOpen = isGalleryOpen;
    try {
      const LOOP = 10_000 * GLOBAL_REPEAT;
      runLoop(1_000, 'selector'); // 워밍업
      const before = runLoop(LOOP, 'selector');
      const wheelBefore = realisticWheelScenario(2_000 * GLOBAL_REPEAT, 'selector');
      console.log('[BENCH][alias selector]', {
        loop: LOOP,
        perLoopNs: (Number(before) / LOOP).toFixed(3),
        wheelRealistic: formatNs(wheelBefore),
      });
    } finally {
      selectors.isOpen = original;
    }
  });
});
