/**
 * @fileoverview Tests for StyleRegistry
 */
import { StyleRegistry, getStyleRegistry } from "@shared/services/style-registry";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("StyleRegistry", () => {
    let registry: StyleRegistry;

    beforeEach(() => {
        // Reset singleton
        (StyleRegistry as unknown as { instance: null }).instance = null;
        registry = StyleRegistry.getInstance();
    });

    afterEach(() => {
        // Clean up any registered styles
        document.querySelectorAll("style[id^='test-']").forEach((el) => el.remove());
        (StyleRegistry as unknown as { instance: null }).instance = null;
    });

    describe("singleton pattern", () => {
        it("should return the same instance", () => {
            const instance1 = StyleRegistry.getInstance();
            const instance2 = StyleRegistry.getInstance();
            expect(instance1).toBe(instance2);
        });

        it("should be accessible via getStyleRegistry", () => {
            expect(getStyleRegistry()).toBe(registry);
        });
    });

    describe("registerStyle", () => {
        it("should register a new style element", () => {
            const result = registry.registerStyle({
                id: "test-style-1",
                cssText: ".test { color: red; }",
            });

            expect(result).not.toBeNull();
            expect(result?.id).toBe("test-style-1");
            expect(result?.replaced).toBe(false);
            expect(registry.hasStyle("test-style-1")).toBe(true);
        });

        it("should replace existing style when replaceExisting is true", () => {
            registry.registerStyle({
                id: "test-style-2",
                cssText: ".test { color: red; }",
            });

            const result = registry.registerStyle({
                id: "test-style-2",
                cssText: ".test { color: blue; }",
                replaceExisting: true,
            });

            expect(result?.replaced).toBe(true);
            const element = registry.getStyleElement("test-style-2");
            expect(element?.textContent).toContain("blue");
        });

        it("should not replace when replaceExisting is false", () => {
            registry.registerStyle({
                id: "test-style-3",
                cssText: ".test { color: red; }",
            });

            const result = registry.registerStyle({
                id: "test-style-3",
                cssText: ".test { color: blue; }",
                replaceExisting: false,
            });

            expect(result?.replaced).toBe(false);
            const element = registry.getStyleElement("test-style-3");
            expect(element?.textContent).toContain("red");
        });

        it("should ignore empty CSS text", () => {
            const result = registry.registerStyle({
                id: "test-style-4",
                cssText: "   ",
            });

            expect(result).toBeNull();
            expect(registry.hasStyle("test-style-4")).toBe(false);
        });

        it("should apply custom attributes", () => {
            const result = registry.registerStyle({
                id: "test-style-5",
                cssText: ".test { color: red; }",
                attributes: {
                    "data-layer": "xeg",
                    "data-priority": 10,
                },
            });

            expect(result?.element.getAttribute("data-layer")).toBe("xeg");
            expect(result?.element.getAttribute("data-priority")).toBe("10");
        });

        it("should skip undefined attributes", () => {
            const result = registry.registerStyle({
                id: "test-style-6",
                cssText: ".test { color: red; }",
                attributes: {
                    "data-present": "yes",
                    "data-absent": undefined,
                },
            });

            expect(result?.element.getAttribute("data-present")).toBe("yes");
            expect(result?.element.hasAttribute("data-absent")).toBe(false);
        });
    });

    describe("removeStyle", () => {
        it("should remove registered style", () => {
            registry.registerStyle({
                id: "test-style-7",
                cssText: ".test { color: red; }",
            });

            registry.removeStyle("test-style-7");

            expect(registry.hasStyle("test-style-7")).toBe(false);
            expect(document.getElementById("test-style-7")).toBeNull();
        });

        it("should handle removing non-existent style gracefully", () => {
            // Should not throw
            registry.removeStyle("non-existent-style");
            expect(registry.hasStyle("non-existent-style")).toBe(false);
        });
    });

    describe("hasStyle", () => {
        it("should return true for registered styles", () => {
            registry.registerStyle({
                id: "test-style-8",
                cssText: ".test { color: red; }",
            });

            expect(registry.hasStyle("test-style-8")).toBe(true);
        });

        it("should return false for unregistered styles", () => {
            expect(registry.hasStyle("non-existent")).toBe(false);
        });

        it("should detect styles added to DOM directly", () => {
            const style = document.createElement("style");
            style.id = "test-style-9";
            style.textContent = ".test { color: red; }";
            document.head.appendChild(style);

            expect(registry.hasStyle("test-style-9")).toBe(true);
        });
    });

    describe("getStyleElement", () => {
        it("should return the style element", () => {
            registry.registerStyle({
                id: "test-style-10",
                cssText: ".test { color: red; }",
            });

            const element = registry.getStyleElement("test-style-10");
            expect(element).toBeInstanceOf(HTMLStyleElement);
            expect(element?.id).toBe("test-style-10");
        });

        it("should return null for non-existent styles", () => {
            expect(registry.getStyleElement("non-existent")).toBeNull();
        });
    });
});
