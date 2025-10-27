/**
 * @fileoverview Runtime Environment Initialization
 * @description Vendor 라이브러리 및 런타임 환경 초기화
 * @module bootstrap/environment
 */

import { logger } from '../shared/logging';

/**
 * 런타임 환경 초기화
 * - Vendor 라이브러리 초기화 (Solid.js, Solid Store 등)
 *
 * @throws {Error} Vendor 초기화 실패
 * @returns {Promise<void>}
 */
export async function initializeEnvironment(): Promise<void> {
  try {
    const { initializeVendors } = await import('../shared/external/vendors');
    await initializeVendors();
    logger.debug('[environment] ✅ Vendors initialized');
  } catch (error) {
    logger.error('[environment] ❌ Failed to initialize environment:', error);
    throw error;
  }
}
