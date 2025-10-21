/**
 * Bridge utilities for ServiceManager access hidden from features layer.
 * Features must import from this module instead of @shared/services/ServiceManager.
 */
import { CoreService } from '../services/service-manager';
import type { BaseService } from '../types/core/base-service.types';

export function bridgeGetService<T>(key: string): T {
  return CoreService.getInstance().get<T>(key);
}

export function bridgeTryGet<T>(key: string): T | null {
  return CoreService.getInstance().tryGet<T>(key);
}

export function bridgeRegister<T>(key: string, instance: T): void {
  CoreService.getInstance().register<T>(key, instance);
}

/**
 * Phase A5.2: BaseService 등록 및 생명주기 관리 브릿지
 */
export function bridgeRegisterBaseService(key: string, service: BaseService): void {
  CoreService.getInstance().registerBaseService(key, service);
}

/**
 * BaseService 조회
 */
export function bridgeGetBaseService(key: string): BaseService {
  return CoreService.getInstance().getBaseService(key);
}

/**
 * BaseService 안전 조회
 */
export function bridgeTryGetBaseService(key: string): BaseService | null {
  return CoreService.getInstance().tryGetBaseService(key);
}

/**
 * BaseService 초기화
 */
export async function bridgeInitializeBaseService(key: string): Promise<void> {
  return CoreService.getInstance().initializeBaseService(key);
}

/**
 * 모든 BaseService 초기화
 */
export async function bridgeInitializeAllBaseServices(keys?: string[]): Promise<void> {
  return CoreService.getInstance().initializeAllBaseServices(keys);
}
