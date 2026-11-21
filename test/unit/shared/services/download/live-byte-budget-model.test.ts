// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { LiveByteBudget, type LiveByteLease } from '@shared/services/download/live-byte-budget';
import { expect, it } from 'vite-plus/test';

// Issued handles retain their slot after release so stale calls are observable.
// A live slot names an allocation by its original reserve slot.
type State = { owners: number[]; sizes: number[] };
type Action =
  | { op: 'reserve'; amount: number }
  | { op: 'fork' | 'release'; slot: number }
  | { op: 'shrink'; slot: number; amount: number };

const capacity = 2;
const slots = 3;
const empty = (): State => ({ owners: [], sizes: [] });

function usage(state: State): number {
  return [...new Set(state.owners.filter((id) => id >= 0))].reduce(
    (sum, id) => sum + state.sizes[id]!,
    0
  );
}

function* choices({ owners }: State): Generator<Action> {
  if (owners.length < slots) {
    for (const amount of [0, 1, 2, 3]) {
      yield { op: 'reserve', amount };
    }
  }
  for (const slot of owners.keys()) {
    if (owners.length < slots) {
      yield { op: 'fork', slot };
    }
    yield { op: 'release', slot };
    for (const amount of [0, 1, 2, 3]) {
      yield { op: 'shrink', slot, amount };
    }
  }
}

function predict(state: State, action: Action): State | string {
  const next = { owners: [...state.owners], sizes: [...state.sizes] };
  if (action.op === 'reserve') {
    if (usage(state) + action.amount > capacity) {
      return 'DownloadResourceLimitError';
    }
    next.sizes[next.owners.length] = action.amount;
    next.owners.push(next.owners.length);
    return next;
  }
  const allocation = state.owners[action.slot]!;
  if (action.op === 'release') {
    next.owners[action.slot] = -1;
    return next;
  }
  if (allocation === -1) {
    return 'Error';
  }
  if (action.op === 'fork') {
    next.owners.push(allocation);
  } else if (action.op === 'shrink') {
    if (action.amount > state.sizes[allocation]!) {
      return 'RangeError';
    }
    next.sizes[allocation] = action.amount;
  }
  return next;
}

function apply(budget: LiveByteBudget, handles: LiveByteLease[], action: Action): void {
  switch (action.op) {
    case 'reserve':
      handles.push(budget.reserve(action.amount));
      break;
    case 'fork':
      handles.push(handles[action.slot]!.fork());
      break;
    case 'shrink':
      handles[action.slot]!.shrink(action.amount);
      break;
    case 'release':
      handles[action.slot]!.release();
      break;
  }
}

it('matches distinct-allocation accounting on every reachable bounded model edge', () => {
  const queue: { state: State; path: Action[] }[] = [{ state: empty(), path: [] }];
  const seen = new Set([JSON.stringify(empty())]);
  let edges = 0;
  for (const { state, path } of queue) {
    for (const action of choices(state)) {
      const predicted = predict(state, action);
      const budget = new LiveByteBudget(capacity);
      const handles: LiveByteLease[] = [];
      for (const step of path) {
        apply(budget, handles, step);
      }
      const trace = JSON.stringify([...path, action]);
      let rejection: string | undefined;
      try {
        apply(budget, handles, action);
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }
        rejection = error.name;
      }
      expect(rejection, trace).toBe(typeof predicted === 'string' ? predicted : undefined);
      const after = typeof predicted === 'string' ? state : predicted;
      expect(budget.usedBytes, trace).toBe(usage(after));
      expect(budget.availableBytes, trace).toBe(capacity - usage(after));
      expect(
        handles.map((handle) => handle.bytes),
        trace
      ).toEqual(after.owners.map((id) => (id < 0 ? 0 : after.sizes[id])));
      edges++;
      const key = JSON.stringify(after);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ state: after, path: [...path, action] });
      }
    }
  }
  expect({ states: seen.size, edges }).toEqual({ states: 349, edges: 5236 });
});
