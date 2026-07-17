// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from "vitest";
import { escapeRegExp, cx } from "@shared/utils/text/formatting";

describe("escapeRegExp", () => {
  it("escapes regex special characters", () => {
    expect(escapeRegExp("hello.world")).toBe("hello\\.world");
    expect(escapeRegExp("a*b+c?d")).toBe("a\\*b\\+c\\?d");
    expect(escapeRegExp("(group)")).toBe("\\(group\\)");
    expect(escapeRegExp("[chars]")).toBe("\\[chars\\]");
    expect(escapeRegExp("a{2,3}")).toBe("a\\{2,3\\}");
    expect(escapeRegExp("a^b$c")).toBe("a\\^b\\$c");
    expect(escapeRegExp("a|b")).toBe("a\\|b");
  });

  it("does not escape normal characters", () => {
    expect(escapeRegExp("abcdef")).toBe("abcdef");
    expect(escapeRegExp("12345")).toBe("12345");
  });

  it("returns empty string for empty input", () => {
    expect(escapeRegExp("")).toBe("");
  });

  it("handles already-escaped characters (double escape)", () => {
    // Already-escaped dot becomes double-escaped
    expect(escapeRegExp("a\\.")).toBe("a\\\\\\.");
  });
});

describe("cx", () => {
  it("joins string class names with spaces", () => {
    expect(cx("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("filters out falsy values", () => {
    expect(cx("foo", false, "bar", null, "baz", undefined)).toBe("foo bar baz");
    expect(cx("foo", 0, "bar")).toBe("foo bar");
  });

  it("handles conditional object syntax", () => {
    const result = cx("base", { active: true, disabled: false });
    expect(result).toBe("base active");
  });

  it("handles undefined/null values in object", () => {
    const result = cx({ a: true, b: null, c: undefined });
    expect(result).toBe("a");
  });

  it("handles nested arrays", () => {
    expect(cx(["foo", "bar"])).toBe("foo bar");
    expect(cx("top", ["nested-a", "nested-b"])).toBe("top nested-a nested-b");
  });

  it("handles deeply nested arrays", () => {
    expect(cx("a", ["b", ["c", "d"]])).toBe("a b c d");
  });

  it("returns empty string for no arguments", () => {
    expect(cx()).toBe("");
  });

  it("returns empty string for all falsy", () => {
    expect(cx(false, null, undefined)).toBe("");
  });

  it("handles numbers as class names", () => {
    expect(cx("col", 12)).toBe("col 12");
  });

  it("handles mixed types", () => {
    const result = cx(
      "base",
      { active: true, hidden: false },
      ["nested"],
      null,
      { extra: true },
    );
    expect(result).toBe("base active nested extra");
  });
});
