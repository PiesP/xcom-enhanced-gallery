import {
    safeEventPrevent,
    safeEventPreventAll,
    safeEventStop,
} from "@shared/utils/events/utils";
import { describe, expect, it, vi } from "vitest";

describe("Event Utils", () => {
  describe("safeEventPrevent", () => {
    it("should prevent default and stop propagation", () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as Event;

      safeEventPrevent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("should handle undefined event", () => {
      expect(() => safeEventPrevent(undefined)).not.toThrow();
    });
  });

  describe("safeEventPreventAll", () => {
    it("should prevent default, stop propagation, and stop immediate propagation", () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as Event;

      safeEventPreventAll(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.stopImmediatePropagation).toHaveBeenCalled();
    });

    it("should handle event without stopImmediatePropagation", () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as Event;

      safeEventPreventAll(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("should handle undefined event", () => {
      expect(() => safeEventPreventAll(undefined)).not.toThrow();
    });
  });

  describe("safeEventStop", () => {
    it("should stop propagation only", () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as Event;

      safeEventStop(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("should handle undefined event", () => {
      expect(() => safeEventStop(undefined)).not.toThrow();
    });
  });
});
