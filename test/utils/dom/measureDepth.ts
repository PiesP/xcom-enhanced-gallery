// 테스트 전용 DOM depth 측정 유틸리티
// root 포함 depth 반환 (target == root 이면 1)
export function measureDepth(root: Element, target: Element): number {
  let depth = 0;
  let cur: Element | null = target;
  while (cur && cur !== root) {
    depth++;
    cur = cur.parentElement;
  }
  if (cur === root) return depth + 1; // root 포함
  return -1; // root 경로에 속하지 않음
}

export function queryRequired<T extends Element>(selector: string, parent?: ParentNode): T {
  const root: ParentNode = parent || (globalThis as any).document;
  if (!root) throw new Error('document not available in this environment');
  const el = root.querySelector(selector) as T | null;
  if (!el) throw new Error(`Required element not found: ${selector}`);
  return el;
}
