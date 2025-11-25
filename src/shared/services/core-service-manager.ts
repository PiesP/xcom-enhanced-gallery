/**
 * @fileoverview Core Service Management Orchestrator
 * @description Simplified service manager implementing Service Locator Pattern.
 *
 * **Responsibility**: Service Registry (Single Responsibility)
 *
 * **Pattern**: Service Locator
 *
 * @version 3.0.0 - Simplified Service Registry
 */

import { logger } from "@shared/logging";

interface Disposable {
  destroy(): void;
}

function isDisposable(value: unknown): value is Disposable {
  return (
    value !== null &&
    typeof value === "object" &&
    "destroy" in value &&
    typeof (value as Disposable).destroy === "function"
  );
}

export class CoreService {
  private static instance: CoreService | null = null;
  private readonly services = new Map<string, unknown>();

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
    throw new Error(`Service not found: ${key}`);
  }

  public tryGet<T>(key: string): T | null {
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }
    return null;
  }

  public has(key: string): boolean {
    return this.services.has(key);
  }

  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  public cleanup(): void {
    this.services.forEach((service) => {
      try {
        if (isDisposable(service)) {
          service.destroy();
        }
      } catch (e) {
        logger.error("Service cleanup failed", e);
      }
    });
    this.services.clear();
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
