/**
 * Accessibility live-region helpers
 * Consolidated module dedicated to polite/assertive announcements.
 */

import { globalTimerManager } from "@shared/utils/timer-management";

type LiveRegionType = "polite" | "assertive";

type LiveRegionRegistry = Partial<Record<LiveRegionType, HTMLElement>>;

const liveRegions: LiveRegionRegistry = {};
let lifecycleAttached = false;

const handlePageHide = () => {
  cleanupLiveRegions();
};

function hasDomContext(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    !!document.body
  );
}

function assertDomContext(): void {
  if (!hasDomContext()) {
    throw new Error("Live region utilities require an active document.");
  }
}

function ensureLifecycle(): void {
  if (lifecycleAttached || typeof window === "undefined") {
    return;
  }
  if (typeof window.addEventListener !== "function") {
    return;
  }
  window.addEventListener("pagehide", handlePageHide);
  lifecycleAttached = true;
}

function createRegion(type: LiveRegionType): HTMLElement {
  assertDomContext();
  const body = document.body;
  const region = body.ownerDocument.createElement("div");
  region.setAttribute("data-xe-live-region", type);
  region.setAttribute("aria-live", type);
  region.setAttribute("role", type === "polite" ? "status" : "alert");

  const { style } = region;
  style.position = "absolute";
  style.width = "1px";
  style.height = "1px";
  style.margin = "-1px";
  style.padding = "0";
  style.border = "0";
  style.clip = "rect(0 0 0 0)";
  style.overflow = "hidden";

  body.appendChild(region);
  return region;
}

function ensureRegion(type: LiveRegionType): HTMLElement {
  ensureLifecycle();
  const existing = liveRegions[type];
  if (existing?.isConnected) {
    return existing;
  }

  const region = existing ?? createRegion(type);
  if (!region.isConnected) {
    assertDomContext();
    document.body.appendChild(region);
  }

  liveRegions[type] = region;
  return region;
}

export function ensurePoliteLiveRegion(): HTMLElement {
  return ensureRegion("polite");
}

export function ensureAssertiveLiveRegion(): HTMLElement {
  return ensureRegion("assertive");
}

export function getLiveRegionElements(): LiveRegionRegistry {
  return { ...liveRegions };
}

export function cleanupLiveRegions(): void {
  (Object.keys(liveRegions) as LiveRegionType[]).forEach((type) => {
    const region = liveRegions[type];
    if (region?.isConnected) {
      region.remove();
    }
    delete liveRegions[type];
  });

  if (lifecycleAttached && typeof window !== "undefined") {
    if (typeof window.removeEventListener === "function") {
      window.removeEventListener("pagehide", handlePageHide);
    }
    lifecycleAttached = false;
  }
}

export function announce(
  message: string,
  politeness: LiveRegionType = "polite",
): void {
  if (!message || !hasDomContext()) {
    return;
  }

  const region = ensureRegion(politeness);
  region.textContent = "";
  globalTimerManager.setTimeout(() => {
    region.textContent = message;
  }, 0);
}
