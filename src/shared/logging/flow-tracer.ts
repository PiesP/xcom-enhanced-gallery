/**
 * Development-only Flow Tracer
 *
 * Provides lightweight tracing utilities to follow execution flow and user interactions
 * to pinpoint when an issue occurs. Entirely removed from production builds via __DEV__.
 *
 * Exposed globals (dev only):
 * - window.__XEG_TRACE_START(opts?)
 * - window.__XEG_TRACE_STOP()
 * - window.__XEG_TRACE_POINT(label, data?)
 * - window.__XEG_TRACE_STATUS()
 */

import { logger } from './logger';

// Use global compile-time flag for tree-shaking
const isDev = __DEV__;

export interface TraceOptions {
  /** Throttle interval for wheel events (ms). Default: 120 */
  wheelThrottleMs?: number;
  /** Whether to include key names in key events. Default: true */
  includeKeyNames?: boolean;
  /** Whether to auto-start on import (not used by default here). */
  autoStart?: boolean;
}

type TracePointFn = (label: string, data?: Record<string, unknown>) => void;
type TraceAsyncFn = <T>(label: string, fn: () => Promise<T> | T) => Promise<T>;
type StartFn = (options?: TraceOptions) => void;
type StopFn = () => void;
type StatusFn = () => {
  started: boolean;
  sinceMs: number | null;
  options: Required<Pick<TraceOptions, 'wheelThrottleMs' | 'includeKeyNames'>>;
};

let tracePointImpl: TracePointFn | undefined;
let traceAsyncImpl: TraceAsyncFn | undefined;
let startFlowTraceImpl: StartFn | undefined;
let stopFlowTraceImpl: StopFn | undefined;
let statusFlowTraceImpl: StatusFn | undefined;

if (isDev) {
  const baseline = { t0: 0 };
  let started = false;
  let wheelLast = 0;
  let options: Required<Pick<TraceOptions, 'wheelThrottleMs' | 'includeKeyNames'>> = {
    wheelThrottleMs: 120,
    includeKeyNames: true,
  };

  const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const since = (): number => (baseline.t0 ? now() - baseline.t0 : 0);

  const listeners: Array<{ target: EventTarget; type: string; handler: EventListener }> = [];

  const add = (
    target: EventTarget,
    type: string,
    handler: EventListener,
    opts?: AddEventListenerOptions
  ): void => {
    target.addEventListener(type, handler, opts);
    listeners.push({ target, type, handler });
  };

  const removeAll = (): void => {
    for (const { target, type, handler } of listeners) {
      target.removeEventListener(type, handler as EventListener);
    }
    listeners.length = 0;
  };

  tracePointImpl = (label: string, data: Record<string, unknown> = {}): void => {
    const elapsed = since().toFixed(2);
    logger.debug(`TRACE ▸ ${label} (+${elapsed}ms)`, data);
  };

  traceAsyncImpl = async <T>(label: string, fn: () => Promise<T> | T): Promise<T> => {
    const start = now();
    tracePointImpl!(`${label}:start`);
    try {
      const result = await fn();
      const dur = (now() - start).toFixed(2);
      tracePointImpl!(`${label}:done`, { durationMs: dur });
      return result;
    } catch (e) {
      const dur = (now() - start).toFixed(2);
      tracePointImpl!(`${label}:error`, { durationMs: dur, error: String(e) });
      throw e;
    }
  };

  const onClick: EventListener = (ev: Event): void => {
    const e = ev as MouseEvent;
    const t = e.target as HTMLElement | null;
    tracePointImpl!('event:click', {
      tag: t?.tagName,
      cls: (t?.className || '').toString().slice(0, 80),
      btn: e.button,
    });
  };

  const onContext: EventListener = (ev: Event): void => {
    const e = ev as MouseEvent;
    const t = e.target as HTMLElement | null;
    tracePointImpl!('event:contextmenu', {
      tag: t?.tagName,
      btn: e.button,
    });
  };

  const onKey =
    (type: 'keydown' | 'keyup') =>
    (ev: Event): void => {
      const e = ev as KeyboardEvent;
      tracePointImpl!(`event:${type}`, options.includeKeyNames ? { key: e.key } : {});
    };

  const onMouseDown: EventListener = (ev: Event): void => {
    const e = ev as MouseEvent;
    const t = e.target as HTMLElement | null;
    tracePointImpl!('event:mousedown', { tag: t?.tagName, btn: e.button });
  };

  const onMouseUp: EventListener = (ev: Event): void => {
    const e = ev as MouseEvent;
    const t = e.target as HTMLElement | null;
    tracePointImpl!('event:mouseup', { tag: t?.tagName, btn: e.button });
  };

  const onWheel: EventListener = (ev: Event): void => {
    const e = ev as WheelEvent;
    const ts = now();
    if (ts - wheelLast < options.wheelThrottleMs) return;
    wheelLast = ts;
    tracePointImpl!('event:wheel', { dy: Math.trunc(e.deltaY) });
  };

  startFlowTraceImpl = (opts?: TraceOptions): void => {
    // Avoid vitest/jsdom interference without relying on import.meta.env
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return;
    if (started) return;
    started = true;
    options = {
      wheelThrottleMs: opts?.wheelThrottleMs ?? 120,
      includeKeyNames: opts?.includeKeyNames ?? true,
    };
    baseline.t0 = now();
    wheelLast = 0;

    // PC-only events only (policy)
    add(document, 'click', onClick, { passive: true });
    add(document, 'contextmenu', onContext, { passive: true });
    add(document, 'keydown', onKey('keydown'));
    add(document, 'keyup', onKey('keyup'));
    add(document, 'mousedown', onMouseDown, { passive: true });
    add(document, 'mouseup', onMouseUp, { passive: true });
    add(document, 'wheel', onWheel, { passive: true });

    tracePointImpl!('trace:start');
  };

  stopFlowTraceImpl = (): void => {
    if (!started) return;
    tracePointImpl!('trace:stop');
    removeAll();
    started = false;
    baseline.t0 = 0;
  };

  statusFlowTraceImpl = (): {
    started: boolean;
    sinceMs: number | null;
    options: { wheelThrottleMs: number; includeKeyNames: boolean };
  } => {
    return {
      started,
      sinceMs: started ? Math.trunc(since()) : null,
      options,
    };
  };

  if (typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>;
    w.__XEG_TRACE_START = startFlowTraceImpl;
    w.__XEG_TRACE_STOP = stopFlowTraceImpl;
    w.__XEG_TRACE_POINT = tracePointImpl;
    w.__XEG_TRACE_STATUS = statusFlowTraceImpl;
    logger.debug('XEG Trace Tools available: __XEG_TRACE_START/STOP/POINT/STATUS');
  }
}

export const tracePoint = tracePointImpl;
export const traceAsync = traceAsyncImpl;
export const startFlowTrace = startFlowTraceImpl;
export const stopFlowTrace = stopFlowTraceImpl;
export const traceStatus = statusFlowTraceImpl;
