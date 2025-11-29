/**
 * @fileoverview Event listener registry
 * @deprecated Phase 500: Consolidated into listener-manager.ts
 *              This file is kept for backward compatibility only.
 *              Use functions from listener-manager.ts directly:
 *              - addListener()
 *              - removeEventListenerManaged()
 *              - removeEventListenersByContext()
 *              - getEventListenerStatus()
 */

// Re-export from listener-manager for backward compatibility
export {
  getEventListenerStatus as listenerRegistry,
} from './listener-manager';
