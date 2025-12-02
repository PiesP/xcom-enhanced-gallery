import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const tokensPath = join(
  projectRoot,
  "src/shared/styles/design-tokens.semantic.css",
);
const resetPath = join(projectRoot, "src/shared/styles/base/reset.css");

const tokensCss = readFileSync(tokensPath, "utf8");
const resetCss = readFileSync(resetPath, "utf8");

describe("focus styling tokens", () => {
  it("defines flat focus indicator tokens without legacy box-shadows", () => {
    expect(tokensCss).not.toMatch(/--xeg-focus-ring/);
    expect(tokensCss).toMatch(/--xeg-focus-indicator-color:/);
    expect(tokensCss).toMatch(/--xeg-focus-indicator-weight:/);
    expect(tokensCss).not.toMatch(/box-shadow/);
  });

  it("keeps the base reset free from box-shadow based focus styling", () => {
    const focusBlock =
      /:focus-visible[^{]*\{[^}]*\}/gs.exec(resetCss)?.[0] ?? "";
    expect(focusBlock).not.toContain("box-shadow");
    expect(resetCss).not.toMatch(/outline:\s*none/);
  });
});
