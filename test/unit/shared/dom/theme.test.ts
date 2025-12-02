/**
 * @fileoverview Tests for theme DOM helpers
 */
import { THEME_DOM_ATTRIBUTE } from "@shared/constants";
import { syncThemeAttributes, type ThemeName } from "@shared/dom/theme";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("syncThemeAttributes", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
        document.documentElement.removeAttribute(THEME_DOM_ATTRIBUTE);
    });

    it("should sync theme to elements with xeg-theme-scope class", () => {
        const scope1 = document.createElement("div");
        const scope2 = document.createElement("div");
        scope1.className = "xeg-theme-scope";
        scope2.className = "xeg-theme-scope";
        container.appendChild(scope1);
        container.appendChild(scope2);

        syncThemeAttributes("dark");

        expect(scope1.getAttribute(THEME_DOM_ATTRIBUTE)).toBe("dark");
        expect(scope2.getAttribute(THEME_DOM_ATTRIBUTE)).toBe("dark");
    });

    it("should sync theme to provided scopes", () => {
        const customScope = document.createElement("div");
        container.appendChild(customScope);

        syncThemeAttributes("light", { scopes: [customScope] });

        expect(customScope.getAttribute(THEME_DOM_ATTRIBUTE)).toBe("light");
    });

    it("should not modify document root by default", () => {
        const scope = document.createElement("div");
        scope.className = "xeg-theme-scope";
        container.appendChild(scope);

        syncThemeAttributes("dark");

        expect(document.documentElement.hasAttribute(THEME_DOM_ATTRIBUTE)).toBe(
            false,
        );
    });

    it("should include document root when option is true", () => {
        const scope = document.createElement("div");
        scope.className = "xeg-theme-scope";
        container.appendChild(scope);

        syncThemeAttributes("dark", { includeDocumentRoot: true });

        expect(document.documentElement.getAttribute(THEME_DOM_ATTRIBUTE)).toBe(
            "dark",
        );
    });

    it("should handle empty scopes gracefully", () => {
        syncThemeAttributes("light", { scopes: [] });
        // No assertion needed - just ensure no error is thrown
        expect(true).toBe(true);
    });

    it("should work with both light and dark themes", () => {
        const scope = document.createElement("div");
        scope.className = "xeg-theme-scope";
        container.appendChild(scope);

        const themes: ThemeName[] = ["light", "dark"];
        for (const theme of themes) {
            syncThemeAttributes(theme);
            expect(scope.getAttribute(THEME_DOM_ATTRIBUTE)).toBe(theme);
        }
    });

    it("should only apply theme to HTMLElement targets", () => {
        const htmlScope = document.createElement("div");
        htmlScope.className = "xeg-theme-scope";
        container.appendChild(htmlScope);

        // Create an SVG element (not HTMLElement) as a scope
        const svgScope = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgScope.classList.add("xeg-theme-scope");
        container.appendChild(svgScope);

        syncThemeAttributes("dark");

        // HTMLElement should get the attribute
        expect(htmlScope.getAttribute(THEME_DOM_ATTRIBUTE)).toBe("dark");
        // SVGElement should not get the attribute (not an HTMLElement instance)
        expect(svgScope.getAttribute(THEME_DOM_ATTRIBUTE)).toBeNull();
    });
});
