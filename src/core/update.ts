import type { RuntimeCommand } from '@core/cmd';
import type { RuntimeEvent } from '@core/events';
import type { RuntimeModel } from '@core/model';
import { COMMAND_RUNTIME_DEFAULT_TICK_MS, COMMAND_RUNTIME_STORAGE_KEY } from '@core/policy';

export interface UpdateResult {
  readonly model: RuntimeModel;
  readonly cmds: readonly RuntimeCommand[];
}

function withRequestId(model: RuntimeModel, prefix: string): readonly [RuntimeModel, string] {
  const id = `${prefix}:${model.requestSeq}`;
  return [{ ...model, requestSeq: model.requestSeq + 1 }, id] as const;
}

function trackInFlight(
  model: RuntimeModel,
  requestId: string,
  purpose: 'domFacts' | 'storageGet' | 'storageSet',
  now: number
): RuntimeModel {
  return {
    ...model,
    inFlight: {
      ...model.inFlight,
      [requestId]: { purpose, startedAt: now },
    },
  };
}

function clearInFlight(model: RuntimeModel, requestId: string): RuntimeModel {
  const { [requestId]: _removed, ...rest } = model.inFlight;
  return { ...model, inFlight: rest };
}

export function update(model: RuntimeModel, event: RuntimeEvent): UpdateResult {
  switch (event.type) {
    case 'Booted': {
      const cmds: RuntimeCommand[] = [];
      let nextModel: RuntimeModel = { ...model, url: event.url };

      cmds.push({
        type: 'LOG',
        level: 'info',
        message: '[command-runtime] Booted',
        context: { url: event.url },
      });

      {
        const [m1, requestId] = withRequestId(nextModel, 'storeGet');
        nextModel = trackInFlight(m1, requestId, 'storageGet', event.now);
        cmds.push({ type: 'STORE_GET', requestId, key: COMMAND_RUNTIME_STORAGE_KEY });
      }

      {
        const [m1, requestId] = withRequestId(nextModel, 'domFacts');
        nextModel = trackInFlight(m1, requestId, 'domFacts', event.now);
        cmds.push({ type: 'TAKE_DOM_FACTS', requestId, kind: 'XComGallery' });
      }

      if (!nextModel.schedule.tickId) {
        const tickId = 'command-runtime:main';
        nextModel = {
          ...nextModel,
          schedule: { tickId, tickEveryMs: COMMAND_RUNTIME_DEFAULT_TICK_MS },
        };
        cmds.push({
          type: 'SCHEDULE_TICK',
          id: tickId,
          intervalMs: COMMAND_RUNTIME_DEFAULT_TICK_MS,
        });
      }

      return { model: nextModel, cmds };
    }

    case 'Tick': {
      const cmds: RuntimeCommand[] = [];
      let nextModel: RuntimeModel = model;

      const [m1, requestId] = withRequestId(nextModel, 'domFacts');
      nextModel = trackInFlight(m1, requestId, 'domFacts', event.now);
      cmds.push({ type: 'TAKE_DOM_FACTS', requestId, kind: 'XComGallery' });

      return { model: nextModel, cmds };
    }

    case 'DomFactsReady': {
      const cmds: RuntimeCommand[] = [];
      let nextModel: RuntimeModel = clearInFlight(model, event.requestId);

      nextModel = { ...nextModel, lastFacts: event.facts };

      cmds.push({
        type: 'LOG',
        level: 'debug',
        message: '[command-runtime] Dom facts updated',
        context: {
          requestId: event.requestId,
          kind: event.facts.kind,
          hasXegOverlay: event.facts.hasXegOverlay,
          hasXComMediaViewer: event.facts.hasXComMediaViewer,
          mediaElementsCount: event.facts.mediaElementsCount,
        },
      });

      {
        const [m1, requestId] = withRequestId(nextModel, 'storeSet');
        nextModel = trackInFlight(m1, requestId, 'storageSet', event.now);
        cmds.push({
          type: 'STORE_SET',
          requestId,
          key: COMMAND_RUNTIME_STORAGE_KEY,
          value: { lastFacts: event.facts, savedAt: event.now },
        });
      }

      return { model: nextModel, cmds };
    }

    case 'DomFactsFailed': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'warn',
            message: '[command-runtime] TAKE_DOM_FACTS failed',
            context: {
              requestId: event.requestId,
              kind: event.kind,
              error: event.error,
            },
          },
        ],
      };
    }

    case 'StorageLoaded': {
      const nextModel: RuntimeModel = {
        ...clearInFlight(model, event.requestId),
        cache: {
          ...model.cache,
          [event.key]: event.value,
        },
      };

      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'debug',
            message: '[command-runtime] Storage loaded',
            context: { requestId: event.requestId, key: event.key },
          },
        ],
      };
    }

    case 'StorageFailed': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'warn',
            message: '[command-runtime] Storage failed',
            context: { requestId: event.requestId, key: event.key, error: event.error },
          },
        ],
      };
    }

    case 'StorageSetCompleted': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'debug',
            message: '[command-runtime] Storage set completed',
            context: { requestId: event.requestId, key: event.key },
          },
        ],
      };
    }

    case 'StorageSetFailed': {
      const nextModel: RuntimeModel = clearInFlight(model, event.requestId);
      return {
        model: nextModel,
        cmds: [
          {
            type: 'LOG',
            level: 'warn',
            message: '[command-runtime] Storage set failed',
            context: { requestId: event.requestId, key: event.key, error: event.error },
          },
        ],
      };
    }

    default: {
      return { model, cmds: [] };
    }
  }
}
