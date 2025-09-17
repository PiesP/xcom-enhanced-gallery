import { describe, it, expect } from 'vitest';
import { getPreact } from '@shared/external/vendors';
import { useToolbarState } from '@shared/hooks/useToolbarState';

const { h, render } = getPreact();

function TestComponent({ events }: { events: Array<ToolbarActionsEvent> }) {
  const [state, actions] = useToolbarState();
  // record actions identity for each render
  events.push({ actions });
  return h('div', { 'data-state': state.isDownloading ? 'downloading' : 'idle' });
}

type ToolbarActionsEvent = { actions: ReturnType<typeof useToolbarState>[1] };

describe('useToolbarState', () => {
  it('returns stable actions identity across state updates', async () => {
    const events: Array<ToolbarActionsEvent> = [];
    const container = document.createElement('div');
    const vnode = h(TestComponent as any, { events });
    render(vnode as any, container);

    // First render
    const firstActions = events[0].actions;
    expect(firstActions).toBeDefined();

    // Trigger a few state updates via actions
    firstActions.setLoading(true);
    firstActions.setLoading(false);
    firstActions.setCurrentFitMode('fitHeight');

    // Re-render to flush updates
    render(vnode as any, container);

    const lastActions = events[events.length - 1].actions;
    expect(lastActions).toBe(firstActions);
  });
});
