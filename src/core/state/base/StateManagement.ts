/**
 * Domain-Driven Design Patterns for State Management
 *
 * This module provides type-safe state management patterns based on DDD principles.
 * It abstracts away vendor-specific implementations while ensuring type safety.
 */

import { getPreactSignals } from '../../../infrastructure/external/vendors';

// Type definitions for state management
export interface Signal<T> {
  value: T;
  peek(): T;
  subscribe(callback: (value: T) => void): () => void;
}

export interface Computed<T> {
  value: T;
  peek(): T;
  subscribe(callback: (value: T) => void): () => void;
}

export interface StateManagementPrimitives {
  signal: <T>(initialValue: T) => Signal<T>;
  computed: <T>(fn: () => T) => Computed<T>;
  effect: (fn: () => void) => () => void;
  batch: (fn: () => void) => void;
}

/**
 * Get type-safe state management primitives
 */
export function getStateManagement(): StateManagementPrimitives {
  const vendor = getPreactSignals();

  return {
    signal: <T>(initialValue: T): Signal<T> => {
      const s = vendor.signal(initialValue);
      return {
        get value() {
          return s.value;
        },
        set value(newValue: T) {
          s.value = newValue;
        },
        peek: () => s.peek(),
        subscribe: (callback: (value: T) => void) => s.subscribe(callback),
      };
    },

    computed: <T>(fn: () => T): Computed<T> => {
      const c = vendor.computed(fn);
      return {
        get value() {
          return c.value;
        },
        peek: () => c.peek(),
        subscribe: (callback: (value: T) => void) => c.subscribe(callback),
      };
    },

    effect: (fn: () => void) => vendor.effect(fn),
    batch: (fn: () => void) => vendor.batch(fn),
  };
}

/**
 * Abstract State Repository - DDD pattern for state management
 */
export abstract class StateRepository<TState> {
  protected _signal: Signal<TState>;
  protected stateManagement: StateManagementPrimitives;

  constructor(initialState: TState) {
    this.stateManagement = getStateManagement();
    this._signal = this.stateManagement.signal(initialState);
  }

  get value(): TState {
    return this._signal.value;
  }

  protected setValue(newState: TState): void {
    this._signal.value = newState;
  }

  protected updateState(updater: (current: TState) => TState): void {
    this.setValue(updater(this.value));
  }

  subscribe(callback: (state: TState) => void): () => void {
    return this._signal.subscribe(callback);
  }

  // Template method for state validation
  protected abstract validateState(state: TState): boolean;

  // Template method for state transformation
  protected abstract transformState(state: TState): TState;
}

/**
 * Domain Event for state changes
 */
export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: string;
  readonly payload: TPayload;
}

/**
 * Event-driven state repository
 */
export abstract class EventDrivenStateRepository<TState> extends StateRepository<TState> {
  private readonly eventHandlers = new Map<string, Array<(event: DomainEvent) => void>>();

  protected emitEvent(event: DomainEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error handling event ${event.type}:`, error);
      }
    });
  }

  onEvent(eventType: string, handler: (event: DomainEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    const handlers = this.eventHandlers.get(eventType)!;
    handlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    };
  }

  protected createEvent<TPayload>(type: string, payload: TPayload): DomainEvent<TPayload> {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      payload,
    };
  }
}
