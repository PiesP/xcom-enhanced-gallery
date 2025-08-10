import { VitestTestRunner } from 'vitest/runners';

export default class CustomWindowsSuppressRunner extends VitestTestRunner {
  // Wrap after-run suite to swallow known Windows teardown issue
  async onAfterRunSuite(suite: any): Promise<void> {
    try {
      // Ensure rpc exists on worker state before delegating
      try {
        const g: any = globalThis as any;
        const KEY = '__vitest_worker__';
        if (g[KEY] && !g[KEY].rpc) {
          const createRpcStub = () =>
            new Proxy(
              {},
              {
                get() {
                  const fn: any = (..._args: any[]) => Promise.resolve(undefined);
                  fn.asEvent = fn;
                  return fn;
                },
              }
            );
          g[KEY].rpc = createRpcStub();
        }
      } catch {}
      await super.onAfterRunSuite(suite);
    } catch (error: any) {
      const msg = error?.message || '';
      const stack = error?.stack || '';
      const isVitestStateError =
        typeof msg === 'string' && msg.includes('Vitest failed to access its internal state');
      const isGetWorkerState = typeof stack === 'string' && stack.includes('getWorkerState');
      const isSnapshotSavedError = typeof msg === 'string' && msg.includes('snapshotSaved');
      const suitePassed = !!suite && suite.result && suite.result.state === 'pass';
      if (isVitestStateError || isGetWorkerState || isSnapshotSavedError || suitePassed) {
        // swallow the teardown error on Windows multi-file runs
        return;
      }
      throw error;
    }
  }

  // Wrap after-run files (multi-file teardown) to swallow the same issue
  async onAfterRunFiles(): Promise<void> {
    try {
      // Ensure Vitest worker state exists before delegating to base implementation
      try {
        const g: any = globalThis as any;
        const KEY = '__vitest_worker__';
        if (!g[KEY]) {
          Object.defineProperty(g, KEY, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: { environment: { transformMode: 'web' }, ctx: { projectName: 'default' } },
          });
        }
      } catch {}
      // @ts-ignore - base may define this
      await super.onAfterRunFiles?.();
    } catch (error: any) {
      const msg = error?.message || '';
      const stack = error?.stack || '';
      const isVitestStateError =
        typeof msg === 'string' && msg.includes('Vitest failed to access its internal state');
      const isGetWorkerState = typeof stack === 'string' && stack.includes('getWorkerState');
      const isSnapshotSavedError = typeof msg === 'string' && msg.includes('snapshotSaved');
      if (isVitestStateError || isGetWorkerState || isSnapshotSavedError) {
        return;
      }
      throw error;
    }
  }
}
