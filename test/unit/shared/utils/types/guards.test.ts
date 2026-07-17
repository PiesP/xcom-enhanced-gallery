// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from "vitest";
import { createEventListener, isHTMLElement, isRecord } from "@shared/utils/types/guards";

describe("isHTMLElement", () => {
  it("returns true for HTMLElement instances", () => {
    const div = document.createElement("div");
    expect(isHTMLElement(div)).toBe(true);

    const span = document.createElement("span");
    expect(isHTMLElement(span)).toBe(true);
  });

  it("returns false for non-HTMLElement values", () => {
    expect(isHTMLElement(null)).toBe(false);
    expect(isHTMLElement(undefined)).toBe(false);
    expect(isHTMLElement("string")).toBe(false);
    expect(isHTMLElement(42)).toBe(false);
    expect(isHTMLElement({})).toBe(false);
    expect(isHTMLElement([])).toBe(false);
  });

  it("returns false for plain objects with HTMLElement-like shape", () => {
    const fake = { tagName: "DIV", innerHTML: "" };
    expect(isHTMLElement(fake)).toBe(false);
  });
});

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ key: "value" })).toBe(true);
    expect(isRecord(Object.create(null))).toBe(true);
  });

  it("returns false for null and undefined", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isRecord("string")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(Symbol("test"))).toBe(false);
  });

  it("returns false for functions", () => {
    expect(isRecord(() => {})).toBe(false);
    expect(isRecord(function () {})).toBe(false);
  });
});

describe("createEventListener", () => {
  it("wraps a typed handler as EventListener", () => {
    let receivedEvent: MouseEvent | null = null;
    const handler = (e: MouseEvent) => {
      receivedEvent = e;
    };
    const listener = createEventListener<MouseEvent>(handler);

    const event = new MouseEvent("click");
    listener(event);

    expect(receivedEvent).toBe(event);
  });

  it("passes through events with default type parameter", () => {
    let receivedEvent: Event | null = null;
    const listener = createEventListener((e: Event) => {
      receivedEvent = e;
    });

    const event = new Event("custom");
    listener(event);

    expect(receivedEvent).toBe(event);
  });
});
