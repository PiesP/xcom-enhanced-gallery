import {
    getIconRegistry,
    resetIconRegistry,
} from "@shared/components/ui/Icon/icon-registry";
import { beforeEach, describe, expect, it } from "vitest";

describe("IconRegistry", () => {
  beforeEach(() => {
    resetIconRegistry();
  });

  it("should return a singleton instance", () => {
    const registry1 = getIconRegistry();
    const registry2 = getIconRegistry();
    expect(registry1).toBe(registry2);
  });

  it("should load a supported icon", async () => {
    const registry = getIconRegistry();
    const iconComponent = await registry.loadIcon("Download");
    expect(iconComponent).toBeDefined();
    expect(typeof iconComponent).toBe("function");
  });

  it("should throw error for unsupported icon", async () => {
    const registry = getIconRegistry();
    // @ts-expect-error Testing invalid icon name
    await expect(registry.loadIcon("InvalidIcon")).rejects.toThrow(
      "Unsupported icon: InvalidIcon",
    );
  });

  it("should reuse loading promises", async () => {
    const registry = getIconRegistry();
    const promise1 = registry.loadIcon("Settings");
    const promise2 = registry.loadIcon("Settings");
    expect(promise1).toBe(promise2);
    await promise1;
  });

  it("should provide debug info", async () => {
    const registry = getIconRegistry();
    const promise = registry.loadIcon("ZoomIn");

    const debugInfo = registry.getDebugInfo();
    expect(debugInfo.loadingCount).toBe(1);
    expect(debugInfo.loadingIcons).toContain("ZoomIn");

    await promise;

    const debugInfoAfter = registry.getDebugInfo();
    expect(debugInfoAfter.loadingCount).toBe(0);
  });

  it("should load all registered icons", async () => {
    const registry = getIconRegistry();
    const icons = [
      "Download",
      "ArrowDownTray",
      "ArrowDownOnSquareStack",
      "Settings",
      "Cog6Tooth",
      "X",
      "ArrowLeftOnRectangle",
      "ChevronLeft",
      "ChevronRight",
      "ArrowSmallLeft",
      "ArrowSmallRight",
      "ChatBubbleLeftRight",
      "ArrowsPointingIn",
      "ArrowsRightLeft",
      "ArrowsUpDown",
      "ArrowsPointingOut",
      "DocumentText",
      "FileZip",
      "ZoomIn",
    ] as const;

    await Promise.all(
      icons.map(async (iconName) => {
        const component = await registry.loadIcon(iconName);
        expect(component).toBeDefined();
        expect(typeof component).toBe("function");
      }),
    );
  });

  it("should preload common icons", async () => {
    const { preloadCommonIcons } = await import(
      "@shared/components/ui/Icon/icon-registry"
    );
    await expect(preloadCommonIcons()).resolves.toBeUndefined();
  });
});
