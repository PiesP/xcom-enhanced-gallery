/**
 * @fileoverview RebindWatcher - SPA DOM 교체 시 컨테이너 분실 감지 및 재바인드 도우미
 */
import { globalTimerManager } from '../timer-management';

export interface RebindWatcherOptions {
  /** 관찰 루트 (기본: document.body) */
  root?: Node;
  /** 재바인드 처리 콜백 */
  onContainerLost: () => void | Promise<void>;
  /** 관찰할 컨테이너를 식별하는 함수 */
  isTargetNode: (node: Node) => boolean;
  /** 분실 후 재바인드 지연 (기본 150ms, 요구사항 ≤250ms) */
  rebindDelayMs?: number;
}

export class RebindWatcher {
  private observer: MutationObserver | null = null;
  private disposed = false;
  private rebindTimer: number | null = null;
  private static readonly TIMER_CONTEXT = 'rebind-watcher';

  constructor(private readonly options: RebindWatcherOptions) {}

  start(): void {
    if (this.observer || this.disposed) return;
    // 테스트/SSR 환경에서 document가 없을 수 있으므로 안전 가드
    if (typeof document === 'undefined') return;
    const root = this.options.root ?? document.body;
    if (!root) return;

    this.observer = new MutationObserver(mutations => {
      // 환경이 이미 정리된 경우 콜백을 안전 종료
      if (typeof document === 'undefined') return;
      for (const m of mutations) {
        // 제거된 노드에 대상이 포함되어 있는지 확인
        for (const removed of Array.from(m.removedNodes)) {
          if (this.options.isTargetNode(removed)) {
            this.scheduleRebind();
            return; // 한 번 감지하면 즉시 처리
          }
          // 하위 탐색 (얕은 탐색으로 충분)
          if (removed.hasChildNodes?.()) {
            // ownerDocument가 있으면 우선 사용, 없으면 전역 document 사용
            const doc: Document | undefined =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (removed as any)?.ownerDocument ??
              (typeof document !== 'undefined' ? document : undefined);
            if (!doc) return;
            const walker = doc.createTreeWalker(removed as Node, NodeFilter.SHOW_ELEMENT);
            while (true) {
              const n = walker.nextNode();
              if (!n) break;
              if (this.options.isTargetNode(n)) {
                this.scheduleRebind();
                return;
              }
            }
          }
        }
      }
    });

    this.observer.observe(root, { childList: true, subtree: true });
  }

  private scheduleRebind() {
    if (this.disposed) return;
    if (this.rebindTimer) {
      // Use global timer manager for consistent tracking/cleanup
      globalTimerManager.clearTimeout(this.rebindTimer);
      this.rebindTimer = null;
    }
    const delay = Math.min(Math.max(this.options.rebindDelayMs ?? 150, 0), 250);
    {
      this.rebindTimer = globalTimerManager.setTimeout(
        () => {
          this.rebindTimer = null;
          void this.options.onContainerLost();
        },
        delay,
        RebindWatcher.TIMER_CONTEXT
      );
    }
  }

  stop(): void {
    if (this.rebindTimer) {
      globalTimerManager.clearTimeout(this.rebindTimer);
      this.rebindTimer = null;
    }
    this.observer?.disconnect();
    this.observer = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
  }
}
