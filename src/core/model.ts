import type { DomFacts } from '@core/dom-facts';

interface InFlightRequest {
  readonly purpose: 'domFacts' | 'storageGet' | 'storageSet' | 'httpRequest' | 'navigate';
  readonly startedAt: number;
}

export interface RuntimeModel {
  readonly url?: string;
  readonly requestSeq: number;
  readonly inFlight: Readonly<Record<string, InFlightRequest>>;
  readonly cache: Readonly<Record<string, unknown>>;
  readonly lastFacts?: DomFacts;
  readonly schedule: {
    readonly tickId?: string;
    readonly tickEveryMs?: number;
  };
}

export function createInitialModel(): RuntimeModel {
  return {
    requestSeq: 0,
    inFlight: {},
    cache: {},
    schedule: {},
  };
}
