/* eslint-env browser */
/* @vitest-environment jsdom */
// @ts-nocheck
/**
 * Diagnostics logging standardization tests (RED -> GREEN)
 *
 * 목표: 선택자 처리 경로에서 경고/디버그 로그의 키-값 포맷을 통일한다.
 * - 경고: 'selector.invalid' + { module, op, selector, reason, error? }
 * - 디버그: 'selector.resolve' + { module, op, selector?, matched }
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cachedQuerySelector, cachedStableQuery } from '../../../../src/shared/dom/DOMCache';
import { createSelectorRegistry } from '../../../../src/shared/dom/SelectorRegistry';

describe('Diagnostics logging - selector warnings and resolution debug', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(globalThis.console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it('logs standardized warn for invalid selector in querySelector', () => {
    // Trigger invalid CSS selector
    const el = cachedQuerySelector('::invalid');
    expect(el).toBeNull();

    // Expect a warn call with code and structured payload
    const matched = warnSpy.mock.calls.find(call => call.includes('selector.invalid'));
    expect(matched, 'expected a selector.invalid warn log').toBeTruthy();
    const payload = matched?.find(arg => typeof arg === 'object');
    expect(payload).toMatchObject({
      module: 'DOMCache',
      op: 'querySelector',
      selector: '::invalid',
      reason: 'invalid-selector',
    });
  });

  it('logs standardized warn for invalid selector in querySelectorAll', () => {
    // Force invalid by calling cachedStableQuery which uses querySelectorAll internally via findAll consumers
    // Here we directly call cachedQuerySelector with :all path indirectly by selecting NodeList in DOMCache
    const list = cachedQuerySelector('++bad');
    expect(list).toBeNull();

    const matched = warnSpy.mock.calls.find(call => call.includes('selector.invalid'));
    expect(matched).toBeTruthy();
    const payload = matched?.find(arg => typeof arg === 'object');
    // Either querySelector or querySelectorAll may be the op depending on code path; ensure one of them
    expect(payload?.module).toBe('DOMCache');
    expect(['querySelector', 'querySelectorAll']).toContain(payload?.op);
    expect(payload?.reason).toBe('invalid-selector');
  });

  it('logs debug resolution for cachedStableQuery (matched true)', () => {
    document.body.innerHTML = `<div class="xeg-target"></div>`;
    const el = cachedStableQuery(['div.xeg-target', 'span.fallback']);
    expect(el).not.toBeNull();

    const matched = infoSpy.mock.calls.find(call => call.includes('selector.resolve'));
    expect(matched, 'expected a selector.resolve debug log').toBeTruthy();
    const payload = matched?.find(arg => typeof arg === 'object');
    expect(payload).toMatchObject({
      module: 'DOMCache',
      op: 'cachedStableQuery',
      selector: 'div.xeg-target',
      matched: true,
    });
  });

  it('logs standardized warn for invalid selector in SelectorRegistry.findClosest', () => {
    document.body.innerHTML = `
      <article id="host">
        <div class="wrap"><span id="leaf">x</span></div>
      </article>
    `;
    const start = document.getElementById('leaf') as Element;
    const reg = createSelectorRegistry();
    const found = reg.findClosest(['::invalid', 'article'], start);
    expect(found).not.toBeNull();

    const matchedWarn = warnSpy.mock.calls.find(call => call.includes('selector.invalid'));
    expect(matchedWarn, 'expected selector.invalid warn').toBeTruthy();
    const payload = matchedWarn?.find(arg => typeof arg === 'object');
    expect(payload).toMatchObject({
      module: 'SelectorRegistry',
      op: 'findClosest',
      reason: 'invalid-selector',
    });
  });
});
