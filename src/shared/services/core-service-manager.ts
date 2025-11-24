/**
 * @fileoverview Core Service Management Orchestrator
 * @description Simplified service manager implementing Orchestrator Pattern.
 * Coordinates three specialized managers (Registry, Factory, Lifecycle) to
 * provide unified service management API.
 *
 * **Responsibility**: Orchestration and delegation only (Single Responsibility)
 *
 * **Pattern**: Central orchestrator that delegates to specialized managers:
 * - {@link ServiceRegistry}: Direct instance storage
 * - {@link ServiceFactoryManager}: Factory registration and caching
 * - {@link ServiceLifecycleManager}: BaseService initialization and cleanup
 *
 * **Phase Reference**: Phase 309 Service Layer Pattern, Phase 380 Optimization, Phase 354 Naming
 *
 * @version 2.0.0 - Service Manager Delegation Pattern (Complete Separation)
 */

import { logger } from "@shared/logging";
import type { BaseService } from "@shared/types/core/base-service.types";

export class CoreService {
  private static instance: CoreService | null = null;
  private readonly services = new Map<string, unknown>();
  private readonly factories = new Map<string, () => unknown>();
  private readonly factoryCache = new Map<string, unknown>();
  private readonly baseServices = new Map<string, BaseService>();

  private constructor() {}

  public static getInstance(): CoreService {
    if (!CoreService.instance) {
      CoreService.instance = new CoreService();
    }
    return CoreService.instance;
  }

  public register<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }

  public get<T>(key: string): T {
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }
    const fromFactory = this.createFromFactory<T>(key);
    if (fromFactory) {
      return fromFactory;
    }
    throw new Error(`Service not found: ${key}`);
  }

  public tryGet<T>(key: string): T | null {
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }
    return this.createFromFactory<T>(key);
  }

  public has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  public registerFactory<T>(key: string, factory: () => T): void {
    if (this.factories.has(key)) {
      logger.warn(`Duplicate factory registration ignored: ${key}`);
      return;
    }
    this.factories.set(key, factory);
  }

  private createFromFactory<T>(key: string): T | null {
    if (this.factoryCache.has(key)) {
      return this.factoryCache.get(key) as T;
    }
    const factory = this.factories.get(key);
    if (!factory) return null;

    try {
      const created = factory();
      this.factoryCache.set(key, created);
      return created as T;
    } catch (error) {
      logger.error(`Factory creation failed for ${key}:`, error);
      throw error;
    }
  }

  public registerBaseService(key: string, service: BaseService): void {
    this.baseServices.set(key, service);
  }

  public getBaseService(key: string): BaseService {
    const service = this.baseServices.get(key);
    if (!service) throw new Error(`BaseService not found: ${key}`);
    return service;
  }

  public tryGetBaseService(key: string): BaseService | null {
    return this.baseServices.get(key) || null;
  }

  public async initializeBaseService(key: string): Promise<void> {
    const service = this.getBaseService(key);
    if (service.isInitialized && service.isInitialized()) {
      return;
    }
    if (service.initialize) {
      await service.initialize();
    }
  }

  public async initializeAllBaseServices(keys?: string[]): Promise<void> {
    const targets = keys || Array.from(this.baseServices.keys());
    for (const key of targets) {
      try {
        await this.initializeBaseService(key);
      } catch (error) {
        logger.error(`Failed to initialize service ${key}:`, error);
        throw error;
      }
    }
  }

  public isBaseServiceInitialized(key: string): boolean {
    return this.baseServices.get(key)?.isInitialized?.() ?? false;
  }

  public getRegisteredBaseServices(): string[] {
    return Array.from(this.baseServices.keys());
  }

  public getDiagnostics() {
    const services = this.getRegisteredServices();
    const instances: Record<string, boolean> = {};
    for (const key of services) instances[key] = true;
    return {
      registeredServices: services.length,
      activeInstances: services.length,
      services,
      instances,
    };
  }

  public cleanup(): void {
    this.baseServices.forEach((service) => {
      try {
        if (service.destroy) service.destroy();
      } catch (e) {
        logger.error("Service cleanup failed", e);
      }
    });
    this.services.clear();
    this.baseServices.clear();
    this.factories.clear();
    this.factoryCache.clear();
  }

  public reset(): void {
    this.cleanup();
  }

  public static resetInstance(): void {
    if (CoreService.instance) {
      CoreService.instance.reset();
      CoreService.instance = null;
    }
  }
}

export const serviceManager = CoreService.getInstance();

export function getService<T>(key: string): T {
  return CoreService.getInstance().get<T>(key);
}

export function registerServiceFactory<T>(key: string, factory: () => T): void {
  CoreService.getInstance().registerFactory<T>(key, factory);
}
