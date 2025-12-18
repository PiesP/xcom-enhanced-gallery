/**
 * @deprecated Preload bootstrap was removed to reduce shipped code size.
 * This module remains as a no-op for backward compatibility with internal imports.
 */

type ChunkLoader = () => Promise<unknown>;

export type PreloadTask = Readonly<{
  label: string;
  loader: ChunkLoader;
}>;

export type PreloadDependencies = Readonly<{
  logWarn: (message: string, error: unknown) => void;
}>;

export async function executePreloadStrategy(
  _tasks: readonly PreloadTask[] = [],
  _deps?: PreloadDependencies
): Promise<void> {
  // no-op
}
