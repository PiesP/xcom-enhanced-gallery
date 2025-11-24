/**
 * Base Service Implementation - Unified Service Lifecycle
 * @module @shared/services/base-service
 */

import { logger } from "@shared/logging";
import type { BaseService } from "@shared/types/app.types";

/**
 * Abstract base class for service lifecycle management.
 * Implements Template Method pattern for initialize/destroy.
 */
export abstract class BaseServiceImpl implements BaseService {
  protected _isInitialized = false;
  protected readonly serviceName: string;

  protected constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /** Initialize service (idempotent, fail-fast on error) */
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    logger.info(`${this.serviceName} initializing...`);

    try {
      await this.onInitialize();
      this._isInitialized = true;
      logger.info(`${this.serviceName} initialized`);
    } catch (error) {
      logger.error(`${this.serviceName} initialization failed:`, error);
      throw error;
    }
  }

  /** Destroy service (idempotent, graceful on error) */
  public destroy(): void {
    if (!this._isInitialized) return;

    logger.info(`${this.serviceName} destroying...`);

    try {
      this.onDestroy();
      logger.info(`${this.serviceName} destroyed`);
    } catch (error) {
      logger.error(`${this.serviceName} destroy failed:`, error);
    } finally {
      this._isInitialized = false;
    }
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /** Subclass initialization hook (async supported) */
  protected abstract onInitialize(): Promise<void> | void;

  /** Subclass cleanup hook (sync only) */
  protected abstract onDestroy(): void;
}
