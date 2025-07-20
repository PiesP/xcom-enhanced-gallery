/**
 * DOM Event Manager Backward Compatibility Re-export
 *
 * @deprecated Import from @core/dom/DOMEventManager instead.
 *
 * This file maintains backward compatibility for existing imports.
 * All DOM event management functionality has been moved to the Core layer.
 *
 * Migration Guide - Phase 2A Step 8:
 * - Infrastructure DOM components → Core DOM system
 * - DOM event management operations moved to Core layer
 * - Maintains backward compatibility through re-export
 */

export { DOMEventManager, createEventManager } from '@core/dom/DOMEventManager';
