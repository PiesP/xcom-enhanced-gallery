/**
 * Domain Primitives for Domain-Driven Design
 *
 * This module provides base classes for implementing DDD patterns:
 * - ValueObject: Immutable objects defined by their attributes
 * - Entity: Objects with identity and lifecycle
 * - AggregateRoot: Entities that serve as consistency boundaries
 * - Repository: Data access abstraction
 * - DomainService: Domain logic that doesn't fit in entities/value objects
 * - DomainError: Domain-specific errors
 * - Result: Functional error handling
 */

// Core types
export type EntityId = string;

export interface EntityProps {
  id: EntityId;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainEvent {
  eventId: string;
  aggregateId: EntityId;
  eventType: string;
  occurredAt: Date;
  data?: Record<string, unknown>;
}

/**
 * Base class for Value Objects
 * Value objects are immutable and defined by their attributes
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  protected constructor(value: T) {
    this.validate(value);
    this._value = this.transform ? this.transform(value) : value;
    Object.freeze(this);
  }

  /**
   * Validate the value (override in subclasses)
   */
  protected validate(value: T): void {
    if (value == null) {
      throw new Error('Value object cannot be null or undefined');
    }
  }

  /**
   * Transform the value (optional override in subclasses)
   */
  protected transform?(value: T): T;

  /**
   * Get the value
   */
  public get value(): T {
    return this._value;
  }

  /**
   * Check if this value object is equal to another
   */
  public equals(other: ValueObject<T>): boolean {
    return this.isEqual(this._value, other._value);
  }

  /**
   * Deep equality check for complex values
   */
  private isEqual(a: T, b: T): boolean {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
      return false;
    }

    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }

      const valueA = (a as Record<string, unknown>)[key];
      const valueB = (b as Record<string, unknown>)[key];
      if (!this.isEqualValues(valueA, valueB)) {
        return false;
      }
    }

    return true;
  }

  private isEqualValues(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (
        !this.isEqualValues(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return JSON.stringify(this._value);
  }

  /**
   * Clone the value object (returns a deep copy of the value)
   */
  public clone(): T {
    return JSON.parse(JSON.stringify(this._value)) as T;
  }
}

/**
 * Base class for Entities
 * Entities have identity and can change over time
 */
export abstract class Entity<TProps extends EntityProps> {
  protected readonly _id: EntityId;
  protected _props: TProps;

  protected constructor(props: TProps, id?: EntityId) {
    this._id = id ?? props.id;
    this._props = { ...props };

    if (!this._props.createdAt) {
      this._props.createdAt = new Date();
    }

    if (!this._props.updatedAt) {
      this._props.updatedAt = new Date();
    }
  }

  /**
   * Get entity ID
   */
  public get id(): EntityId {
    return this._id;
  }

  /**
   * Get entity properties
   */
  protected get props(): TProps {
    return this._props;
  }

  /**
   * Get creation timestamp
   */
  public get createdAt(): Date {
    return this._props.createdAt;
  }

  /**
   * Get last update timestamp
   */
  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  /**
   * Check if this entity is equal to another (based on ID)
   */
  public equals(entity: Entity<TProps>): boolean {
    return this._id === entity._id;
  }

  /**
   * Clone the entity with updated properties
   */
  public cloneWith(updates: Partial<Omit<TProps, 'id' | 'createdAt'>>): TProps {
    const cloned = JSON.parse(JSON.stringify(this._props)) as TProps;
    return {
      ...cloned,
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * Update properties (protected method for subclasses)
   */
  protected updateProps(updates: Partial<Omit<TProps, 'id' | 'createdAt'>>): void {
    this._props = {
      ...this._props,
      ...updates,
      updatedAt: new Date(),
    };
  }
}

/**
 * Base class for Aggregate Roots
 * Aggregate roots are entities that serve as consistency boundaries
 */
export abstract class AggregateRoot<TProps extends EntityProps> extends Entity<TProps> {
  private _domainEvents: DomainEvent[] = [];

  /**
   * Add a domain event
   */
  protected addDomainEvent(event: Omit<DomainEvent, 'aggregateId' | 'occurredAt'>): void {
    const domainEvent: DomainEvent = {
      ...event,
      aggregateId: this._id,
      occurredAt: new Date(),
    };
    this._domainEvents.push(domainEvent);
  }

  /**
   * Get and clear domain events
   */
  public getAndClearDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Get domain events without clearing
   */
  public getDomainEvents(): readonly DomainEvent[] {
    return [...this._domainEvents];
  }
}

/**
 * Repository interface for data access
 */
export interface Repository<T extends Entity<EntityProps>> {
  findById(id: EntityId): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: EntityId): Promise<void>;
  findAll(): Promise<T[]>;
}

/**
 * Base class for Domain Services
 * Domain services contain domain logic that doesn't naturally fit in entities or value objects
 */
export abstract class DomainService {
  protected constructor() {}
}

/**
 * Base class for Domain Errors
 */
export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown> | undefined;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details ?? undefined;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }
}

/**
 * Result type for functional error handling
 */
export class Result<T, E = DomainError> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T | undefined;
  private readonly _error?: E | undefined;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value ?? undefined;
    this._error = error ?? undefined;
    Object.freeze(this);
  }

  /**
   * Create a successful result
   */
  public static success<T, E = DomainError>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  /**
   * Create a failure result
   */
  public static failure<T, E = DomainError>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Check if result is successful
   */
  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * Check if result is failure
   */
  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * Get the value (throws if failure)
   */
  public get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value as T;
  }

  /**
   * Get the error (throws if success)
   */
  public get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error as E;
  }

  /**
   * Map the value if successful
   */
  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.success(fn(this._value as T));
    }
    return Result.failure(this._error as E);
  }

  /**
   * Flat map the result
   */
  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value as T);
    }
    return Result.failure(this._error as E);
  }

  /**
   * Map the error if failure
   */
  public mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this._isSuccess) {
      return Result.success(this._value as T);
    }
    return Result.failure(fn(this._error as E));
  }

  /**
   * Handle both success and failure cases
   */
  public fold<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    if (this._isSuccess) {
      return onSuccess(this._value as T);
    }
    return onFailure(this._error as E);
  }
}
