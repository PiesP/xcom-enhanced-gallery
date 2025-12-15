import type { DomFacts, DomFactsKind } from '@core/dom-facts';

export type RuntimeEvent =
  | { readonly type: 'Booted'; readonly url: string; readonly now: number }
  | { readonly type: 'Tick'; readonly tickId: string; readonly now: number }
  | {
      readonly type: 'DomFactsReady';
      readonly requestId: string;
      readonly facts: DomFacts;
      readonly now: number;
    }
  | {
      readonly type: 'DomFactsFailed';
      readonly requestId: string;
      readonly kind: DomFactsKind;
      readonly error: string;
      readonly now: number;
    }
  | {
      readonly type: 'StorageLoaded';
      readonly requestId: string;
      readonly key: string;
      readonly value: unknown;
      readonly now: number;
    }
  | {
      readonly type: 'StorageSetCompleted';
      readonly requestId: string;
      readonly key: string;
      readonly now: number;
    }
  | {
      readonly type: 'StorageSetFailed';
      readonly requestId: string;
      readonly key: string;
      readonly error: string;
      readonly now: number;
    }
  | {
      readonly type: 'StorageFailed';
      readonly requestId: string;
      readonly key: string;
      readonly error: string;
      readonly now: number;
    };
