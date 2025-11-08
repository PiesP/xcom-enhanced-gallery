# Hook Utilities

**Phase 350**: Collection of reusable hook utilities

## 📦 Overview

Abstracts commonly used patterns in Solid.js-based projects into shared
utilities.

- **Observer Management**: IntersectionObserver, MutationObserver,
  ResizeObserver
- **Timer Management**: Automatic cleanup, debounce, retry patterns
- **Signal Helpers**: Type-safe state updates

## 🚀 Quick Start

```typescript
import {
  createManagedIntersectionObserver,
  createTimerGroup,
  updatePartial,
} from '@shared/utils/hooks';

// Observer automatic management
const observer = createManagedIntersectionObserver(
  entries => {
    entries.forEach(entry => {
      console.log('Visible:', entry.isIntersecting);
    });
  },
  { threshold: 0.5 }
);

observer.observe(element);
// cleanup
observer.disconnect();

// Timer group management
const timers = createTimerGroup();
timers.setTimeout(() => console.log('A'), 1000);
timers.setInterval(() => console.log('B'), 500);
// cleanup
timers.cancelAll();

// Signal state update
const [state, setState] = createSignal({ count: 0, name: 'John' });
updatePartial(setState, { count: 5 });
```

## 📚 API 문서

### Observer Lifecycle

#### `createManagedIntersectionObserver`

Automatically manages IntersectionObserver.

```typescript
const observer = createManagedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
  }
): ManagedObserver<'intersection'>
```

**Return value**:

- `observer`: IntersectionObserver instance
- `targets`: Set<Element> - Elements being observed
- `observe(target)`: Start observing element
- `unobserve(target)`: Stop observing specific element
- `disconnect()`: Stop all observations and cleanup
- `isActive()`: Check if active

**Features**:

- ✅ Automatic target management (duplicate prevention)
- ✅ Type-safe
- ✅ Simple cleanup

#### `createManagedMutationObserver`

Automatically manages MutationObserver.

```typescript
const observer = createManagedMutationObserver(
  callback: MutationCallback,
  options?: {
    childList?: boolean;
    subtree?: boolean;
    attributes?: boolean;
    attributeFilter?: string[];
    characterData?: boolean;
  }
): ManagedObserver<'mutation'>
```

#### `createManagedResizeObserver`

Automatically manages ResizeObserver.

```typescript
const observer = createManagedResizeObserver(
  callback: ResizeObserverCallback,
  options?: { box?: ResizeObserverBoxOptions }
): ManagedObserver<'resize'>
```

#### `createObserverGroup`

Manages multiple observers as a group.

```typescript
const group = createObserverGroup();
group.add(intersectionObserver);
group.add(mutationObserver);
// Bulk cleanup
group.disconnectAll();
```

---

### Timer Cleanup

#### `createManagedTimeout`

Auto-cleanup setTimeout.

```typescript
const timer = createManagedTimeout(
  callback: () => void,
  delay: number
): ManagedTimer

// Manual cancel
timer.cancel();
// Check status
timer.isActive(); // boolean
```

#### `createManagedInterval`

Auto-cleanup setInterval.

```typescript
const timer = createManagedInterval(
  callback: () => void,
  interval: number
): ManagedTimer
```

#### `createTimerGroup`

Manages multiple timers as a group.

```typescript
const group = createTimerGroup();
const timer1 = group.setTimeout(() => {
  /*...*/
}, 1000);
const timer2 = group.setInterval(() => {
  /*...*/
}, 500);

// Bulk cancel
group.cancelAll();

// Check active timers
group.getActiveCount(); // number
```

#### `createDebouncedFunction`

Implements debounce pattern easily.

```typescript
const debouncedFn = createDebouncedFunction(
  () => console.log('Debounced!'),
  300
);

debouncedFn(); // Executes after 300ms
debouncedFn(); // Cancels previous timer, starts new 300ms

// cleanup
debouncedFn.cancel();
```

#### `retryWithBackoff`

Retry logic using exponential backoff.

```typescript
const result = await retryWithBackoff(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffFactor: 2,
  }
);
```

---

### Signal State Helpers

#### `updatePartial`

Updates only some fields of an object signal.

```typescript
const [state, setState] = createSignal({ count: 0, name: 'John' });
updatePartial(setState, { count: 5 });
// { count: 5, name: 'John' }
```

#### `mergeDeep`

Merges nested objects deeply.

```typescript
const [state, setState] = createSignal({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' },
});

mergeDeep(setState, {
  user: { age: 31 },
  settings: { fontSize: 14 },
});
// user: { name: 'John', age: 31 }, settings: { theme: 'dark', fontSize: 14 }
```

#### `resetToInitial`

Resets signal to initial value.

```typescript
const initialState = { count: 0 };
const [state, setState] = createSignal(initialState);

setState({ count: 10 });
resetToInitial(setState, initialState);
// { count: 0 }
```

#### `updateIf`

Updates state only when condition is true.

```typescript
const [count, setCount] = createSignal(0);
const updated = updateIf(
  setCount,
  () => count(),
  current => current < 10,
  prev => prev + 1
);
// Increment only if count < 10, return value: boolean
```

#### Boolean Helpers

```typescript
const [isOpen, setIsOpen] = createSignal(false);
toggle(setIsOpen); // true
```

#### Number Helpers

```typescript
const [count, setCount] = createSignal(0);
increment(setCount, 5); // 5
decrement(setCount, 2); // 3
```

#### Array Helpers

```typescript
const [items, setItems] = createSignal<number[]>([]);

// Add
pushItem(setItems, 1, 2, 3); // [1, 2, 3]

// Filter
filterItems(setItems, x => x % 2 === 0); // [2]

// Map
mapItems(setItems, x => x * 2); // [4]

// Index-based update
updateItemAt(setItems, () => items(), 0, 10); // [10]

// Index-based remove
removeItemAt(setItems, () => items(), 0); // []
```

#### Batch Update

```typescript
import { getSolid } from '@shared/external/vendors';
const { batch } = getSolid();

const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('');

batchUpdate(batch, () => {
  setCount(10);
  setName('John');
});
// Single rendering cycle
```

---

## 🎯 Use Cases

### Case 1: Intersection Observer Hook

```typescript
import { getSolid } from '@shared/external/vendors';
import { createManagedIntersectionObserver } from '@shared/utils/hooks';

export function useIntersectionObserver(
  target: () => Element | null,
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
) {
  const { onCleanup } = getSolid();

  const observer = createManagedIntersectionObserver(entries => {
    entries.forEach(entry => callback(entry.isIntersecting));
  }, options);

  const targetEl = target();
  if (targetEl) {
    observer.observe(targetEl);
  }

  onCleanup(() => observer.disconnect());

  return { observer };
}
```

### Case 2: Debounced Input Hook

```typescript
import { getSolid } from '@shared/external/vendors';
import { createDebouncedFunction } from '@shared/utils/hooks';

export function useDebouncedInput(
  onInput: (value: string) => void,
  delay = 300
) {
  const { onCleanup } = getSolid();

  const debouncedFn = createDebouncedFunction(onInput, delay);

  onCleanup(() => debouncedFn.cancel());

  return { handleInput: debouncedFn };
}
```

### Case 3: Timer-based Polling Hook

```typescript
import { getSolid } from '@shared/external/vendors';
import { createTimerGroup } from '@shared/utils/hooks';

export function usePolling(
  pollFn: () => void,
  interval: number,
  enabled = true
) {
  const { onCleanup } = getSolid();
  const timers = createTimerGroup();

  if (enabled) {
    timers.setInterval(pollFn, interval);
  }

  onCleanup(() => timers.cancelAll());

  return { timers };
}
```

---

## 📊 Performance Characteristics

| Utility      | Overhead | Memory | Recommended |
| ------------ | -------- | ------ | ----------- |
| Observer     | Minimal  | ~1KB   | Always      |
| Timer        | Minimal  | ~500B  | Always      |
| Signal       | None     | 0      | Always      |
| Observer Grp | Minimal  | ~2KB   | 3+          |
| Timer Grp    | Minimal  | ~1KB   | 5+          |

---

## 🔧 Development Guide

### When Adding New Utilities

1. **Single Responsibility**: Only one responsibility
2. **Type Safety**: Explicit types for all params and returns
3. **Error Handling**: Appropriate error messages and logging
4. **Documentation**: JSDoc comments required
5. **Testing**: Write unit tests

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createManagedTimeout } from '@shared/utils/hooks';

describe('createManagedTimeout', () => {
  it('should create a managed timer', () => {
    let executed = false;
    const timer = createManagedTimeout(() => {
      executed = true;
    }, 100);

    expect(timer.isActive()).toBe(true);
    timer.cancel();
    expect(timer.isActive()).toBe(false);
  });
});
```

---

## 🚫 Anti-patterns

### ❌ Direct Observer Creation

```typescript
// ❌ Bad
const observer = new IntersectionObserver(/*...*/);
observer.observe(element);
// cleanup risk

// ✅ Good
const observer = createManagedIntersectionObserver(/*...*/);
observer.observe(element);
observer.disconnect(); // Explicit cleanup
```

### ❌ Manual Timer Management

```typescript
// ❌ Bad
const timerId = setTimeout(/*...*/);
const intervalId = setInterval(/*...*/);
// Cleanup complexity

// ✅ Good
const timers = createTimerGroup();
timers.setTimeout(/*...*/);
timers.setInterval(/*...*/);
timers.cancelAll(); // Bulk cleanup
```

### ❌ Repetitive Signal Updates

```typescript
// ❌ Bad
setter(prev => ({ ...prev, field1: value1 }));
setter(prev => ({ ...prev, field2: value2 }));

// ✅ Good
updatePartial(setter, { field1: value1, field2: value2 });
```

---

## 📝 Changelog

### v1.0.0 (Phase 350)

- ✨ Initial release
- 🎯 Observer management (3 types)
- ⏱️ Timer management (5 functions)
- 🎨 Signal helpers (15 functions)
- 📦 Barrel export structure

---

## 🤝 Contributing

When adding new utilities:

1. Create file in `src/shared/utils/hooks/`
2. Write type definitions and JSDoc
3. Add export to `index.ts`
4. Write unit tests (`test/unit/shared/utils/hooks/`)
5. Update this README

---

## 📚 Related Documentation

- [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) - Overall architecture
- [CODING_GUIDELINES.md](../../../docs/CODING_GUIDELINES.md) - Coding standards
- [Phase 329 Event System](../events/README.md) - Event system reference
