/**
 * Orchestrator Factory - MediaExtractionCache 주입 일관화
 */
import { MediaExtractionOrchestrator } from './MediaExtractionOrchestrator';
import { MediaExtractionCache, type MediaExtractionCacheOptions } from './MediaExtractionCache';

export interface OrchestratorFactoryOptions {
  cache?: MediaExtractionCache;
  cacheOptions?: MediaExtractionCacheOptions;
  sessionService?: { beginSession?: () => void };
  autoDispose?: boolean; // factory에서 disposeWith() 제공
}

export function createMediaExtractionOrchestrator(opts: OrchestratorFactoryOptions = {}) {
  const cache = opts.cache || new MediaExtractionCache(opts.cacheOptions);
  const orchestrator = new MediaExtractionOrchestrator(opts.sessionService, cache);
  if (opts.autoDispose) {
    type Disposable = { dispose?: () => void };
    (orchestrator as unknown as Disposable).dispose = () => {
      if (typeof cache.dispose === 'function') cache.dispose();
    };
  }
  return orchestrator;
}

export type { MediaExtractionCache };
