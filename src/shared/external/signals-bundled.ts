/**
 * Bundled @preact/signals facade
 *
 * CSP/IIFE 환경에서 동적 import로 인한 TDZ 문제를 방지하기 위해
 * @preact/signals 를 정적으로 번들에 포함해 안정적인 레퍼런스를 제공한다.
 */

import { signal, computed, effect, batch } from '@preact/signals';
import type { PreactSignalsAPI } from './vendors/vendor-service';

export const preactSignals: PreactSignalsAPI = {
  signal,
  computed,
  effect,
  batch,
};

export type BundledPreactSignals = typeof preactSignals;
