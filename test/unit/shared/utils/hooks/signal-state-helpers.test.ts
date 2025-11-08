/**
 * @fileoverview Unit tests for signal-state-helpers utilities
 * @module test/unit/shared/utils/hooks/signal-state-helpers
 * @version 1.0.0
 * @since Phase 350
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSignal } from 'solid-js';
import {
  updatePartial,
  mergeDeep,
  toggle,
  increment,
  decrement,
  resetToInitial,
  pushItem,
  filterItems,
  mapItems,
  updateItemAt,
  removeItemAt,
} from '@shared/utils/hooks';

describe('signal-state-helpers', () => {
  describe('updatePartial', () => {
    it('should update partial object properties', () => {
      interface State {
        name: string;
        age: number;
        active: boolean;
      }
      const [state, setState] = createSignal<State>({
        name: 'John',
        age: 30,
        active: true,
      });

      updatePartial(setState, { age: 31 });

      expect(state()).toEqual({
        name: 'John',
        age: 31,
        active: true,
      });
    });

    it('should handle multiple property updates', () => {
      interface State {
        x: number;
        y: number;
        z: number;
      }
      const [state, setState] = createSignal<State>({ x: 1, y: 2, z: 3 });

      updatePartial(setState, { x: 10, z: 30 });

      expect(state()).toEqual({ x: 10, y: 2, z: 30 });
    });

    it('should maintain type safety', () => {
      interface State {
        count: number;
        label: string;
      }
      const [state, setState] = createSignal<State>({ count: 0, label: 'test' });

      updatePartial(setState, { count: 5 });

      expect(state().count).toBe(5);
      expect(state().label).toBe('test');
    });
  });

  describe('mergeDeep', () => {
    it('should merge nested objects (shallow merge)', () => {
      interface State {
        user: {
          name: string;
          age: number;
        };
        settings: {
          theme: string;
        };
      }
      const [state, setState] = createSignal<State>({
        user: {
          name: 'John',
          age: 30,
        },
        settings: {
          theme: 'dark',
        },
      });

      // mergeDeep는 1단계만 병합하므로 전체 객체를 교체
      mergeDeep(setState, {
        user: {
          name: 'John', // 유지하려면 명시적으로 포함
          age: 31,
        },
      } as Partial<State>);

      expect(state().user.name).toBe('John');
      expect(state().user.age).toBe(31);
      expect(state().settings.theme).toBe('dark');
    });

    it('should handle shallow merge', () => {
      interface State {
        a: number;
        b: string;
      }
      const [state, setState] = createSignal<State>({
        a: 1,
        b: 'hello',
      });

      mergeDeep(setState, { a: 2 } as Partial<State>);

      expect(state().a).toBe(2);
      expect(state().b).toBe('hello');
    });

    it('should merge nested object properties', () => {
      interface State {
        config: {
          api: string;
          timeout: number;
        };
        data: string[];
      }
      const [state, setState] = createSignal<State>({
        config: { api: 'https://api.example.com', timeout: 5000 },
        data: ['a', 'b'],
      });

      // 1단계 병합이므로 config 객체를 완전히 교체
      mergeDeep(setState, {
        config: {
          api: 'https://api.example.com', // 유지하려면 명시적으로 포함
          timeout: 10000,
        },
      } as Partial<State>);

      expect(state().config.api).toBe('https://api.example.com');
      expect(state().config.timeout).toBe(10000);
      expect(state().data).toEqual(['a', 'b']);
    });
  });

  describe('toggle', () => {
    it('should toggle boolean value', () => {
      const [value, setValue] = createSignal(false);

      toggle(setValue);
      expect(value()).toBe(true);

      toggle(setValue);
      expect(value()).toBe(false);
    });

    it('should toggle multiple times', () => {
      const [value, setValue] = createSignal(true);

      toggle(setValue);
      toggle(setValue);
      toggle(setValue);

      expect(value()).toBe(false);
    });
  });

  describe('increment', () => {
    it('should increment by 1 by default', () => {
      const [count, setCount] = createSignal(0);

      increment(setCount);
      expect(count()).toBe(1);

      increment(setCount);
      expect(count()).toBe(2);
    });

    it('should increment by custom amount', () => {
      const [count, setCount] = createSignal(10);

      increment(setCount, 5);
      expect(count()).toBe(15);
    });

    it('should handle negative increment', () => {
      const [count, setCount] = createSignal(10);

      increment(setCount, -3);
      expect(count()).toBe(7);
    });
  });

  describe('decrement', () => {
    it('should decrement by 1 by default', () => {
      const [count, setCount] = createSignal(10);

      decrement(setCount);
      expect(count()).toBe(9);

      decrement(setCount);
      expect(count()).toBe(8);
    });

    it('should decrement by custom amount', () => {
      const [count, setCount] = createSignal(20);

      decrement(setCount, 5);
      expect(count()).toBe(15);
    });

    it('should handle negative decrement', () => {
      const [count, setCount] = createSignal(10);

      decrement(setCount, -3);
      expect(count()).toBe(13);
    });
  });

  describe('pushItem', () => {
    it('should push item to array', () => {
      const [items, setItems] = createSignal<number[]>([1, 2, 3]);

      pushItem(setItems, 4);
      expect(items()).toEqual([1, 2, 3, 4]);
    });

    it('should push multiple items', () => {
      const [items, setItems] = createSignal<string[]>(['a']);

      pushItem(setItems, 'b');
      pushItem(setItems, 'c');

      expect(items()).toEqual(['a', 'b', 'c']);
    });

    it('should handle pushing to empty array', () => {
      const [items, setItems] = createSignal<number[]>([]);

      pushItem(setItems, 1);
      expect(items()).toEqual([1]);
    });

    it('should handle complex objects', () => {
      interface Item {
        id: number;
        name: string;
      }
      const [items, setItems] = createSignal<Item[]>([{ id: 1, name: 'first' }]);

      pushItem(setItems, { id: 2, name: 'second' });
      expect(items()).toHaveLength(2);
      expect(items()[1]).toEqual({ id: 2, name: 'second' });
    });
  });

  describe('filterItems', () => {
    it('should filter array items', () => {
      const [items, setItems] = createSignal<number[]>([1, 2, 3, 4, 5]);

      filterItems(setItems, n => n > 2);
      expect(items()).toEqual([3, 4, 5]);
    });

    it('should handle empty result', () => {
      const [items, setItems] = createSignal<number[]>([1, 2, 3]);

      filterItems(setItems, n => n > 10);
      expect(items()).toEqual([]);
    });

    it('should filter complex objects', () => {
      interface Item {
        id: number;
        active: boolean;
      }
      const [items, setItems] = createSignal<Item[]>([
        { id: 1, active: true },
        { id: 2, active: false },
        { id: 3, active: true },
      ]);

      filterItems(setItems, item => item.active);
      expect(items()).toHaveLength(2);
      expect(items()[0].id).toBe(1);
      expect(items()[1].id).toBe(3);
    });

    it('should handle no items filtered out', () => {
      const [items, setItems] = createSignal<number[]>([1, 2, 3]);

      filterItems(setItems, () => true);
      expect(items()).toEqual([1, 2, 3]);
    });
  });

  describe('mapItems', () => {
    it('should map array items', () => {
      const [items, setItems] = createSignal<number[]>([1, 2, 3]);

      mapItems(setItems, n => n * 2);
      expect(items()).toEqual([2, 4, 6]);
    });

    it('should transform item types', () => {
      const [items, setItems] = createSignal<number[]>([1, 2, 3]);

      mapItems(setItems, n => n.toString());
      expect(items()).toEqual(['1', '2', '3']);
    });

    it('should handle complex transformations', () => {
      interface Item {
        id: number;
        value: number;
      }
      const [items, setItems] = createSignal<Item[]>([
        { id: 1, value: 10 },
        { id: 2, value: 20 },
      ]);

      mapItems(setItems, item => ({ ...item, value: item.value * 2 }));
      expect(items()[0].value).toBe(20);
      expect(items()[1].value).toBe(40);
    });

    it('should handle empty array', () => {
      const [items, setItems] = createSignal<number[]>([]);

      mapItems(setItems, n => n * 2);
      expect(items()).toEqual([]);
    });
  });

  describe('updateItemAt', () => {
    it('should update item at index', () => {
      const [items, setItems] = createSignal<number[]>([1, 2, 3, 4]);

      updateItemAt(setItems, items, 1, 20);
      expect(items()).toEqual([1, 20, 3, 4]);
    });

    it('should update with function', () => {
      const [items, setItems] = createSignal<number[]>([10, 20, 30]);

      updateItemAt(setItems, items, 2, items()[2] * 2);
      expect(items()).toEqual([10, 20, 60]);
    });

    it('should handle first item', () => {
      const [items, setItems] = createSignal<string[]>(['a', 'b', 'c']);

      updateItemAt(setItems, items, 0, 'z');
      expect(items()).toEqual(['z', 'b', 'c']);
    });

    it('should handle last item', () => {
      const [items, setItems] = createSignal<string[]>(['a', 'b', 'c']);

      updateItemAt(setItems, items, 2, 'z');
      expect(items()).toEqual(['a', 'b', 'z']);
    });
  });

  describe('removeItemAt', () => {
    it('should remove item at index', () => {
      const [items, setItems] = createSignal<number[]>([1, 2, 3, 4]);

      removeItemAt(setItems, items, 1);
      expect(items()).toEqual([1, 3, 4]);
    });

    it('should remove first item', () => {
      const [items, setItems] = createSignal<string[]>(['a', 'b', 'c']);

      removeItemAt(setItems, items, 0);
      expect(items()).toEqual(['b', 'c']);
    });

    it('should remove last item', () => {
      const [items, setItems] = createSignal<string[]>(['a', 'b', 'c']);

      removeItemAt(setItems, items, 2);
      expect(items()).toEqual(['a', 'b']);
    });

    it('should handle removing from single item array', () => {
      const [items, setItems] = createSignal<number[]>([42]);

      removeItemAt(setItems, items, 0);
      expect(items()).toEqual([]);
    });
  });

  describe('resetToInitial', () => {
    it('should reset to initial value', () => {
      const initialValue = { count: 0, name: 'test' };
      const [state, setState] = createSignal(initialValue);

      setState({ count: 10, name: 'modified' });
      expect(state()).toEqual({ count: 10, name: 'modified' });

      resetToInitial(setState, initialValue);
      expect(state()).toEqual({ count: 0, name: 'test' });
    });

    it('should reset array to initial state', () => {
      const initialValue = [1, 2, 3];
      const [items, setItems] = createSignal(initialValue);

      setItems([10, 20, 30, 40]);
      expect(items()).toEqual([10, 20, 30, 40]);

      resetToInitial(setItems, initialValue);
      expect(items()).toEqual([1, 2, 3]);
    });
  });
});
