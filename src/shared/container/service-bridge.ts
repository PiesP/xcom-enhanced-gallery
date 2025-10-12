/**
 * Bridge utilities for ServiceManager access hidden from features layer.
 * Features must import from this module instead of @shared/services/ServiceManager.
 */
import { CoreService } from '../services/service-manager';

export function bridgeGetService<T>(key: string): T {
  return CoreService.getInstance().get<T>(key);
}

export function bridgeTryGet<T>(key: string): T | null {
  return CoreService.getInstance().tryGet<T>(key);
}

export function bridgeRegister<T>(key: string, instance: T): void {
  CoreService.getInstance().register<T>(key, instance);
}
