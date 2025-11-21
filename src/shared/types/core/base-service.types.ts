/**
 * @fileoverview Base Service Types
 * @description Base service interface definition (circular dependency prevention)
 */

/**
 * Base service interface
 */
export interface BaseService {
  destroy?(): void;
  initialize?(): Promise<void> | void;
  isInitialized?(): boolean;
}
