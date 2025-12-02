import { getErrorMessage } from "@shared/error/utils";
import { describe, expect, it } from "vitest";

describe("getErrorMessage", () => {
  it("should return message from Error object", () => {
    const error = new Error("test error");
    expect(getErrorMessage(error)).toBe("test error");
  });

  it("should return string error as is", () => {
    expect(getErrorMessage("string error")).toBe("string error");
  });

  it("should return message property from object", () => {
    expect(getErrorMessage({ message: "object error" })).toBe("object error");
  });

  it("should handle object with non-string message", () => {
    expect(getErrorMessage({ message: 123 })).toBe("123");
  });

  it("should handle null/undefined", () => {
    expect(getErrorMessage(null)).toBe("");
    expect(getErrorMessage(undefined)).toBe("");
  });

  it("should handle other types", () => {
    expect(getErrorMessage(123)).toBe("123");
  });
});
