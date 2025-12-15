import type { RuntimeCommand } from '@core/cmd';
import type { RuntimeEvent } from '@core/events';
import { createInitialModel, type RuntimeModel } from '@core/model';
import { formatErrorMessage } from '@core/policy';
import { update } from '@core/update';
import { log } from '@edge/adapters/logger';
import { createTickScheduler } from '@edge/adapters/scheduler';
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
}

export function startCommandRuntime(deps: CommandRuntimeDeps = {}): CommandRuntimeHandle {
  const now = deps.now ?? (() => Date.now());
  const getUrl = deps.getUrl ?? (() => (typeof window !== 'undefined' ? window.location.href : ''));

  const scheduler = createTickScheduler();

  let model: RuntimeModel = createInitialModel();
  const queue: RuntimeEvent[] = [];
  let processing = false;
  let stopped = false;

  const dispatch = (event: RuntimeEvent): void => {
    if (stopped) return;
    queue.push(event);
    void processQueue();
  };

  const interpret = async (cmd: RuntimeCommand): Promise<void> => {
    switch (cmd.type) {
      case 'LOG':
        log(cmd.level, cmd.message, cmd.context);
        return;

      case 'TAKE_DOM_FACTS': {
        try {
          const facts = takeDomFacts(cmd.kind);
          dispatch({ type: 'DomFactsReady', requestId: cmd.requestId, facts, now: now() });
        } catch (error) {
          log('warn', '[command-runtime] TAKE_DOM_FACTS failed', {
            requestId: cmd.requestId,
            error: formatErrorMessage(error),
          });
        }
        return;
      }

      case 'STORE_GET': {
        try {
          const value = await storeGet(cmd.key);
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
          await storeSet(cmd.key, cmd.value);
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
