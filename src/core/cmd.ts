import type { DomFactsKind } from '@core/dom-facts';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type HttpResponseType = 'json' | 'text';

export type NavigateMode = 'assign' | 'open';

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
      readonly type: 'HTTP_REQUEST';
      readonly requestId: string;
      readonly url: string;
      readonly method: HttpMethod;
      readonly headers?: Readonly<Record<string, string>>;
      readonly body?: string;
      readonly responseType: HttpResponseType;
    }
  | {
      readonly type: 'NAVIGATE';
      readonly requestId: string;
      readonly url: string;
      readonly mode: NavigateMode;
      readonly target?: '_self' | '_blank';
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
