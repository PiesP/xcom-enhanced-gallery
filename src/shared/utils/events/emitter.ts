// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Lightweight type-safe event emitter for feature-local coordination.
 * Listener exceptions are isolated and do not cascade.
 */

import { logger } from '@shared/logging/logger';

export interface EventEmitter<T extends Record<string, unknown>> {
  on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  dispose(): void;
}

/**
 * Creates a type-safe event emitter for feature-local coordination.
 * Listener exceptions are isolated — one failing callback does not affect others.
 *
 * @returns An EventEmitter with on(), emit(), and dispose() methods
 */
export function createEventEmitter<T extends Record<string, unknown>>(): EventEmitter<T> {
  const listeners = new Map<keyof T, Set<(data: unknown) => void>>();

  return {
    on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
      const eventListeners = listeners.get(event);

      if (eventListeners) {
        eventListeners.add(callback as (data: unknown) => void);
      } else {
        listeners.set(event, new Set([callback as (data: unknown) => void]));
      }

      return () => {
        const currentListeners = listeners.get(event);
        if (currentListeners) {
          currentListeners.delete(callback as (data: unknown) => void);
        }
      };
    },

    emit<K extends keyof T>(event: K, data: T[K]): void {
      const eventListeners = listeners.get(event);
      if (!eventListeners) {
        return;
      }

      for (const callback of eventListeners) {
        try {
          callback(data);
        } catch (error) {
          if (__DEV__) {
            logger.warn('[EventEmitter] listener error for', String(event), error);
          }
        }
      }
    },

    dispose(): void {
      listeners.clear();
    },
  };
}
