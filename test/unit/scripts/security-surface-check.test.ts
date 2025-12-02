import { describe, expect, it } from "vitest";
import {
  buildStdoutReport,
  runSecuritySurfaceCheck,
  summarizeAlerts,
} from "scripts/security-surface-check";
import type {
  AlertDescriptor,
  AlertSummary,
  CommandRunner,
  SecuritySourceDescriptor,
  SecuritySurfaceResult,
} from "scripts/security-surface-check";

describe("security-surface-check", () => {
  it("summarizes alerts with severity buckets and limited samples", () => {
    interface MockAlert {
      severity: string;
      title: string;
    }

    const alerts: MockAlert[] = [
      { severity: "high", title: "A" },
      { severity: "LOW", title: "B" },
      { severity: "HIGH", title: "C" },
      { severity: "info", title: "D" },
    ];

    const descriptor: AlertDescriptor<MockAlert> = {
      kind: "Mock Alerts",
      severityAccessor: (record) => record.severity,
      labelAccessor: (record) => record.title,
      maxSamples: 2,
    };

    const summary = summarizeAlerts(alerts, descriptor);

    expect(summary.total).toBe(4);
    expect(summary.severityBreakdown).toEqual([
      { severity: "high", count: 2 },
      { severity: "info", count: 1 },
      { severity: "low", count: 1 },
    ]);
    expect(summary.samples).toEqual([
      { label: "A", severity: "high" },
      { label: "B", severity: "low" },
    ]);
  });

  it("skips execution when gh CLI is unavailable", () => {
    const result: SecuritySurfaceResult = runSecuritySurfaceCheck({
      runner: () => ({ status: 1, stdout: "", stderr: "command not found" }),
      sources: [],
    });

    expect(result.skippedReason).toMatch(/gh cli/i);
  });

  it("aggregates alerts from gh api output when available", () => {
    const payload = [
      { level: "critical", title: "Token leak" },
      { level: "low", title: "Outdated dep" },
    ];

    const runner: CommandRunner = (_command, args) => {
      if (args[0] === "--version") {
        return { status: 0, stdout: "gh version 2.0.0", stderr: "" };
      }

      if (args[0] === "auth") {
        return { status: 0, stdout: "", stderr: "" };
      }

      if (args[0] === "api") {
        return { status: 0, stdout: JSON.stringify(payload), stderr: "" };
      }

      return { status: 0, stdout: "", stderr: "" };
    };

    const sources: SecuritySourceDescriptor<{
      level: string;
      title: string;
    }>[] = [
      {
        kind: "Mock Alerts",
        endpoint: "/mock",
        severityAccessor: (record) => record.level,
        labelAccessor: (record) => record.title,
        maxSamples: 1,
      },
    ];

    const result = runSecuritySurfaceCheck({ runner, sources });

    expect(result.skippedReason).toBeUndefined();
    expect(result.summaries[0]?.total).toBe(2);
    expect(result.summaries[0]?.severityBreakdown).toEqual([
      { severity: "critical", count: 1 },
      { severity: "low", count: 1 },
    ]);
    expect(result.summaries[0]?.samples).toEqual([
      { label: "Token leak", severity: "critical" },
    ]);
  });

  it("builds a report for stdout describing open alerts", () => {
    const summary: AlertSummary = {
      kind: "Dependabot Alerts",
      total: 2,
      severityBreakdown: [
        { severity: "critical", count: 1 },
        { severity: "high", count: 1 },
      ],
      samples: [
        {
          label: "lodash (package.json)",
          severity: "critical",
          url: "https://github.com/foo/bar/security/dependabot/1",
        },
        { label: "glob (package-lock.json)", severity: "high" },
      ],
    };

    const lines = buildStdoutReport([summary]);

    expect(lines[0]).toMatch(/open alerts detected/i);
    expect(lines.some((line) => line.includes("Dependabot Alerts"))).toBe(true);
    expect(lines.some((line) => line.includes("critical=1"))).toBe(true);
    expect(lines.some((line) => line.includes("Sample details"))).toBe(true);
    expect(
      lines.some((line) => line.includes("[CRITICAL] lodash (package.json)")),
    ).toBe(true);
    expect(
      lines.some((line) =>
        line.includes("https://github.com/foo/bar/security/dependabot/1"),
      ),
    ).toBe(true);
  });

  it("reports clean state when no alerts exist", () => {
    const lines = buildStdoutReport([
      {
        kind: "Code Scanning Alerts",
        total: 0,
        severityBreakdown: [],
        samples: [],
      },
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/no open alerts/i);
  });

  it("includes severity-tagged links in summaries when descriptors provide them", () => {
    const runner: CommandRunner = (_command, args) => {
      if (args[0] === "--version" || args[0] === "auth") {
        return { status: 0, stdout: "", stderr: "" };
      }

      if (args[0] === "api") {
        return {
          status: 0,
          stdout: JSON.stringify([
            {
              level: "high",
              title: "Deprecated JS API",
              html_url: "https://example.com/alert/1",
            },
          ]),
          stderr: "",
        };
      }

      return { status: 0, stdout: "", stderr: "" };
    };

    const sources: SecuritySourceDescriptor<{
      level: string;
      title: string;
      html_url: string;
    }>[] = [
      {
        kind: "Mock Alerts",
        endpoint: "/mock",
        severityAccessor: (record) => record.level,
        labelAccessor: (record) => record.title,
        maxSamples: 1,
        linkAccessor: (record) => record.html_url,
      },
    ];

    const result = runSecuritySurfaceCheck({ runner, sources });

    expect(result.summaries[0]?.samples).toEqual([
      {
        label: "Deprecated JS API",
        severity: "high",
        url: "https://example.com/alert/1",
      },
    ]);
  });
});
