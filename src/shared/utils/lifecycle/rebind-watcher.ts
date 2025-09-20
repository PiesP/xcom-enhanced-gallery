/**
 * @fileoverview RebindWatcher - SPA DOM 교체 시 컨테이너 분실 감지 및 재바인드 도우미
 */

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

  constructor(private readonly options: RebindWatcherOptions) {}

  start(): void {
    if (this.observer || this.disposed) return;
    const root = this.options.root ?? document.body;
    if (!root) return;

    this.observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        // 제거된 노드에 대상이 포함되어 있는지 확인
        for (const removed of Array.from(m.removedNodes)) {
          if (this.options.isTargetNode(removed)) {
            this.scheduleRebind();
            return; // 한 번 감지하면 즉시 처리
          }
          // 하위 탐색 (얕은 탐색으로 충분)
          if (removed.hasChildNodes?.()) {
            const walker = document.createTreeWalker(removed as Node, NodeFilter.SHOW_ELEMENT);
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
      clearTimeout(this.rebindTimer);
      this.rebindTimer = null;
    }
    const delay = Math.min(Math.max(this.options.rebindDelayMs ?? 150, 0), 250);
    this.rebindTimer = setTimeout(() => {
      this.rebindTimer = null;
      void this.options.onContainerLost();
    }, delay) as unknown as number;
  }

  stop(): void {
    if (this.rebindTimer) {
      clearTimeout(this.rebindTimer);
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
