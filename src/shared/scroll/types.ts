/**
 * Scroll Coordinator 타입 정의 (초안)
 */

import type { Signal } from '@preact/signals';

export interface ScrollSnapshot {
  x: number;
  y: number;
  maxY: number;
  atTop: boolean;
  atBottom: boolean;
}

export type ScrollDirection = 'up' | 'down' | 'none';

export interface ScrollCoordinatorAPI {
  position: Signal<ScrollSnapshot>;
  direction: Signal<ScrollDirection>;
  idle: Signal<boolean>;
  progress: Signal<number>; // 0..1
  attach(target?: Window | HTMLElement): void;
  detach(): void;
  subscribe(cb: (snap: ScrollSnapshot) => void): () => void;
}
