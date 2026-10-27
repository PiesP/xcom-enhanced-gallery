import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..', '..');
const reportFile = join(root, 'reports', 'production-footprint.json');
const require = createRequire(import.meta.url);

export interface FootprintFile {
  path: string;
  bytes: number;
  sha256: string;
  kind: 'javascript' | 'css' | 'manifest' | 'notice' | 'asset';
  gzipBytes?: number;
}

export interface BuildFootprint {
  schemaVersion: 1;
  sourceSha: string;
  sourceClean: boolean;
  sourceStateSha256: string;
  coreSha: string;
  lockSha256: string;
  nodeVersion: string;
  pnpmVersion: string;
  viteVersion: string;
  vitePlusVersion: string;
  buildCommand: 'vp run build:all:ci';
  mode: 'production';
  targets: ['userscript', 'chrome', 'firefox'];
  compressionComparison: 'gzip level 9 per JavaScript file; not observed network transfer';
  files: Record<'userscript' | 'chrome' | 'firefox', FootprintFile[]>;
  unpackedBytes: Record<'userscript' | 'chrome' | 'firefox', number>;
  moduleEstimates: Record<
    | 'userscript'
    | 'chrome-background'
    | 'chrome-content'
    | 'firefox-background'
    | 'firefox-content',
    {
      target: string;
      runId: string | null;
      buildOptions: {
        mode: string;
        minify: string | boolean;
        sourcemap: string | boolean;
        target: string | string[] | false;
        formats: string[];
      };
      method: string;
      categories: Record<string, { modules: number; renderedBytesEstimate: number }>;
    }
  >;
}

export type BuildInputs = Pick<
  BuildFootprint,
  | 'sourceSha'
  | 'sourceClean'
  | 'sourceStateSha256'
  | 'coreSha'
  | 'lockSha256'
  | 'nodeVersion'
  | 'pnpmVersion'
  | 'viteVersion'
  | 'vitePlusVersion'
>;

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function readRegularFile(path: string, errorMessage: string): Buffer {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
  try {
    if (!fstatSync(fd).isFile()) {
      throw new Error(errorMessage);
    }
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

function readUntrackedSource(path: string, errorMessage: string): Buffer | string {
  try {
    return readlinkSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EINVAL') {
      throw error;
    }
  }
  return readRegularFile(path, errorMessage);
}

function command(file: string, args: string[]): string {
  return execFileSync(file, args, { cwd: root, encoding: 'utf8' }).trim();
}

function version(packageName: string): string {
  return (require(`${packageName}/package.json`) as { version: string }).version;
}

function fileKind(path: string): FootprintFile['kind'] {
  if (path.endsWith('.js')) {
    return 'javascript';
  }
  if (path.endsWith('.css')) {
    return 'css';
  }
  if (path.endsWith('manifest.json')) {
    return 'manifest';
  }
  if (path === 'LICENSE' || path === 'NOTICE.md' || path.startsWith('LICENSES/')) {
    return 'notice';
  }
  return 'asset';
}

function inventory(directory: string, selected?: ReadonlySet<string>): FootprintFile[] {
  const result: FootprintFile[] = [];
  function visit(folder: string): void {
    for (const name of readdirSync(folder).sort()) {
      const fullPath = join(folder, name);
      const stat = lstatSync(fullPath);
      if (stat.isDirectory()) {
        visit(fullPath);
      } else if (stat.isFile()) {
        const path = relative(directory, fullPath).replaceAll('\\', '/');
        if (selected && !selected.has(path)) {
          continue;
        }
        const bytes = readRegularFile(fullPath, `Non-regular distribution input: ${fullPath}`);
        result.push({
          path,
          bytes: bytes.length,
          sha256: sha256(bytes),
          kind: fileKind(path),
          ...(path.endsWith('.js') ? { gzipBytes: gzipSync(bytes, { level: 9 }).length } : {}),
        });
      } else {
        throw new Error(`Non-regular distribution input: ${fullPath}`);
      }
    }
  }
  visit(directory);
  if (selected && result.length !== selected.size) {
    throw new Error('Production userscript or metadata is missing');
  }
  return result;
}

export function captureBuildInputs(): BuildInputs {
  const coreSha = command('git', ['rev-parse', 'HEAD:packages/core']);
  if (command('git', ['-C', 'packages/core', 'rev-parse', 'HEAD']) !== coreSha) {
    throw new Error('Checked-out core does not match the recorded gitlink');
  }
  const sourceStatus = command('git', ['status', '--porcelain', '--untracked-files=all']);
  const sourceState = createHash('sha256');
  sourceState.update(sourceStatus).update('\0');
  sourceState.update(command('git', ['diff', '--binary', 'HEAD'])).update('\0');
  const untracked = command('git', ['ls-files', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean)
    .sort();
  for (const path of untracked) {
    const file = join(root, path);
    sourceState.update(path).update('\0');
    sourceState.update(readUntrackedSource(file, `Unsupported untracked source entry: ${path}`));
    sourceState.update('\0');
  }
  const coreStatus = command('git', [
    '-C',
    'packages/core',
    'status',
    '--porcelain',
    '--untracked-files=all',
  ]);
  sourceState.update(coreStatus).update('\0');
  sourceState
    .update(command('git', ['-C', 'packages/core', 'diff', '--binary', 'HEAD']))
    .update('\0');
  const coreUntracked = command('git', [
    '-C',
    'packages/core',
    'ls-files',
    '--others',
    '--exclude-standard',
    '-z',
  ])
    .split('\0')
    .filter(Boolean)
    .sort();
  for (const path of coreUntracked) {
    const file = join(root, 'packages/core', path);
    sourceState.update(path).update('\0');
    sourceState.update(readUntrackedSource(file, `Unsupported untracked core entry: ${path}`));
    sourceState.update('\0');
  }
  return {
    sourceSha: command('git', ['rev-parse', 'HEAD']),
    sourceClean: sourceStatus === '' && coreStatus === '',
    sourceStateSha256: sourceState.digest('hex'),
    coreSha,
    lockSha256: sha256(readFileSync(join(root, 'pnpm-lock.yaml'))),
    nodeVersion: process.versions.node,
    pnpmVersion: command('vp', ['exec', 'pnpm', '--version']),
    viteVersion: version('vite'),
    vitePlusVersion: version('vite-plus'),
  };
}

/** The build wrapper calls this only after every production target succeeds. */
function collectBuildFootprint(runId: string): BuildFootprint {
  const inputs = captureBuildInputs();
  const files = {
    userscript: inventory(
      join(root, 'dist'),
      new Set(['xcom-enhanced-gallery.user.js', 'xcom-enhanced-gallery.meta.js'])
    ),
    chrome: inventory(join(root, 'dist-extension')),
    firefox: inventory(join(root, 'dist-extension-firefox')),
  };
  for (const target of ['chrome', 'firefox'] as const) {
    if (!files[target].some((file) => file.path === 'manifest.json')) {
      throw new Error(`Missing ${target} distribution manifest`);
    }
  }
  const moduleEstimates = {} as BuildFootprint['moduleEstimates'];
  for (const target of [
    'userscript',
    'chrome-background',
    'chrome-content',
    'firefox-background',
    'firefox-content',
  ] as const) {
    const report = JSON.parse(
      readFileSync(join(root, 'reports', `modules-${target}.json`), 'utf8')
    ) as BuildFootprint['moduleEstimates'][typeof target];
    if (
      report.target !== target ||
      report.runId !== runId ||
      report.buildOptions?.mode !== 'production' ||
      !report.method ||
      !report.categories ||
      !Object.hasOwn(report.categories, 'application') ||
      Object.values(report.categories).reduce((total, category) => total + category.modules, 0) ===
        0 ||
      Object.values(report.categories).some(
        (category) =>
          !Number.isSafeInteger(category.modules) ||
          !Number.isSafeInteger(category.renderedBytesEstimate) ||
          category.modules < 0 ||
          category.renderedBytesEstimate < 0
      )
    ) {
      throw new Error(`Invalid emitted module estimate for ${target}`);
    }
    moduleEstimates[target] = report;
  }
  return {
    schemaVersion: 1,
    ...inputs,
    buildCommand: 'vp run build:all:ci',
    mode: 'production',
    targets: ['userscript', 'chrome', 'firefox'],
    compressionComparison: 'gzip level 9 per JavaScript file; not observed network transfer',
    files,
    unpackedBytes: {
      userscript: files.userscript.reduce((total, file) => total + file.bytes, 0),
      chrome: files.chrome.reduce((total, file) => total + file.bytes, 0),
      firefox: files.firefox.reduce((total, file) => total + file.bytes, 0),
    },
    moduleEstimates,
  };
}

export function writeBuildFootprint(start: BuildInputs, runId: string): void {
  const observed = collectBuildFootprint(runId);
  const end: BuildInputs = {
    sourceSha: observed.sourceSha,
    sourceClean: observed.sourceClean,
    sourceStateSha256: observed.sourceStateSha256,
    coreSha: observed.coreSha,
    lockSha256: observed.lockSha256,
    nodeVersion: observed.nodeVersion,
    pnpmVersion: observed.pnpmVersion,
    viteVersion: observed.viteVersion,
    vitePlusVersion: observed.vitePlusVersion,
  };
  if (JSON.stringify(start) !== JSON.stringify(end)) {
    throw new Error('Production build inputs changed during target builds');
  }
  const report = {
    ...observed,
    producedAt: new Date().toISOString(),
    runId,
  };
  mkdirSync(join(root, 'reports'), { recursive: true });
  writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Production footprint recorded in ${relative(root, reportFile)}`);
}

/** A failed new build must not leave an older successful receipt active. */
export function beginBuildFootprint(runId: string): void {
  if (existsSync(reportFile)) {
    renameSync(reportFile, join(root, 'reports', `production-footprint-before-${runId}.json`));
  }
}

export function verifiedBuildFootprint(): BuildFootprint & { producedAt: string; runId: string } {
  let serialized: string;
  try {
    serialized = readFileSync(reportFile, 'utf8');
  } catch {
    throw new Error(
      'Production footprint is missing; run vp run build:all:ci before release:prepare'
    );
  }
  const saved = JSON.parse(serialized) as BuildFootprint & {
    producedAt: string;
    runId: string;
  };
  const { producedAt, runId, ...identity } = saved;
  if (
    !producedAt ||
    !runId ||
    JSON.stringify(identity) !== JSON.stringify(collectBuildFootprint(runId))
  ) {
    throw new Error(
      'Production footprint differs from source, tools or distribution files; rebuild all targets'
    );
  }
  if (!saved.sourceClean) {
    throw new Error(
      'Production footprint was built from a dirty source; rebuild from clean source'
    );
  }
  return saved;
}
