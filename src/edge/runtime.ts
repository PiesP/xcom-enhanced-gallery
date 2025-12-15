import type { RuntimeCommand } from '@core/cmd';
import type { RuntimeEvent } from '@core/events';
import { createInitialModel, type RuntimeModel } from '@core/model';
import { formatErrorMessage } from '@core/policy';
import { update } from '@core/update';
import { log } from '@edge/adapters/logger';
import { createTickScheduler, type TickScheduler } from '@edge/adapters/scheduler';
import { storeGet, storeSet } from '@edge/adapters/storage';
import { takeDomFacts } from '@edge/dom-facts';

export interface CommandRuntimeHandle {
  dispatch(event: RuntimeEvent): void;
  stop(): void;
  getModel(): RuntimeModel;
}

export interface CommandRuntimeDeps {
  now?: () => number;
  getUrl?: () => string;
  adapters?: {
    log?: typeof log;
    takeDomFacts?: typeof takeDomFacts;
    storeGet?: typeof storeGet;
    storeSet?: typeof storeSet;
    scheduler?: TickScheduler;
  };
}

export function startCommandRuntime(deps: CommandRuntimeDeps = {}): CommandRuntimeHandle {
  const now = deps.now ?? (() => Date.now());
  const getUrl = deps.getUrl ?? (() => (typeof window !== 'undefined' ? window.location.href : ''));

  const runtimeLog = deps.adapters?.log ?? log;
  const runtimeTakeDomFacts = deps.adapters?.takeDomFacts ?? takeDomFacts;
  const runtimeStoreGet = deps.adapters?.storeGet ?? storeGet;
  const runtimeStoreSet = deps.adapters?.storeSet ?? storeSet;
  const scheduler = deps.adapters?.scheduler ?? createTickScheduler();

  let model: RuntimeModel = createInitialModel();
  const queue: RuntimeEvent[] = [];
  let processing = false;
  let drainScheduled = false;
  let stopped = false;

  const scheduleMicrotask = (fn: () => void): void => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(fn);
    } else {
      void Promise.resolve().then(fn);
    }
  };

  const requestDrain = (): void => {
    if (stopped || drainScheduled) return;
    drainScheduled = true;
    scheduleMicrotask(() => {
      drainScheduled = false;
      void processQueue();
    });
  };

  const dispatch = (event: RuntimeEvent): void => {
    if (stopped) return;
    queue.push(event);
    if (processing) {
      requestDrain();
    } else {
      void processQueue();
    }
  };

  const interpret = async (cmd: RuntimeCommand): Promise<void> => {
    switch (cmd.type) {
      case 'LOG':
        runtimeLog(cmd.level, cmd.message, cmd.context);
        return;

      case 'TAKE_DOM_FACTS': {
        try {
          const facts = runtimeTakeDomFacts(cmd.kind);
          dispatch({ type: 'DomFactsReady', requestId: cmd.requestId, facts, now: now() });
        } catch (error) {
          dispatch({
            type: 'DomFactsFailed',
            requestId: cmd.requestId,
            kind: cmd.kind,
            error: formatErrorMessage(error),
            now: now(),
          });
        }
        return;
      }

      case 'STORE_GET': {
        try {
          const value = await runtimeStoreGet(cmd.key);
          dispatch({
            type: 'StorageLoaded',
            requestId: cmd.requestId,
            key: cmd.key,
            value,
            now: now(),
          });
        } catch (error) {
          dispatch({
            type: 'StorageFailed',
            requestId: cmd.requestId,
            key: cmd.key,
            error: formatErrorMessage(error),
            now: now(),
          });
        }
        return;
      }

      case 'STORE_SET': {
        try {
          await runtimeStoreSet(cmd.key, cmd.value);
          dispatch({
            type: 'StorageSetCompleted',
            requestId: cmd.requestId,
            key: cmd.key,
            now: now(),
          });
        } catch (error) {
          dispatch({
            type: 'StorageSetFailed',
            requestId: cmd.requestId,
            key: cmd.key,
            error: formatErrorMessage(error),
            now: now(),
          });
        }
        return;
      }

      case 'SCHEDULE_TICK': {
        scheduler.schedule(cmd.id, cmd.intervalMs, () => {
          dispatch({ type: 'Tick', tickId: cmd.id, now: now() });
        });
        return;
      }

      case 'CANCEL_TICK': {
        scheduler.cancel(cmd.id);
        return;
      }

      default:
        return;
    }
  };

  const processQueue = async (): Promise<void> => {
    if (processing || stopped) return;
    processing = true;

    try {
      while (queue.length > 0 && !stopped) {
        const event = queue.shift();
        if (!event) continue;

        const result = update(model, event);
        model = result.model;

        for (const cmd of result.cmds) {
          // Keep command execution sequential to preserve deterministic behavior.
          // If we later need concurrency, it should be expressed explicitly in Cmd/Event.
          await interpret(cmd);
        }
      }
    } finally {
      processing = false;

      // Guarantee forward progress even if events were enqueued while we were processing.
      // (JS is single-threaded, but external callers can enqueue events at any time between drains.)
      if (queue.length > 0 && !stopped) {
        requestDrain();
      }
    }
  };

  dispatch({ type: 'Booted', url: getUrl(), now: now() });

  return {
    dispatch,
    stop() {
      stopped = true;
      scheduler.cancelAll();
      queue.length = 0;
    },
    getModel() {
      return model;
    },
  };
}
