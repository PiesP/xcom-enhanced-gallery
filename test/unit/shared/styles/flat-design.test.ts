import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const cssRoot = join(projectRoot, "src");

interface PatternRule {
  readonly label: string;
  readonly regex: RegExp;
}

const disallowedPatterns: readonly PatternRule[] = [
  { label: "box-shadow property", regex: /(?:^|[\s{;])box-shadow\s*:/gi },
  {
    label: "backdrop-filter property",
    regex: /(?:^|[\s{;])backdrop-filter\s*:/gi,
  },
  { label: "blur filter", regex: /(?:^|[\s{;])filter\s*:\s*[^;]*blur/gi },
  { label: "linear-gradient usage", regex: /linear-gradient\s*\(/gi },
  { label: "radial-gradient usage", regex: /radial-gradient\s*\(/gi },
  { label: "!important flag", regex: /!important/gi },
  { label: "outline reset", regex: /(?:^|[\s{;])outline\s*:\s*none/gi },
];

function collectCssFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectCssFiles(fullPath);
    }

    if (entry.isFile() && entry.name.endsWith(".css")) {
      return [fullPath];
    }

    return [];
  });
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("flat design contract", () => {
  const cssFiles = collectCssFiles(cssRoot);

  it("contains no disallowed styling effects", () => {
    const violations: string[] = [];

    for (const file of cssFiles) {
      const raw = readFileSync(file, "utf8");
      const content = stripComments(raw);

      for (const pattern of disallowedPatterns) {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(content)) {
          violations.push(`${pattern.label} in ${file}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
