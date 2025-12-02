import {
    toAccessor,
} from "@shared/utils/solid/solid-helpers";
import { describe, expect, it } from "vitest";

describe("solid-helpers", () => {
  describe("toAccessor", () => {
    it("should return the function if passed a function", () => {
      const fn = () => 5;
      expect(toAccessor(fn)).toBe(fn);
    });

    it("should return a function returning the value if passed a value", () => {
      const val = 5;
      const accessor = toAccessor(val);
      expect(typeof accessor).toBe("function");
      expect(accessor()).toBe(5);
    });
  });
});
