/**
 * @fileoverview Runtime style registry for managing dynamically injected stylesheets.
 * @description Ensures Tampermonkey and browser environments share a single entry point
 *              for inserting, updating, and removing <style> tags.
 */

import { getUserscript } from "@shared/external/userscript/adapter";
import { logger } from "@shared/logging";

export interface StyleRegistrationOptions {
  readonly id: string;
  readonly cssText: string;
  readonly attributes?: Record<string, string | number | boolean | undefined>;
  readonly replaceExisting?: boolean;
}

interface RegistrationResult {
  readonly id: string;
  readonly element: HTMLStyleElement;
  readonly replaced: boolean;
}

function isBrowserEnvironment(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.createElement === "function"
  );
}

export class StyleRegistry {
  private static instance: StyleRegistry | null = null;

  private readonly styleMap = new Map<string, HTMLStyleElement>();

  private constructor() { }

  public static getInstance(): StyleRegistry {
    if (!StyleRegistry.instance) {
      StyleRegistry.instance = new StyleRegistry();
    }

    return StyleRegistry.instance;
  }

  public registerStyle(
    options: StyleRegistrationOptions,
  ): RegistrationResult | null {
    if (!isBrowserEnvironment()) {
      logger.warn(
        "[StyleRegistry] Unable to register style outside browser environment",
        options.id,
      );
      return null;
    }

    const trimmedCss = options.cssText.trim();
    if (!trimmedCss) {
      logger.warn(
        "[StyleRegistry] Ignoring empty style registration",
        options.id,
      );
      return null;
    }

    const existing = this.getExistingElement(options.id);
    if (existing && options.replaceExisting !== false) {
      existing.textContent = trimmedCss;
      return { id: options.id, element: existing, replaced: true };
    }

    if (existing) {
      return { id: options.id, element: existing, replaced: false };
    }

    let styleElement: HTMLStyleElement;

    try {
      // Phase 373: Introduce GM_addStyle
      styleElement = getUserscript().addStyle(trimmedCss);
    } catch {
      // Fallback for non-GM environments
      styleElement = document.createElement("style");
      styleElement.textContent = trimmedCss;
      (document.head || document.documentElement).appendChild(styleElement);
    }

    styleElement.id = options.id;

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        if (value === undefined) return;
        styleElement.setAttribute(key, String(value));
      });
    }

    this.styleMap.set(options.id, styleElement);

    logger.debug("[StyleRegistry] Registered style", options.id);
    return { id: options.id, element: styleElement, replaced: false };
  }

  public removeStyle(id: string): void {
    const element = this.getExistingElement(id);
    if (!element) {
      return;
    }

    element.remove();
    this.styleMap.delete(id);
    logger.debug("[StyleRegistry] Removed style", id);
  }

  public hasStyle(id: string): boolean {
    return this.styleMap.has(id) || Boolean(this.getExistingElement(id));
  }

  public getStyleElement(id: string): HTMLStyleElement | null {
    return this.getExistingElement(id);
  }

  private getExistingElement(id: string): HTMLStyleElement | null {
    const entry = this.styleMap.get(id);
    if (entry) {
      return entry;
    }

    const domEntry = document.getElementById(id);
    if (domEntry instanceof HTMLStyleElement) {
      this.styleMap.set(id, domEntry);
      return domEntry;
    }

    return null;
  }
}

export function getStyleRegistry(): StyleRegistry {
  return StyleRegistry.getInstance();
}
