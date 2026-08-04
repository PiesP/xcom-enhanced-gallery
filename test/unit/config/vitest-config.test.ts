import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from 'vitest';

describe('Vitest coverage gate', () => {
  it('measures all runtime source files instead of only imported modules', () => {
    const source = readFileSync(resolve(process.cwd(), "vitest.config.ts"), "utf8");

    expect(source).toContain('include: ["src/**/*.{ts,tsx}"]');
    expect(source).not.toMatch(/exclude:[\s\S]*twitter-api-client/);
    expect(source).not.toMatch(/exclude:[\s\S]*media-extraction/);
    expect(source).not.toMatch(/exclude:[\s\S]*gallery-app/);
  });

  it.each(['statements', 'branches', 'functions', 'lines'])(
    'enforces a meaningful %s threshold against the complete source set',
    (metric) => {
      const source = readFileSync(resolve(process.cwd(), "vitest.config.ts"), "utf8");
      const match = source.match(new RegExp(`${metric}:\\s*(\\d+)`));

      expect(match?.[1]).toBeDefined();
      expect(Number(match?.[1])).toBeGreaterThanOrEqual(30);
    }
  );
});
