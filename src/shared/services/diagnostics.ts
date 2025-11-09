import { logger } from '@shared/logging';

export async function diagnoseServiceManager(): Promise<void> {
  try {
    logger.info('🔍 ServiceManager diagnostic started');

    const [{ registerCoreServices }, { CoreService }, { SERVICE_KEYS }] = await Promise.all([
      import('./service-initialization'),
      import('./core/core-service-manager'),
      import('@/constants'),
    ]);

    const serviceManager = CoreService.getInstance();
    logger.info('📋 Registering services...');
    await registerCoreServices();

    const diagnostics = serviceManager.getDiagnostics();
    logger.info('📊 Diagnostic results:', {
      registeredCount: diagnostics.registeredServices,
      initializedCount: diagnostics.activeInstances,
      services: diagnostics.services,
      instances: diagnostics.instances,
    });

    logger.info('🧪 Testing essential service initialization...');
    const themeService = await serviceManager.tryGet(SERVICE_KEYS.THEME);
    logger.info('✅ Service initialization results:', {
      themeService: themeService ? 'success' : 'failed',
    });

    logger.info('✅ ServiceManager diagnostic complete');
  } catch (error) {
    logger.error('❌ ServiceManager diagnostic failed:', error);
    throw error;
  }
}

export function registerDiagnosticsGlobal(): void {
  if (import.meta.env.DEV) {
    (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = diagnoseServiceManager;
  }
}

export const ServiceDiagnostics = {
  diagnoseServiceManager,
  registerGlobalDiagnostic: registerDiagnosticsGlobal,
} as const;
