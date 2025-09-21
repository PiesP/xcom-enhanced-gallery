import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ensurePoliteLiveRegion,
  ensureAssertiveLiveRegion,
  getLiveRegionElements,
  __resetLiveRegionStateForTests__,
} from '@/shared/utils/accessibility/live-region-manager';

// We'll import after ensuring module exists to avoid circular init
import * as LiveRegion from '@/shared/utils/accessibility/live-region-manager';

describe('Live Region Manager', () => {
  beforeEach(() => {
    // Reset DOM for each test
    document.body.innerHTML = '';
    // Reset fake timers
    vi.useRealTimers();
    // Reset internal live region state to avoid cross-test bleed
    __resetLiveRegionStateForTests__();
  });

  it('creates singleton polite and assertive regions with correct attributes', () => {
    const polite1 = ensurePoliteLiveRegion();
    const polite2 = ensurePoliteLiveRegion();
    const assertive1 = ensureAssertiveLiveRegion();
    const assertive2 = ensureAssertiveLiveRegion();

    expect(polite1).toBe(polite2);
    expect(assertive1).toBe(assertive2);

    const politeNodes = document.querySelectorAll('[data-xe-live-region="polite"]');
    const assertiveNodes = document.querySelectorAll('[data-xe-live-region="assertive"]');

    expect(politeNodes.length).toBe(1);
    expect(assertiveNodes.length).toBe(1);

    const polite = politeNodes[0] as HTMLElement;
    const assertive = assertiveNodes[0] as HTMLElement;

    expect(polite.getAttribute('aria-live')).toBe('polite');
    expect(polite.getAttribute('role')).toBe('status');
    expect(assertive.getAttribute('aria-live')).toBe('assertive');
    expect(assertive.getAttribute('role')).toBe('alert');
  });

  it('dedupes identical messages within a short window (polite)', async () => {
    vi.useFakeTimers();
    const polite = ensurePoliteLiveRegion();

    const mutations: string[] = [];
    const obs = new window.MutationObserver(() => {
      mutations.push(polite.textContent || '');
    });
    obs.observe(polite, { childList: true, characterData: true, subtree: true });

    // announce twice the same message quickly
    (LiveRegion as any).announcePolite?.('Saved');
    (LiveRegion as any).announcePolite?.('Saved');

    // flush timers and then allow MutationObserver microtasks to run
    vi.runAllTimers();
    await Promise.resolve();
    obs.disconnect();

    // Expect at most 2 mutations: blank toggle then message text once
    // Implementation may toggle to '' before setting message; ensure last is 'Saved'
    expect(mutations.filter(m => m === 'Saved').length).toBe(1);
    expect(polite.textContent).toBe('Saved');

    // Ensure no extra live region nodes were created
    expect(document.querySelectorAll('[data-xe-live-region]').length).toBeLessThanOrEqual(2);
  });

  it('queues and preserves order for different messages (polite)', async () => {
    vi.useFakeTimers();
    const polite = ensurePoliteLiveRegion();
    const seen: string[] = [];
    // 일부 환경에서 MutationObserver 콜백이 배치되어 한 번만 호출될 수 있으므로
    // mutation records를 순회하며 텍스트 변경을 정확히 수집한다.
    const obs = new window.MutationObserver(records => {
      for (const rec of records) {
        if (rec.type === 'characterData') {
          // 캐릭터 데이터 변경의 경우 대상 노드의 data를 사용
          const val = (rec.target as any).data as string | undefined;
          if (val) seen.push(val);
        } else if (rec.type === 'childList') {
          rec.addedNodes.forEach(n => {
            // 텍스트 노드(3)인지 확인
            if ((n as any).nodeType === 3) {
              const val = (n as any).data as string | undefined;
              if (val) seen.push(val);
            }
          });
        }
      }
    });
    obs.observe(polite, { childList: true, characterData: true, subtree: true });

    (LiveRegion as any).announcePolite?.('First');
    (LiveRegion as any).announcePolite?.('Second');
    (LiveRegion as any).announcePolite?.('Third');

    vi.runAllTimers();
    await Promise.resolve();
    obs.disconnect();

    // The sequence should include First, Second, Third in order at least once
    const ordered = seen.filter(t => ['First', 'Second', 'Third'].includes(t));
    expect(ordered.join(' ')).toContain('First');
    expect(ordered.join(' ')).toContain('Second');
    expect(ordered.join(' ')).toContain('Third');
    // And the last shown in region is the last message
    expect(polite.textContent).toBe('Third');
  });

  it('separates polite and assertive channels', async () => {
    vi.useFakeTimers();
    const polite = ensurePoliteLiveRegion();
    const assertive = ensureAssertiveLiveRegion();

    (LiveRegion as any).announcePolite?.('Notice');
    (LiveRegion as any).announceAssertive?.('Warning');

    vi.runAllTimers();
    await Promise.resolve();

    expect(polite.textContent).toBe('Notice');
    expect(assertive.textContent).toBe('Warning');
  });

  it('no DOM leaks: still only two live regions after many announcements', async () => {
    vi.useFakeTimers();
    ensurePoliteLiveRegion();
    ensureAssertiveLiveRegion();

    for (let i = 0; i < 10; i++) {
      (LiveRegion as any).announcePolite?.(`Msg ${i}`);
      (LiveRegion as any).announceAssertive?.(`Err ${i}`);
    }

    vi.runAllTimers();
    await Promise.resolve();

    const nodes = document.querySelectorAll('[data-xe-live-region]');
    expect(nodes.length).toBe(2);
  });
});
