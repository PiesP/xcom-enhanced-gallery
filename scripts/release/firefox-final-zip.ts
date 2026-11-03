import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { inspectStaticTemplate } from '../check/firefox-static-template.ts';
import {
  assessLinterResult,
  FINAL_FIREFOX_ZIP,
  LINTER_VERSION,
  type LinterResult,
} from './firefox-validation-report.ts';

function zipMember(zip: string, member: string): string {
  const entries = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).trim().split('\n');
  if (entries.filter((entry) => entry === member).length !== 1) {
    throw new Error(`Firefox ZIP must contain exactly one ${member}`);
  }
  return execFileSync('unzip', ['-p', zip, member], { encoding: 'utf8', maxBuffer: 20_000_000 });
}

export function validateFinalFirefoxZip(
  zipPath: string,
  sourceSha: string,
  version: string,
  evidenceDir: string,
  linterPath = resolve(import.meta.dirname, '../../node_modules/.bin/addons-linter')
): void {
  if (!/^[0-9a-f]{40}$/.test(sourceSha) || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Final Firefox validation requires a source SHA and extension version');
  }
  mkdirSync(evidenceDir, { recursive: true });
  const zipSha256 = createHash('sha256').update(readFileSync(zipPath)).digest('hex');
  const manifest = JSON.parse(zipMember(zipPath, 'manifest.json')) as { version?: string };
  if (manifest.version !== version) {
    throw new Error('Firefox ZIP manifest version mismatch');
  }
  const content = zipMember(zipPath, 'content.js');
  const staticTemplate = inspectStaticTemplate(content);
  const root = resolve(import.meta.dirname, '../..');
  const commandZip = zipPath === resolve(root, FINAL_FIREFOX_ZIP) ? FINAL_FIREFOX_ZIP : zipPath;
  const linterVersion = spawnSync(linterPath, ['--version'], { encoding: 'utf8' });
  if (linterVersion.status !== 0 || linterVersion.stdout.trim() !== LINTER_VERSION) {
    throw new Error('Pinned addons-linter version is unavailable or changed');
  }
  const command = ['addons-linter', '--output', 'json', commandZip];
  const run = spawnSync(linterPath, ['--output', 'json', commandZip], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20_000_000,
  });
  writeFileSync(join(evidenceDir, 'addons-linter.json'), run.stdout ?? '');
  if (run.status !== 0) {
    throw new Error(`addons-linter failed: ${run.stderr || run.status}`);
  }
  const result = JSON.parse(run.stdout) as LinterResult;
  assessLinterResult(result, version, staticTemplate);
  const afterLinterSha256 = createHash('sha256').update(readFileSync(zipPath)).digest('hex');
  if (afterLinterSha256 !== zipSha256) {
    throw new Error('Final Firefox ZIP bytes changed during validation');
  }
  const report = {
    schemaVersion: 1,
    accepted: true,
    sourceSha,
    extensionVersion: version,
    zip: { path: commandZip, sha256: zipSha256 },
    contentSha256: createHash('sha256').update(content).digest('hex'),
    linter: { version: LINTER_VERSION, command, result },
    disposition: {
      code: 'UNSAFE_VAR_ASSIGNMENT',
      file: 'content.js',
      sink: 'Solid template factory: template.innerHTML = html',
      dataFlow:
        'Every direct factory HTML input is a static string or interpolation-free template literal; aliases and escapes are rejected.',
      line: staticTemplate.line,
      column: staticTemplate.column,
      directCalls: staticTemplate.calls,
    },
  };
  writeFileSync(
    join(evidenceDir, 'firefox-final-zip.json'),
    `${JSON.stringify(report, null, 2)}\n`
  );
}

if (import.meta.main) {
  const root = resolve(import.meta.dirname, '../..');
  const zip = process.argv[2] ?? FINAL_FIREFOX_ZIP;
  validateFinalFirefoxZip(
    resolve(root, zip),
    process.env.RELEASE_SHA ?? '',
    process.env.RELEASE_VERSION ?? '',
    resolve(root, process.argv[3] ?? 'release-bundle/validation')
  );
}
