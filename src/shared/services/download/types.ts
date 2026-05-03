/**
 * Shared download type definitions.
 */

export interface OrchestratorItem {
  readonly url: string;
  readonly desiredName: string;
  readonly blob?: Blob | Promise<Blob> | undefined;
}

export interface OrchestratorOptions {
  concurrency?: number;
  retries?: number;
  signal?: AbortSignal;
  onProgress?: (progress: {
    phase: string;
    current: number;
    total: number;
    percentage: number;
    filename?: string;
  }) => void;
}
