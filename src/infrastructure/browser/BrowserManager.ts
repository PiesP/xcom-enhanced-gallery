/**
 * Browser Manager Backward Compatibility Re-export
 *
 * @deprecated Import from @core/browser/BrowserManager instead.
 *
 * This file maintains backward compatibility for existing imports.
 * All browser management functionality has been moved to the Core layer.
 *
 * Migration Guide - Phase 2A Step 8:
 * - Infrastructure browser components → Core browser system
 * - Browser management operations moved to Core layer
 * - Maintains backward compatibility through re-export
 */

export { BrowserManager, browserUtils } from '@core/browser/BrowserManager';
