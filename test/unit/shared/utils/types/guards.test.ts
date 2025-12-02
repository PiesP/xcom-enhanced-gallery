import {
    createAddEventListenerOptions,
    createEventListener,
    hasElement,
    isAbortSignal,
    isArray,
    isHTMLAnchorElement,
    isHTMLElement,
    isHTMLImageElement,
    isHTMLVideoElement,
    isKeyboardEvent,
    isMouseEvent,
    isNonEmptyString,
    isRecord,
    isWheelEvent,
    toRecord,
} from "@shared/utils/types/guards";
import { describe, expect, it } from "vitest";

describe("type-guards", () => {
  describe("isHTMLElement", () => {
    it("should return true for HTMLElement", () => {
      const el = document.createElement("div");
      expect(isHTMLElement(el)).toBe(true);
    });

    it("should return false for non-HTMLElement", () => {
      expect(isHTMLElement(null)).toBe(false);
      expect(isHTMLElement({})).toBe(false);
      expect(isHTMLElement("string")).toBe(false);
    });
  });

  describe("isHTMLImageElement", () => {
    it("should return true for HTMLImageElement", () => {
      const el = document.createElement("img");
      expect(isHTMLImageElement(el)).toBe(true);
    });

    it("should return false for other elements", () => {
      const el = document.createElement("div");
      expect(isHTMLImageElement(el)).toBe(false);
    });
  });

  describe("isHTMLVideoElement", () => {
    it("should return true for HTMLVideoElement", () => {
      const el = document.createElement("video");
      expect(isHTMLVideoElement(el)).toBe(true);
    });

    it("should return false for other elements", () => {
      const el = document.createElement("div");
      expect(isHTMLVideoElement(el)).toBe(false);
    });
  });

  describe("isHTMLAnchorElement", () => {
    it("should return true for HTMLAnchorElement", () => {
      const el = document.createElement("a");
      expect(isHTMLAnchorElement(el)).toBe(true);
    });

    it("should return false for other elements", () => {
      const el = document.createElement("div");
      expect(isHTMLAnchorElement(el)).toBe(false);
    });
  });

  describe("isWheelEvent", () => {
    it("should return true for WheelEvent", () => {
      const event = new WheelEvent("wheel");
      expect(isWheelEvent(event)).toBe(true);
    });

    it("should return false for other events", () => {
      const event = new Event("click");
      expect(isWheelEvent(event)).toBe(false);
    });
  });

  describe("isKeyboardEvent", () => {
    it("should return true for KeyboardEvent", () => {
      const event = new KeyboardEvent("keydown");
      expect(isKeyboardEvent(event)).toBe(true);
    });

    it("should return false for other events", () => {
      const event = new Event("click");
      expect(isKeyboardEvent(event)).toBe(false);
    });
  });

  describe("createEventListener", () => {
    it("should wrap handler correctly", () => {
      let called = false;
      const handler = (e: MouseEvent) => {
        called = true;
        expect(e.type).toBe("click");
      };
      const wrapped = createEventListener<MouseEvent>(handler);
      const event = new MouseEvent("click");
      wrapped(event);
      expect(called).toBe(true);
    });
  });

  describe("isArray", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it("should return false for non-arrays", () => {
      expect(isArray({})).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray("string")).toBe(false);
    });
  });

  describe("isRecord", () => {
    it("should return true for plain objects", () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ a: 1 })).toBe(true);
    });

    it("should return false for non-objects or arrays", () => {
      expect(isRecord([])).toBe(false);
      expect(isRecord(null)).toBe(false);
      expect(isRecord("string")).toBe(false);
    });
  });

  describe("isAbortSignal", () => {
    it("should return true for AbortSignal", () => {
      const controller = new AbortController();
      expect(isAbortSignal(controller.signal)).toBe(true);
    });

    it("should return false for other values", () => {
      expect(isAbortSignal({})).toBe(false);
      expect(isAbortSignal(null)).toBe(false);
    });
  });

  describe("createAddEventListenerOptions", () => {
    it("should return options object", () => {
      const options = createAddEventListenerOptions({ capture: true });
      expect(options).toEqual({ capture: true });
    });

    it("should return empty object if no options provided", () => {
      const options = createAddEventListenerOptions();
      expect(options).toEqual({});
    });
  });

  describe("toRecord", () => {
    it("should return record if valid", () => {
      const obj = { a: 1 };
      expect(toRecord(obj)).toBe(obj);
    });

    it("should throw error if invalid", () => {
      expect(() => toRecord(null)).toThrow();
      expect(() => toRecord([])).toThrow();
      expect(() => toRecord("string")).toThrow();
    });
  });

  describe("hasElement", () => {
    it("should return true for Element", () => {
      const el = document.createElement("div");
      expect(hasElement(el)).toBe(true);
    });

    it("should return false for non-Element", () => {
      expect(hasElement({})).toBe(false);
      expect(hasElement(null)).toBe(false);
    });
  });

  describe("isMouseEvent", () => {
    it("should return true for MouseEvent", () => {
      const event = new MouseEvent("click");
      expect(isMouseEvent(event)).toBe(true);
    });

    it("should return false for other events", () => {
      const event = new KeyboardEvent("keydown");
      expect(isMouseEvent(event)).toBe(false);
    });
  });

  describe("isNonEmptyString", () => {
    it("should return true for non-empty string", () => {
      expect(isNonEmptyString("hello")).toBe(true);
      expect(isNonEmptyString("  a  ")).toBe(true);
    });

    it("should return false for empty or whitespace string", () => {
      expect(isNonEmptyString("")).toBe(false);
      expect(isNonEmptyString("   ")).toBe(false);
    });

    it("should return false for non-string", () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });
});
