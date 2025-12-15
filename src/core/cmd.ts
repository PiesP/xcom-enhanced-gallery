import type { DomFactsKind } from '@core/dom-facts';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type RuntimeCommand =
  | {
      readonly type: 'TAKE_DOM_FACTS';
      readonly requestId: string;
      readonly kind: DomFactsKind;
    }
  | {
      readonly type: 'STORE_GET';
      readonly requestId: string;
      readonly key: string;
    }
  | {
      readonly type: 'STORE_SET';
      readonly requestId: string;
      readonly key: string;
      readonly value: unknown;
    }
  | {
      readonly type: 'LOG';
      readonly level: LogLevel;
      readonly message: string;
      readonly context?: Readonly<Record<string, unknown>>;
    }
  | {
      readonly type: 'SCHEDULE_TICK';
      readonly id: string;
      readonly intervalMs: number;
    }
  | { readonly type: 'CANCEL_TICK'; readonly id: string };
