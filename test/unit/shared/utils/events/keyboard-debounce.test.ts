import {
    resetKeyboardDebounceState,
    shouldExecuteKeyboardAction,
    shouldExecutePlayPauseKey,
    shouldExecuteVideoControlKey,
} from "@shared/utils/events/keyboard-debounce";
import { logger } from "@shared/logging";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("keyboard-debounce", () => {
  beforeEach(() => {
    resetKeyboardDebounceState();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("shouldExecuteKeyboardAction", () => {
    it("should allow execution on first call", () => {
      expect(shouldExecuteKeyboardAction("a")).toBe(true);
    });

    it("should block execution if called too quickly with same key", () => {
      shouldExecuteKeyboardAction("a");
      expect(shouldExecuteKeyboardAction("a")).toBe(false);
      expect(logger.debug).toHaveBeenCalled();
    });

    it("should allow execution if called after interval", () => {
      shouldExecuteKeyboardAction("a");
      vi.advanceTimersByTime(101);
      expect(shouldExecuteKeyboardAction("a")).toBe(true);
    });

    it("should allow execution if key changes", () => {
      shouldExecuteKeyboardAction("a");
      expect(shouldExecuteKeyboardAction("b")).toBe(true);
    });
  });

  describe("shouldExecuteVideoControlKey", () => {
    it("should debounce ArrowUp", () => {
      expect(shouldExecuteVideoControlKey("ArrowUp")).toBe(true);
      expect(shouldExecuteVideoControlKey("ArrowUp")).toBe(false);
      vi.advanceTimersByTime(101);
      expect(shouldExecuteVideoControlKey("ArrowUp")).toBe(true);
    });

    it("should not debounce other keys", () => {
      expect(shouldExecuteVideoControlKey("a")).toBe(true);
      expect(shouldExecuteVideoControlKey("a")).toBe(true);
    });
  });

  describe("shouldExecutePlayPauseKey", () => {
    it("should debounce Space", () => {
      expect(shouldExecutePlayPauseKey(" ")).toBe(true);
      expect(shouldExecutePlayPauseKey(" ")).toBe(false);
      vi.advanceTimersByTime(151);
      expect(shouldExecutePlayPauseKey(" ")).toBe(true);
    });

    it("should not debounce other keys", () => {
      expect(shouldExecutePlayPauseKey("a")).toBe(true);
      expect(shouldExecutePlayPauseKey("a")).toBe(true);
    });
  });

  describe("resetKeyboardDebounceState", () => {
    it("should reset state and log debug", () => {
      resetKeyboardDebounceState();
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining("State reset"));
    });
  });
});
