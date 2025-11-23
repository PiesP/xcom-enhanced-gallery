/**
 * Interfaces Barrel Export Module
 *
 * **Purpose**: Central registry for all shared interface definitions. Provides type contracts
 * that establish abstraction boundaries between architectural layers (Features, Shared, Core).
 *
 * **Exported Interfaces**:
 * - `GalleryRenderer`: Abstract contract for gallery rendering and lifecycle management
 *   * Establishes boundary between Features layer (GalleryApp) and rendering infrastructure
 *   * Defines render, close, destroy, isRendering, setOnCloseCallback methods
 *   * Enables loose coupling between gallery implementation and features
 *
 * **Exported Types**:
 *
 * **Architecture Pattern**: Barrel Export (Phase 370)
 * - Aggregates all public interfaces in single file
 * - Internal implementation details hidden in separate files
 * - Type definitions delegated to @shared/types hierarchy
 *
 * **Dependency Rules**:
 * - Features layer can import from @shared/interfaces (GalleryRenderer contract)
 * - Shared layer implementations satisfy GalleryRenderer contract
 * - Core types centralized in @shared/types (circular dependency prevention)
 *
 * **Module Scope** (Phase 200: Type Hierarchy Integration):
 * - Public: GalleryRenderer interface (features layer contract)
 * - Internal: None (interface-only module)
 *
 * **Usage** (Features Layer):
 * import type { GalleryRenderer } from '@shared/interfaces';
 * import type { GalleryRenderOptions } from '@shared/types';
 *
 * **Related**:
 * - @see @shared/types/media.types.ts (type hierarchy, single source of truth)
 * - @see @shared/interfaces/gallery.interfaces.ts (GalleryRenderer definition)
 * - @see docs/ARCHITECTURE.md (type layer integration)
 *
 * @version 2.0.0 - Type hierarchy unified (Phase 200)
 * @internal Module for architectural abstraction (Shared layer)
 */

export type { GalleryRenderer } from "./gallery.interfaces";
