import { describe, it, expect, beforeEach } from 'vitest';
import { EventManager } from '@shared/services/EventManager';
import {
  EventPriorityAuditor,
  type EventPrioritySnapshotDiff,
} from '@shared/services/EventPriorityAuditor';

function makeHandler(label: string) {
  return function handler() {
    return label; // no-op
  };
}

describe('EventPriorityAuditor snapshot & diff', () => {
  let manager: EventManager;
  let auditor: EventPriorityAuditor;

  beforeEach(() => {
    EventManager.resetInstance();
    manager = EventManager.getInstance(true);
    auditor = new EventPriorityAuditor();
  });

  it('creates stable baseline hash (diff length 0 immediately after capture)', () => {
    const doc = globalThis.document;
    manager
      .addEventListener(doc, 'wheel', makeHandler('wheel-1'), { capture: true })
      .addEventListener(doc, 'keydown', makeHandler('keydown-1'), { capture: true })
      .addEventListener(doc, 'click', makeHandler('click-1'), { capture: true });

    const baseline = auditor.captureBaseline(manager);
    const next = auditor.getCurrentSnapshot(manager);
    const diff = auditor.diff(baseline, next);

    expect(diff.added.length).toBe(0);
    expect(diff.removed.length).toBe(0);
    expect(diff.changedOrder.length).toBe(0);
    expect(baseline.fingerprint).toBe(next.fingerprint);
  });

  it('detects removed listeners after cleanup (all become removed)', () => {
    const doc = globalThis.document;
    manager
      .addEventListener(doc, 'wheel', makeHandler('wheel-2'), { capture: true })
      .addEventListener(doc, 'keydown', makeHandler('keydown-2'), { capture: true })
      .addEventListener(doc, 'click', makeHandler('click-2'), { capture: true });

    const baseline = auditor.captureBaseline(manager);

    // Simulate teardown that drops listeners (mutation / rebind scenario)
    manager.cleanup();

    const after = auditor.getCurrentSnapshot(manager);
    const diff: EventPrioritySnapshotDiff = auditor.diff(baseline, after);

    expect(diff.removed.length).toBe(baseline.records.length);
    expect(diff.added.length).toBe(0);
    // Order changes are irrelevant when everything removed
    expect(diff.changedOrder.length).toBe(0);
    expect(after.records.length).toBe(0);
    expect(after.fingerprint).not.toBe(baseline.fingerprint);
  });
});
