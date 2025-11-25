/**
 * @fileoverview Tests for singleton pattern utilities
 */
import {
  createResettableSingleton,
  createSingleton,
} from "@shared/utils/patterns/singleton";
import { describe, expect, it, vi } from "vitest";

describe("createSingleton", () => {
  it("should create instance on first call", () => {
    const factory = vi.fn(() => ({ value: 42 }));
    const getInstance = createSingleton(factory);

    const instance = getInstance();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(instance.value).toBe(42);
  });

  it("should return same instance on subsequent calls", () => {
    const factory = vi.fn(() => ({ value: Math.random() }));
    const getInstance = createSingleton(factory);

    const instance1 = getInstance();
    const instance2 = getInstance();
    const instance3 = getInstance();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(instance1).toBe(instance2);
    expect(instance2).toBe(instance3);
  });

  it("should work with classes", () => {
    class TestService {
      constructor(public id: number) {}
    }

    const getInstance = createSingleton(() => new TestService(123));

    const instance = getInstance();
    expect(instance).toBeInstanceOf(TestService);
    expect(instance.id).toBe(123);
  });
});

describe("createResettableSingleton", () => {
  it("should create instance on first call", () => {
    const factory = vi.fn(() => ({ value: 42 }));
    const [getInstance] = createResettableSingleton(factory);

    const instance = getInstance();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(instance.value).toBe(42);
  });

  it("should return same instance on subsequent calls", () => {
    const factory = vi.fn(() => ({ value: Math.random() }));
    const [getInstance] = createResettableSingleton(factory);

    const instance1 = getInstance();
    const instance2 = getInstance();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(instance1).toBe(instance2);
  });

  it("should create new instance after reset", () => {
    let counter = 0;
    const factory = vi.fn(() => ({ id: ++counter }));
    const [getInstance, reset] = createResettableSingleton(factory);

    const instance1 = getInstance();
    expect(instance1.id).toBe(1);

    reset();

    const instance2 = getInstance();
    expect(instance2.id).toBe(2);
    expect(instance1).not.toBe(instance2);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("should be useful for testing", () => {
    class DatabaseConnection {
      connected = true;
    }

    const [getConnection, resetConnection] = createResettableSingleton(
      () => new DatabaseConnection(),
    );

    // Test 1: use connection
    const conn1 = getConnection();
    expect(conn1.connected).toBe(true);

    // Reset between tests
    resetConnection();

    // Test 2: fresh connection
    const conn2 = getConnection();
    expect(conn2.connected).toBe(true);
    expect(conn1).not.toBe(conn2);
  });
});
