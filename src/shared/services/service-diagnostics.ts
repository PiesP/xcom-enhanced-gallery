/**
 * @fileoverview Service diagnostics (extracted to break circular deps)
 *
 * Note: This module avoids static imports from ServiceManager or service-initialization
 * to keep the dependency graph acyclic. It uses dynamic imports inside methods.
 */

import { logger } from '@shared/logging';

export class ServiceDiagnostics {
  /**
   * Diagnose the current ServiceManager state and attempt minimal bootstrapping.
   */
  static async diagnoseServiceManager(): Promise<void> {
    try {
      logger.info('🔍 ServiceManager diagnostic started');

      // Dynamic imports to avoid static cycles
      const [{ registerCoreServices }, { CoreService }, { SERVICE_KEYS }] = await Promise.all([
        import('./service-initialization'),
        import('./service-manager'),
        import('@/constants'),
      ]);

      const serviceManager = CoreService.getInstance();

      // 1) Ensure services are registered (idempotent)
      logger.info('📋 Registering services...');
      await registerCoreServices();

      // 2) Gather diagnostics
      const diagnostics = serviceManager.getDiagnostics();
      logger.info('📊 Diagnostic results:', {
        registeredCount: diagnostics.registeredServices,
        initializedCount: diagnostics.activeInstances,
        services: diagnostics.services,
        instances: diagnostics.instances,
      });

      // 3) Try essential service presence
      logger.info('🧪 Testing essential service initialization...');
      const autoTheme = await serviceManager.tryGet(SERVICE_KEYS.THEME);
      logger.info('✅ Service initialization results:', {
        autoTheme: autoTheme ? 'success' : 'failed',
      });

      logger.info('✅ ServiceManager diagnostic complete');
    } catch (error) {
      logger.error('❌ ServiceManager diagnostic failed:', error);
      throw error;
    }
  }

  /**
   * Register a global diagnostic function for quick manual checks in dev.
   */
  static registerGlobalDiagnostic(): void {
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = this.diagnoseServiceManager;
    }
  }
}

// Note: Global registration is performed only in the DEV branch of entry (main.ts) to avoid side effects at import time.
