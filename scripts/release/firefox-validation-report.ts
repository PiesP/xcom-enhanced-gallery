import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const LINTER_VERSION = '10.15.0';
export const FINAL_FIREFOX_ZIP = 'release-bundle/release/xcom-enhanced-gallery-firefox.zip';

type Finding = {
  code?: unknown;
  message?: unknown;
  file?: unknown;
  line?: unknown;
  column?: unknown;
};
export type LinterResult = {
  summary?: { errors?: unknown; warnings?: unknown; notices?: unknown };
  metadata?: { version?: unknown };
  errors?: unknown;
  warnings?: unknown;
  notices?: unknown;
};

export function assessLinterResult(
  result: LinterResult,
  version: string,
  sink: { line: number; column: number }
): void {
  if (
    result.metadata?.version !== version ||
    !Array.isArray(result.errors) ||
    !Array.isArray(result.warnings) ||
    !Array.isArray(result.notices) ||
    result.summary?.errors !== result.errors.length ||
    result.summary?.warnings !== result.warnings.length ||
    result.summary?.notices !== result.notices.length
  ) {
    throw new Error('Malformed addons-linter JSON or extension version mismatch');
  }
  if (result.errors.length !== 0) {
    throw new Error('addons-linter reported errors');
  }
  if (result.warnings.length !== 1) {
    throw new Error('Unreviewed addons-linter warning count');
  }
  const warning = result.warnings[0] as Finding;
  if (
    warning.code !== 'UNSAFE_VAR_ASSIGNMENT' ||
    warning.message !== 'Unsafe assignment to innerHTML' ||
    warning.file !== 'content.js' ||
    warning.line !== sink.line ||
    warning.column !== sink.column
  ) {
    throw new Error('Unreviewed addons-linter warning or changed HTML sink');
  }
}

type Report = {
  schemaVersion?: unknown;
  accepted?: unknown;
  sourceSha?: unknown;
  extensionVersion?: unknown;
  zip?: { path?: unknown; sha256?: unknown };
  linter?: { version?: unknown; command?: unknown; result?: LinterResult };
  disposition?: {
    code?: unknown;
    file?: unknown;
    sink?: unknown;
    dataFlow?: unknown;
    line?: unknown;
    column?: unknown;
    directCalls?: unknown;
  };
};

/** No third-party packages are required in the protected publication job. */
export function verifyFinalFirefoxHandoff(root: string, sourceSha: string, version: string): void {
  const report = JSON.parse(
    readFileSync(resolve(root, 'release-bundle/validation/firefox-final-zip.json'), 'utf8')
  ) as Report;
  const raw = JSON.parse(
    readFileSync(resolve(root, 'release-bundle/validation/addons-linter.json'), 'utf8')
  ) as LinterResult;
  const actual = createHash('sha256')
    .update(readFileSync(resolve(root, FINAL_FIREFOX_ZIP)))
    .digest('hex');
  if (
    report.schemaVersion !== 1 ||
    report.accepted !== true ||
    report.sourceSha !== sourceSha ||
    report.extensionVersion !== version ||
    report.zip?.path !== FINAL_FIREFOX_ZIP ||
    report.zip.sha256 !== actual ||
    report.linter?.version !== LINTER_VERSION ||
    JSON.stringify(report.linter.command) !==
      JSON.stringify(['addons-linter', '--output', 'json', FINAL_FIREFOX_ZIP]) ||
    JSON.stringify(report.linter.result) !== JSON.stringify(raw)
  ) {
    throw new Error(
      'Final Firefox ZIP validation report does not match publication bytes and source'
    );
  }
  const disposition = report.disposition;
  if (
    disposition?.code !== 'UNSAFE_VAR_ASSIGNMENT' ||
    disposition.file !== 'content.js' ||
    disposition.sink !== 'Solid template factory: template.innerHTML = html' ||
    disposition.dataFlow !==
      'Every direct factory HTML input is a static string or interpolation-free template literal; aliases and escapes are rejected.' ||
    !Number.isSafeInteger(disposition.line) ||
    !Number.isSafeInteger(disposition.column) ||
    !Number.isSafeInteger(disposition.directCalls) ||
    Number(disposition.directCalls) < 1
  ) {
    throw new Error('Final Firefox ZIP warning disposition is missing or changed');
  }
  assessLinterResult(raw, version, {
    line: Number(disposition.line),
    column: Number(disposition.column),
  });
}
