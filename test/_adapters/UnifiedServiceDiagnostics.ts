/**
 * @file Test-only compat adapter for UnifiedServiceDiagnostics
 * 리팩터링 테스트가 기대하는 UnifiedServiceDiagnostics API를 현재 코드에 맞춰 제공합니다.
 * 프로덕션 번들/메트릭에 영향 주지 않도록 test/_adapters 아래에만 존재합니다.
 */

import { CoreService } from '@shared/services/ServiceManager';
import { BrowserService } from '@shared/browser/BrowserService';

class ResourceDiagnostics {
  getResourceUsage() {
    return { total: 0, byType: {}, byContext: {} } as {
      total: number;
      byType: Record<string, number>;
      byContext: Record<string, number>;
    };
  }
  getResourcesByType(type: string): number {
    void type;
    return 0;
  }
  getResourcesByContext(context: string): number {
    void context;
    return 0;
  }
}

export class UnifiedServiceDiagnostics {
  private static instance: UnifiedServiceDiagnostics | null = null;
  private readonly browser = new BrowserService();
  private readonly resources = new ResourceDiagnostics();

  public static getInstance(): UnifiedServiceDiagnostics {
    if (!UnifiedServiceDiagnostics.instance) {
      UnifiedServiceDiagnostics.instance = new UnifiedServiceDiagnostics();
    }
    return UnifiedServiceDiagnostics.instance;
  }

  public static async diagnoseServiceManager(): Promise<void> {
    const svc = CoreService.getInstance();
    await svc.diagnoseServiceManager();
  }

  public getServiceStatus() {
    const svc = CoreService.getInstance();
    const d = svc.getDiagnostics();
    return {
      registeredServices: d.registeredServices,
      activeInstances: d.activeInstances,
      services: d.services,
      instances: d.instances,
    };
  }

  public getBrowserInfo() {
    const diag = this.browser.getDiagnostics();
    return {
      injectedStylesCount: diag.injectedStylesCount,
      isPageVisible: diag.isPageVisible,
      isDOMReady: diag.isDOMReady,
    };
  }

  public getResourceUsage() {
    return this.resources.getResourceUsage();
  }
  public getResourcesByType(type: string): number {
    return this.resources.getResourcesByType(type);
  }
  public getResourcesByContext(context: string): number {
    return this.resources.getResourcesByContext(context);
  }

  public getSystemDiagnostics() {
    const services = this.getServiceStatus();
    const browser = this.getBrowserInfo();
    const resources = this.getResourceUsage();
    return {
      services,
      browser,
      resources,
      memoryOptimization: { suggestions: [] as string[] },
      performanceMetrics: {},
      recommendations: [] as string[],
    };
  }

  public async generateDiagnosticReport() {
    const timestamp = Date.now();
    const services = this.getServiceStatus();
    const browser = this.getBrowserInfo();
    const resources = this.getResourceUsage();
    return {
      timestamp,
      services,
      browser,
      resources,
      summary: {
        registered: services.registeredServices,
        active: services.activeInstances,
      },
    };
  }

  public registerGlobalDiagnostic(): void {
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__ = () =>
        UnifiedServiceDiagnostics.diagnoseServiceManager();
    }
  }

  public cleanup(): void {}
}
