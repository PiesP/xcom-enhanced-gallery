import type { CommandRuntimeHandle } from '@edge/runtime';
import { startCommandRuntime } from '@edge/runtime';

let runtime: CommandRuntimeHandle | null = null;

export function startDevCommandRuntime(): () => void {
  if (!runtime) {
    runtime = startCommandRuntime();
  }

  return () => {
    runtime?.stop();
    runtime = null;
  };
}
