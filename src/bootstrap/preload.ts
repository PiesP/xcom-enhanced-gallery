import { logger } from '@shared/logging';

type ChunkLoader = () => Promise<unknown>;

export type PreloadTask = Readonly<{
  label: string;
  loader: ChunkLoader;
}>;

export type PreloadDependencies = Readonly<{
  logWarn: (message: string, error: unknown) => void;
}>;

const PRELOAD_TASKS: readonly PreloadTask[] = Object.freeze([
  {
    label: 'gallery core',
    loader: () => import('@features/gallery'),
  },
]);

const debug = import.meta.env.DEV ? (message: string) => logger.debug(message) : () => {};

const DEFAULT_PRELOAD_DEPENDENCIES: PreloadDependencies = Object.freeze({
  logWarn: (message: string, error: unknown) => {
    logger.warn(message, error);
  },
});

async function runPreloadTask(task: PreloadTask, deps: PreloadDependencies): Promise<void> {
  debug(`[preload] loading ${task.label}`);

  try {
    await task.loader();
    debug(`[preload] ${task.label} ready`);
  } catch (error) {
    deps.logWarn(`[preload] ${task.label} preload failed`, error);
  }
}

/**
 * Execute minimal preload strategy for essential chunks.
 * Tasks run sequentially to avoid racing the timeline or user interactions.
 */
export async function executePreloadStrategy(
  tasks: readonly PreloadTask[] = PRELOAD_TASKS,
  deps: PreloadDependencies = DEFAULT_PRELOAD_DEPENDENCIES
): Promise<void> {
  for (const task of tasks) {
    await runPreloadTask(task, deps);
  }
}
