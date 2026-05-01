/**
 * App Container Interface - Type-Safe DI Contracts
 *
 * Defines interface contracts for container-managed services.
 * Only IGalleryApp is actively used by the bootstrap pipeline.
 */

export interface IGalleryApp {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}
