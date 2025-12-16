import type { HttpMethod, HttpResponseType, NavigateMode } from '@core/cmd';
import type { DomFacts, DomFactsKind } from '@core/dom-facts';

export type RuntimeEvent =
  | { readonly type: 'Booted'; readonly url: string; readonly now: number }
  | { readonly type: 'Tick'; readonly tickId: string; readonly now: number }
  | {
      readonly type: 'HttpRequested';
      readonly url: string;
      readonly method: HttpMethod;
      readonly responseType: HttpResponseType;
      readonly headers?: Readonly<Record<string, string>>;
      readonly body?: string;
      readonly now: number;
    }
  | {
      readonly type: 'NavigateRequested';
      readonly url: string;
      readonly mode: NavigateMode;
      readonly target?: '_self' | '_blank';
      readonly now: number;
    }
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
      readonly type: 'HttpCompleted';
      readonly requestId: string;
      readonly url: string;
      readonly status: number;
      readonly body: unknown;
      readonly now: number;
    }
  | {
      readonly type: 'HttpFailed';
      readonly requestId: string;
      readonly url: string;
      readonly error: string;
      readonly now: number;
    }
  | {
      readonly type: 'NavigateCompleted';
      readonly requestId: string;
      readonly url: string;
      readonly now: number;
    }
  | {
      readonly type: 'NavigateFailed';
      readonly requestId: string;
      readonly url: string;
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
