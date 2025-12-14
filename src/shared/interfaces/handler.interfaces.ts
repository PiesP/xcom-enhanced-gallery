/**
 * @fileoverview Unified handler lifecycle interfaces
 * @description Standardized interfaces for service and feature handler initialization.
 *
 * Phase: Refactoring - Handler interface unification
 *
 * This module provides:
 * - Consistent lifecycle contract for all handlers
 * - Standard initialization result types
 * - Service registration patterns
 */

// ============================================================================
// Lifecycle Interfaces
// ============================================================================

/**
 * Handler lifecycle phases
 */
export type HandlerLifecyclePhase =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'error'
  | 'destroyed';

/**
 * Base handler lifecycle interface
 *
 * All feature handlers and services should implement this interface
 * for consistent initialization and cleanup patterns.
 *
 * @example
 * ```typescript
 * class MyHandler implements HandlerLifecycle {
 *   private phase: HandlerLifecyclePhase = 'uninitialized';
 *
 *   async initialize(): Promise<InitializationResult> {
 *     this.phase = 'initializing';
 *     try {
 *       // ... initialization logic
 *       this.phase = 'ready';
 *       return { success: true };
 *     } catch (error) {
 *       this.phase = 'error';
 *       return { success: false, error };
 *     }
 *   }
 *
 *   destroy(): void {
 *     this.phase = 'destroyed';
 *   }
 *
 *   getPhase(): HandlerLifecyclePhase {
 *     return this.phase;
 *   }
 * }
 * ```
 */
export interface HandlerLifecycle {
  /**
   * Initialize the handler
   * Should be idempotent - safe to call multiple times
   */
  initialize(): Promise<InitializationResult>;

  /**
   * Destroy the handler and clean up resources
   * Should be idempotent - safe to call multiple times
   */
  destroy(): void;

  /**
   * Get current lifecycle phase
   */
  getPhase(): HandlerLifecyclePhase;

  /**
   * Check if handler is ready for use
   */
  isReady(): boolean;
}

/**
 * Initialization result type
 */
export interface InitializationResult {
  /** Whether initialization succeeded */
  readonly success: boolean;
  /** Error if initialization failed */
  readonly error?: unknown;
  /** Optional message for logging */
  readonly message?: string;
  /** Time taken to initialize in milliseconds */
  readonly durationMs?: number;
}

// ============================================================================
// Service Handler Interfaces
// ============================================================================

/**
 * Service handler with optional dependencies
 */
export interface ServiceHandler extends HandlerLifecycle {
  /** Service identifier */
  readonly serviceId: string;
  /** Service dependencies (other service IDs) */
  readonly dependencies?: readonly string[];
}

/**
 * Service registration options
 */
export interface ServiceRegistrationOptions {
  /** Whether to replace existing service */
  readonly replace?: boolean;
  /** Whether initialization is lazy (on first access) */
  readonly lazy?: boolean;
  /** Dependencies that must be registered first */
  readonly dependencies?: readonly string[];
}

// ============================================================================
// Event Handler Interfaces
// ============================================================================

/**
 * Event handler configuration
 */
export interface EventHandlerConfig {
  /** Whether keyboard events are enabled */
  readonly enableKeyboard: boolean;
  /** Whether media detection is enabled */
  readonly enableMediaDetection: boolean;
  /** Debug mode for verbose logging */
  readonly debugMode: boolean;
  /** Whether to prevent event bubbling */
  readonly preventBubbling: boolean;
  /** Handler context identifier */
  readonly context: string;
}

/**
 * Default event handler configuration
 */
export const DEFAULT_EVENT_HANDLER_CONFIG: EventHandlerConfig = Object.freeze({
  enableKeyboard: true,
  enableMediaDetection: true,
  debugMode: false,
  preventBubbling: true,
  context: 'default',
});

// ============================================================================
// Gallery Controller Interface
// ============================================================================

/**
 * Gallery controller interface for unified gallery management
 *
 * This interface defines the contract for gallery controllers that manage
 * the gallery lifecycle, navigation, and user interactions.
 */
export interface GalleryController {
  /**
   * Open the gallery with media items
   * @param mediaItems - Array of media items to display
   * @param startIndex - Initial index to display (default: 0)
   */
  open(mediaItems: readonly unknown[], startIndex?: number): Promise<void>;

  /**
   * Close the gallery
   */
  close(): void;

  /**
   * Navigate to a specific item
   * @param index - Target item index
   */
  navigateTo(index: number): void;

  /**
   * Navigate to the next item
   */
  next(): void;

  /**
   * Navigate to the previous item
   */
  previous(): void;

  /**
   * Check if gallery is currently open
   */
  isOpen(): boolean;

  /**
   * Get current item index
   */
  getCurrentIndex(): number;

  /**
   * Get total number of items
   */
  getTotalItems(): number;
}

// ============================================================================
// Bootstrap Stage Interface
// ============================================================================

/**
 * Bootstrap stage definition
 */
export interface BootstrapStage {
  /** Human-readable stage label */
  readonly label: string;
  /** Stage execution function */
  readonly run: () => Promise<void> | void;
  /** Conditional execution predicate (default: true) */
  readonly shouldRun?: () => boolean;
  /** Whether this stage is optional (can fail without blocking) */
  readonly optional?: boolean;
  /** Dependencies (other stage labels that must complete first) */
  readonly dependencies?: readonly string[];
}

/**
 * Bootstrap stage result
 */
export interface BootstrapStageResult {
  /** Stage label */
  readonly label: string;
  /** Whether stage completed successfully */
  readonly success: boolean;
  /** Whether stage is optional (failure does not block bootstrap) */
  readonly optional: boolean;
  /** Error if stage failed */
  readonly error?: unknown;
  /** Duration in milliseconds */
  readonly durationMs: number;
}
