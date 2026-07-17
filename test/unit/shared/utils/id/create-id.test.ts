// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from "vitest";
import { createId, createPrefixedId } from '@shared/utils/id';

describe("createId", () => {
  it("returns a non-empty string", () => {
    const id = createId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });

  it("returns a string without dashes", () => {
    const id = createId();
    expect(id).not.toContain("-");
  });

  it("returns a string with only hex characters (lowercase)", () => {
    const id = createId();
    expect(id).toMatch(/^[0-9a-f]+$/);
  });

  it("generates unique IDs on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()));
    expect(ids.size).toBe(100);
  });

  it("returns exactly 32 characters (UUID without dashes)", () => {
    const id = createId();
    expect(id.length).toBe(32);
  });
});

describe("createPrefixedId", () => {
  it("returns a string with prefix and default separator", () => {
    const id = createPrefixedId("gallery");
    expect(id).toMatch(/^gallery_[0-9a-f]{32}$/);
  });

  it("returns a string with custom separator", () => {
    const id = createPrefixedId("btn", "-");
    expect(id).toMatch(/^btn-[0-9a-f]{32}$/);
  });

  it("ends with a 32-char hex string after the separator", () => {
    const id = createPrefixedId("x");
    const parts = id.split("_");
    expect(parts).toHaveLength(2);
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
  });

  it("generates unique IDs on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createPrefixedId("test")));
    expect(ids.size).toBe(100);
  });
});
