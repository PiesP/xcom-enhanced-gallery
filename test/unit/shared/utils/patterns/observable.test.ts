/**
 * @fileoverview Tests for Observable pattern utilities
 */
import { Observable, ValueObservable } from "@shared/utils/patterns/observable";
import { describe, expect, it, vi } from "vitest";

describe("Observable", () => {
  describe("subscribe", () => {
    it("should add listener and return unsubscribe function", () => {
      const observable = new Observable<number>();
      const listener = vi.fn();

      const unsubscribe = observable.subscribe(listener);

      expect(observable.size).toBe(1);
      expect(observable.hasListeners).toBe(true);

      unsubscribe();

      expect(observable.size).toBe(0);
      expect(observable.hasListeners).toBe(false);
    });

    it("should allow multiple subscribers", () => {
      const observable = new Observable<number>();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      observable.subscribe(listener1);
      observable.subscribe(listener2);

      expect(observable.size).toBe(2);
    });
  });

  describe("notify", () => {
    it("should call all listeners with value", () => {
      const observable = new Observable<number>();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      observable.subscribe(listener1);
      observable.subscribe(listener2);

      observable.notify(42);

      expect(listener1).toHaveBeenCalledWith(42);
      expect(listener2).toHaveBeenCalledWith(42);
    });

    it("should not break other listeners if one throws", () => {
      const observable = new Observable<number>();
      const errorListener = vi.fn(() => {
        throw new Error("Listener error");
      });
      const normalListener = vi.fn();

      observable.subscribe(errorListener);
      observable.subscribe(normalListener);

      // Should not throw
      expect(() => observable.notify(42)).not.toThrow();
      expect(normalListener).toHaveBeenCalledWith(42);
    });
  });

  describe("clear", () => {
    it("should remove all listeners", () => {
      const observable = new Observable<number>();
      observable.subscribe(vi.fn());
      observable.subscribe(vi.fn());

      observable.clear();

      expect(observable.size).toBe(0);
      expect(observable.hasListeners).toBe(false);
    });
  });
});

describe("ValueObservable", () => {
  describe("initial value", () => {
    it("should store initial value", () => {
      const observable = new ValueObservable(42);
      expect(observable.value).toBe(42);
    });
  });

  describe("value setter", () => {
    it("should update value and notify listeners", () => {
      const observable = new ValueObservable(0);
      const listener = vi.fn();

      observable.subscribe(listener);
      observable.value = 42;

      expect(observable.value).toBe(42);
      expect(listener).toHaveBeenCalledWith(42);
    });
  });

  describe("update", () => {
    it("should update value if different and return true", () => {
      const observable = new ValueObservable(0);
      const listener = vi.fn();

      observable.subscribe(listener);
      const changed = observable.update(42);

      expect(changed).toBe(true);
      expect(observable.value).toBe(42);
      expect(listener).toHaveBeenCalledWith(42);
    });

    it("should not update if same value and return false", () => {
      const observable = new ValueObservable(42);
      const listener = vi.fn();

      observable.subscribe(listener);
      const changed = observable.update(42);

      expect(changed).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
