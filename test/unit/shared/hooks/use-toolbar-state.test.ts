import { useToolbarState } from "@shared/hooks/use-toolbar-state";
import { globalTimerManager } from "@shared/utils/time/timer-management";
import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/external/vendors", async () => {
  const solid = await vi.importActual("solid-js");
  const solidStore = await vi.importActual("solid-js/store");
  return {
    getSolid: () => ({
      ...solid,
      ...solidStore,
    }),
  };
});

vi.mock("@shared/utils/time/timer-management", () => ({
  globalTimerManager: {
    setTimeout: vi.fn((cb, delay) => setTimeout(cb, delay)),
    clearTimeout: vi.fn((id) => clearTimeout(id)),
  },
}));

describe("useToolbarState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with default state", () => {
    createRoot((dispose) => {
      const [state] = useToolbarState();
      expect(state.isDownloading).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.hasError).toBe(false);
      dispose();
    });
  });

  it("should set downloading state immediately when true", () => {
    createRoot((dispose) => {
      const [state, actions] = useToolbarState();
      actions.setDownloading(true);
      expect(state.isDownloading).toBe(true);
      expect(state.hasError).toBe(false);
      dispose();
    });
  });

  it("should debounce downloading state when setting to false quickly", () => {
    createRoot((dispose) => {
      const [state, actions] = useToolbarState();

      // Start download
      actions.setDownloading(true);
      expect(state.isDownloading).toBe(true);

      // Advance time slightly (less than 300ms)
      vi.advanceTimersByTime(100);

      // Stop download immediately (should stay true for remaining time)
      actions.setDownloading(false);
      expect(state.isDownloading).toBe(true);

      // Verify timeout was set
      expect(globalTimerManager.setTimeout).toHaveBeenCalled();

      // Advance time to complete the debounce
      vi.advanceTimersByTime(200);
      expect(state.isDownloading).toBe(false);

      dispose();
    });
  });

  it("should clear downloading state immediately if enough time passed", () => {
    createRoot((dispose) => {
      const [state, actions] = useToolbarState();

      // Start download
      actions.setDownloading(true);

      // Advance time by 301ms
      vi.advanceTimersByTime(301);

      // Stop download
      actions.setDownloading(false);
      expect(state.isDownloading).toBe(false);
      expect(globalTimerManager.setTimeout).not.toHaveBeenCalled();

      dispose();
    });
  });

  it("should set loading state", () => {
    createRoot((dispose) => {
      const [state, actions] = useToolbarState();

      actions.setLoading(true);
      expect(state.isLoading).toBe(true);

      actions.setLoading(false);
      expect(state.isLoading).toBe(false);
      dispose();
    });
  });

  it("should clear error when loading starts", () => {
    createRoot((dispose) => {
      const [state, actions] = useToolbarState();

      actions.setError(true);
      expect(state.hasError).toBe(true);

      actions.setLoading(true);
      expect(state.hasError).toBe(false);
      expect(state.isLoading).toBe(true);
      dispose();
    });
  });

  it("should set error state and clear others", () => {
    createRoot((dispose) => {
      const [state, actions] = useToolbarState();

      actions.setLoading(true);
      actions.setDownloading(true);

      actions.setError(true);
      expect(state.hasError).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.isDownloading).toBe(false);
      dispose();
    });
  });

  it("should reset state", () => {
    createRoot((dispose) => {
      const [state, actions] = useToolbarState();

      // Trigger a timeout
      actions.setDownloading(true);
      vi.advanceTimersByTime(100);
      actions.setDownloading(false); // This sets a timeout

      actions.setLoading(true);
      actions.setError(true);

      actions.resetState();
      expect(state.isDownloading).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.hasError).toBe(false);
      expect(globalTimerManager.clearTimeout).toHaveBeenCalled();
      dispose();
    });
  });
});
