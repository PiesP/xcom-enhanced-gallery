/**
 * @fileoverview Runtime Environment Initialization - Phase 314-5
 * @description Vendor library initialization for bootstrap pipeline
 * @module bootstrap/environment
 */

import { logger } from "@shared/logging";
import { reportBootstrapError } from "@/bootstrap/types";

/**
 * Runtime environment initialization (Phase 314-5, Phase 343 improvements)
 * - Initialize vendor libraries (Solid.js, Solid Store, etc.)
 *
 * Phase 343: Standardized error handling (Critical system)
 *
 * @throws {Error} On vendor initialization failure (Critical error)
 */
export async function initializeEnvironment(): Promise<void> {
  try {
    const { initializeVendors } = await import("@shared/external/vendors");
    await initializeVendors();

    if (!import.meta.env.PROD) {
      logger.debug("[environment] ✅ Vendors initialized");
    }
  } catch (error) {
    // Phase 343: Standardized error handling (Critical - re-throw error)
    reportBootstrapError(error, {
      context: "environment",
      severity: "critical",
      logger,
    });
  }
}
