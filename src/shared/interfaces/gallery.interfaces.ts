/**
 * Gallery Core Interfaces Module
 *
 * **Purpose**: Defines the renderer contract for the Features layer. This module exports
 * interfaces that establish the abstraction boundary between features (GalleryApp) and
 * shared infrastructure (rendering, lifecycle management).
 *
 * **Architecture Pattern**:
 * - Dependency rules: features → shared → core → infrastructure
 * - GalleryRenderer: Abstract contract for gallery lifecycle (render, close, destroy)
 * - GalleryRenderOptions: Configuration for rendering behavior (imported from shared types)
 *
 * **Type Hierarchy Integration** (Phase 200):
 * - Core types defined in @shared/types/media.types.ts (single source of truth)
 * - Re-exported here for convenience and interface co-location
 * - Prevents circular dependencies between features and types layers
 *
 * **Module Scope**:
 * - Public: GalleryRenderer interface (features layer contract)
 * - Internal: None (interface-only module)
 *
 * **Usage** (Features Layer):
 * import type { GalleryRenderer } from '@shared/interfaces';
 * import type { GalleryRenderOptions } from '@shared/types';
 *
 * class GalleryApp implements GalleryRenderer {
 *   async render(mediaItems: readonly MediaInfo[], options?: GalleryRenderOptions) {
 *     // Implementation
 *   }
 *   close() { ... }
 * }
 *
 * @version 2.0.0 - Type hierarchy unified (Phase 200)
 * @internal Module for cross-layer abstraction (Shared layer)
 */

import type { MediaInfo, GalleryRenderOptions } from '@shared/types/media.types';

/**
 * Gallery Renderer Interface
 *
 * **Purpose**: Defines the abstraction contract for gallery rendering and lifecycle management.
 * Establishes the boundary between the Features layer (GalleryApp) and shared infrastructure
 * (rendering, event handling, state management).
 *
 * **Responsibilities**:
 * 1. **Rendering**: Display media items in a gallery view with optional configuration
 * 2. **Lifecycle**: Manage initialization, active state, and cleanup
 * 3. **Destruction**: Properly tear down resources and event listeners
 * 4. **State Tracking**: Expose rendering state for integration
 * 5. **Callbacks**: Support close handlers for parent component coordination
 *
 * **Implementation Contract**:
 * - Must call render() before close() or destroy()
 * - Must call destroy() during component unmount
 * - Should not render multiple times without close() in between
 * - Must handle empty media items (close or no-op)
 * - Must be idempotent for destroy() (safe to call multiple times)
 *
 * **Lifecycle States**:
 * - Initial: isRendering() = false (no gallery active)
 * - After render(): isRendering() = true (gallery visible)
 * - After close(): isRendering() = false (gallery hidden, can render again)
 * - After destroy(): isRendering() = false (component unmounted, cannot render again)
 *
 * **Example**:
 * const renderer: GalleryRenderer = new GalleryApp();
 * renderer.setOnCloseCallback(() => console.log('Gallery closed'));
 * await renderer.render(mediaItems, { currentIndex: 0 });
 * renderer.close();
 * renderer.destroy();
 *
 * @internal Interface for Features layer integration
 */
export interface GalleryRenderer {
  /**
   * Render the gallery with media items
   *
   * **Behavior**:
   * - Creates and displays a fullscreen gallery view
   * - Initializes event listeners for keyboard navigation and user interaction
   * - Configures initial state (currentIndex, fit mode, etc.)
   * - Becomes immediately visible to user
   *
   * **Arguments**:
   * - mediaItems: Array of MediaInfo objects (images/videos to display)
   * - options: Optional GalleryRenderOptions (currentIndex, defaultFitMode, etc.)
   *
   * **Side Effects**:
   * - Sets isRendering() = true
   * - Mounts event listeners
   * - Registers keyboard handlers
   * - May modify window/document styles (fullscreen, scroll prevention)
   *
   * **Idempotency**:
   * - Should be safe to call multiple times (no memory leaks on re-render)
   * - Should close previous gallery before rendering new one
   *
   * **Performance**:
   * - Should complete within 100-200ms
   * - Async to allow DOM painting before initialization
   *
   * @param mediaItems - Readonly array of MediaInfo to render
   * @param options - Optional render options (currentIndex, fit mode, etc.)
   * @throws May throw if mediaItems is empty or invalid
   * @internal Renderer implementation contract
   */
  render(mediaItems: readonly MediaInfo[], options?: GalleryRenderOptions): Promise<void>;

  /**
   * Close the gallery (hide without destroying)
   *
   * **Behavior**:
   * - Hides the gallery view from user
   * - Preserves component state and resources
   * - Sets isRendering() = false
   * - Calls onCloseCallback if registered
   * - Allows render() to be called again later
   *
   * **Side Effects**:
   * - Sets isRendering() = false
   * - Triggers onCloseCallback handlers
   * - May restore window/document styles
   * - Does not destroy event listeners (preserved for next render)
   *
   * **Difference from destroy()**:
   * - close(): Temporary hide, can render() again later
   * - destroy(): Permanent cleanup, cannot render() after this
   *
   * **Idempotency**:
   * - Safe to call multiple times
   * - Subsequent calls should be no-ops
   *
   * @internal Renderer implementation contract
   */
  close(): void;

  /**
   * Completely destroy the gallery and release all resources
   *
   * **Behavior**:
   * - Removes gallery DOM elements
   * - Cleans up all event listeners
   * - Clears state and references
   * - Prevents any further render() calls
   * - Should be called during component unmount
   *
   * **Side Effects**:
   * - Sets isRendering() = false
   * - Removes DOM elements
   * - Clears event listeners
   * - Restores window/document styles
   * - Releases memory references
   *
   * **Difference from close()**:
   * - close(): Temporary hide, can render() again later
   * - destroy(): Permanent cleanup, cannot render() after this
   *
   * **Idempotency**:
   * - MUST be safe to call multiple times
   * - Subsequent calls should be no-ops
   * - Should not throw errors on re-call
   *
   * **Lifecycle Hook**:
   * - Must be called in component unmount handler
   * - Prevents memory leaks and dangling event listeners
   *
   * @internal Renderer implementation contract
   */
  destroy(): void;

  /**
   * Check if gallery is currently rendering
   *
   * **Return Value**:
   * - true: Gallery is visible and active (after render(), before close())
   * - false: Gallery is hidden or not initialized
   *
   * **Lifecycle States**:
   * - Initial: false (not rendered)
   * - After render(): true (visible)
   * - After close(): false (hidden but not destroyed)
   * - After destroy(): false (permanently destroyed)
   *
   * **Usage**:
   * Useful for checking if gallery is active before attempting operations
   *
   * @returns true if gallery is currently rendering, false otherwise
   * @internal Renderer implementation contract
   */
  isRendering(): boolean;

  /**
   * Register close event handler
   *
   * **Purpose**: Allows parent component to be notified when gallery closes.
   * Useful for coordinating state between gallery and surrounding UI.
   *
   * **Behavior**:
   * - Called automatically when close() is invoked
   * - Should be called before render() for reliable notification
   * - Callback receives no arguments (state query via isRendering())
   *
   * **Example**:
   * renderer.setOnCloseCallback(() => {
   *   console.log('Gallery was closed');
   *   updateParentState();
   * });
   *
   * **Idempotency**:
   * - Multiple calls should replace callback (not append)
   * - Setting to null should unregister callback
   *
   * @param onClose - Callback function to invoke on gallery close
   * @internal Renderer implementation contract
   */
  setOnCloseCallback(onClose: () => void): void;
}
