import { EventManager } from './EventManager';

export interface EventPriorityRecord {
  id: number;
  event: string;
  target: string;
  capture: boolean;
  passive: boolean;
  once: boolean;
  order: number;
}

export interface EventPrioritySnapshot {
  records: EventPriorityRecord[];
  fingerprint: string; // stable hash of ordered records
  capturedAt: number;
}

export interface EventPrioritySnapshotDiff {
  added: EventPriorityRecord[];
  removed: EventPriorityRecord[];
  changedOrder: { event: string; from: number; to: number; target: string }[];
  baselineFingerprint: string;
  nextFingerprint: string;
}

/**
 * 간단한 해시 (djb2 변형) - 안정적 fingerprint 용도
 */
function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export class EventPriorityAuditor {
  private baseline: EventPrioritySnapshot | null = null;

  /** 현재 등록된 이벤트 리스너의 우선순위(등록 순서) 스냅샷 생성 */
  public getCurrentSnapshot(manager: EventManager): EventPrioritySnapshot {
    const records = manager.getRegisteredDomEventRecords?.() || [];
    const stable = [...records].sort((a, b) => a.order - b.order);
    const payload = stable
      .map(
        r =>
          `${r.order}:${r.target}:${r.event}:${r.capture ? '1' : '0'}:${r.passive ? '1' : '0'}:${r.once ? '1' : '0'}`
      )
      .join('|');
    const fingerprint = hashString(payload);
    return { records: stable, fingerprint, capturedAt: Date.now() };
  }

  /** 최초 baseline 캡처 (중복 호출 시 최신으로 교체) */
  public captureBaseline(manager: EventManager): EventPrioritySnapshot {
    this.baseline = this.getCurrentSnapshot(manager);
    return this.baseline;
  }

  public getBaseline(): EventPrioritySnapshot | null {
    return this.baseline;
  }

  /** 두 스냅샷 차이를 계산 */
  public diff(
    baseline: EventPrioritySnapshot,
    next: EventPrioritySnapshot
  ): EventPrioritySnapshotDiff {
    const byKey = (r: EventPriorityRecord) => `${r.target}|${r.event}|${r.capture ? '1' : '0'}`;
    const baseMap = new Map(baseline.records.map(r => [byKey(r), r]));
    const nextMap = new Map(next.records.map(r => [byKey(r), r]));

    const removed: EventPriorityRecord[] = [];
    for (const [k, r] of baseMap) {
      if (!nextMap.has(k)) removed.push(r);
    }

    const added: EventPriorityRecord[] = [];
    for (const [k, r] of nextMap) {
      if (!baseMap.has(k)) added.push(r);
    }

    const changedOrder: { event: string; from: number; to: number; target: string }[] = [];
    for (const [k, r] of nextMap) {
      const prev = baseMap.get(k);
      if (prev && prev.order !== r.order) {
        changedOrder.push({ event: r.event, from: prev.order, to: r.order, target: r.target });
      }
    }

    return {
      added,
      removed,
      changedOrder,
      baselineFingerprint: baseline.fingerprint,
      nextFingerprint: next.fingerprint,
    };
  }
}
