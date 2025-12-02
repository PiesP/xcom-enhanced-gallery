import { describe, expect, it } from "vitest";
import { toOptionalAccessor, toRequiredAccessor } from "@shared/utils/solid/solid-helpers";

describe("Toolbar accessor utilities", () => {
  describe("toRequiredAccessor", () => {
    it("returns resolved primitive values when resolver yields constants", () => {
      const accessor = toRequiredAccessor(() => 5, 0);
      expect(accessor()).toBe(5);
    });

    it("falls back when resolver returns undefined and recomputes after changes", () => {
      let current: number | undefined = undefined;
      const accessor = toRequiredAccessor(() => current, 42);

      expect(accessor()).toBe(42);

      current = 7;
      expect(accessor()).toBe(7);

      current = undefined;
      expect(accessor()).toBe(42);
    });

    it("executes accessor functions returned by resolver", () => {
      const accessor = toRequiredAccessor(() => () => 11, 0);
      expect(accessor()).toBe(11);
    });
  });

  describe("toOptionalAccessor", () => {
    it("returns undefined when resolver yields undefined", () => {
      const accessor = toOptionalAccessor(() => undefined);
      expect(accessor()).toBeUndefined();
    });

    it("returns actual values and updates when resolver output changes", () => {
      let value: string | undefined = "fitWidth";
      const accessor = toOptionalAccessor(() => value);

      expect(accessor()).toBe("fitWidth");

      value = "fitHeight";
      expect(accessor()).toBe("fitHeight");

      value = undefined;
      expect(accessor()).toBeUndefined();
    });

    it("unwraps accessor functions provided by resolver", () => {
      const accessorFn = () => "original";
      const accessor = toOptionalAccessor(() => accessorFn);
      expect(accessor()).toBe("original");
    });
  });
});
