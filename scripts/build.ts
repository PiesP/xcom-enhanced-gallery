/// <reference lib="deno.ns" />
/**
 * Deno Build Script for X.com Enhanced Gallery Userscript
 *
 * Orchestrates the build process using Vite configuration from vite.config.ts.
 *
 * Usage:
 *   deno task build              # Production build with quality checks
 *   deno task build:dev          # Development build with quality checks
 *   deno task build:fast         # Production build without quality checks
 *   deno task build:dev:fast     # Development build without quality checks
 */

import { build as viteBuild } from 'npm:vite@^6.0.0';
import { aggregateLicenses } from './license-aggregator.ts';
import {
  BUILD_CONFIG,
  type BuildOptions,
  type BundleResult,
  type CommandResult,
  OUTPUT_FILES,
  USERSCRIPT_CONFIG,
  type UserscriptConfig,
} from './shared/constants.ts';
import * as logger from './shared/logging.ts';
import { generateUserscriptMeta } from './userscript-meta.ts';

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): BuildOptions {
  const args = new Set(Deno.args);
  const versionArg = Deno.args.find((a) => a.startsWith('--version='));

  return {
    dev: args.has('--dev'),
    version: versionArg?.split('=')[1],
    skipChecks: args.has('--skip-checks') || args.has('--fast'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Version
// ─────────────────────────────────────────────────────────────────────────────

async function getVersionFromGit(): Promise<string | null> {
  try {
    const { stdout, success } = await new Deno.Command('git', {
      args: ['describe', '--tags', '--abbrev=0'],
      stdout: 'piped',
      stderr: 'null',
    }).output();

    if (!success) return null;
    const version = new TextDecoder().decode(stdout).trim();
    return version.startsWith('v') ? version.slice(1) : version;
  } catch {
    return null;
  }
}

async function resolveVersion(options: BuildOptions): Promise<string> {
  if (options.version) return options.version;
  const gitVersion = await getVersionFromGit();
  if (gitVersion) return gitVersion;
  return options.dev ? '0.0.0-dev' : '1.0.0';
}

// ─────────────────────────────────────────────────────────────────────────────
// File System
// ─────────────────────────────────────────────────────────────────────────────

async function ensureDistDir(): Promise<void> {
  await Deno.mkdir(BUILD_CONFIG.distDir, { recursive: true }).catch((e) => {
    if (!(e instanceof Deno.errors.AlreadyExists)) throw e;
  });
}

async function cleanupCssFiles(): Promise<void> {
  try {
    for await (const entry of Deno.readDir(BUILD_CONFIG.distDir)) {
      if (entry.name.endsWith('.css')) {
        await Deno.remove(`${BUILD_CONFIG.distDir}/${entry.name}`);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quality Checks
// ─────────────────────────────────────────────────────────────────────────────

const QUALITY_CHECKS = [
  {
    args: ['run', '-A', 'npm:typescript/tsc', '--noEmit', '--project', 'tsconfig.build.json'],
    description: 'Type checking',
  },
  {
    args: ['run', '-A', 'npm:@biomejs/biome', 'check', '--write', './src', './scripts'],
    description: 'Biome lint & format (auto-fix)',
  },
] as const;

async function runCommand(args: readonly string[], description: string): Promise<CommandResult> {
  logger.info(`🔍 ${description}...`);
  const { success } = await new Deno.Command('deno', {
    args: [...args],
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  if (success) logger.info(`✅ ${description} passed`);
  else logger.error(`❌ ${description} failed`);
  return { success, description };
}

async function runQualityChecks(): Promise<boolean> {
  logger.info('📋 Running quality checks...\n');
  const results = await Promise.all(QUALITY_CHECKS.map((c) => runCommand(c.args, c.description)));
  const allPassed = results.every((r) => r.success);

  if (allPassed) {
    logger.info('\n✅ All quality checks passed!\n');
  } else {
    const failed = results.filter((r) => !r.success).map((r) => r.description);
    logger.error(`\n❌ Failed: ${failed.join(', ')}`);
    if (failed.includes('Biome lint & format')) {
      logger.info('💡 Run "deno task biome:check" to auto-fix.\n');
    }
  }
  return allPassed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bundling
// ─────────────────────────────────────────────────────────────────────────────

async function bundleWithVite(isDev: boolean): Promise<BundleResult> {
  const mode = isDev ? 'development' : 'production';
  logger.info(`📦 Bundling with Vite (${mode})...`);

  await viteBuild({ configFile: BUILD_CONFIG.viteConfig, mode });

  const outputFile = isDev ? OUTPUT_FILES.dev : OUTPUT_FILES.prod;
  const outputPath = `${BUILD_CONFIG.distDir}/${outputFile}`;

  const [code] = await Promise.all([Deno.readTextFile(outputPath), cleanupCssFiles()]);

  let sourceMap: string | undefined;
  if (isDev) {
    sourceMap = await Deno.readTextFile(`${outputPath}.map`).catch(() => undefined);
  }

  return {
    code: code.replace(/\n?\/\/# sourceMappingURL=.*$/m, ''),
    sourceMap,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Userscript Config
// ─────────────────────────────────────────────────────────────────────────────

function createUserscriptConfig(version: string): UserscriptConfig {
  return {
    ...USERSCRIPT_CONFIG,
    version,
    downloadURL: USERSCRIPT_CONFIG.cdnBaseUrl,
    updateURL: USERSCRIPT_CONFIG.cdnBaseUrl,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────────────────────

async function writeOutput(
  options: BuildOptions,
  bundle: BundleResult,
  metadata: string
): Promise<{ path: string; sizeKB: string }> {
  const outputFile = options.dev ? OUTPUT_FILES.dev : OUTPUT_FILES.prod;
  const outputPath = `${BUILD_CONFIG.distDir}/${outputFile}`;

  let finalCode = bundle.code;
  if (options.dev && bundle.sourceMap) {
    finalCode += `\n//# sourceMappingURL=${outputFile}.map\n`;
  }

  const userscript = `${metadata}\n${finalCode}`;
  const writes: Promise<void>[] = [Deno.writeTextFile(outputPath, userscript)];

  if (options.dev && bundle.sourceMap) {
    writes.push(Deno.writeTextFile(`${outputPath}.map`, bundle.sourceMap));
    logger.info(`🗺️  Source map: ${outputPath}.map`);
  }

  await Promise.all(writes);
  const { size } = await Deno.stat(outputPath);
  return { path: outputPath, sizeKB: (size / 1024).toFixed(2) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Info
// ─────────────────────────────────────────────────────────────────────────────

function printBuildInfo(isDev: boolean): void {
  const mode = isDev ? 'Development' : 'Production';
  const info = isDev
    ? [
        '📖 Optimized for: Debugging & Analysis',
        '├─ CSS class names: Readable (Component__class__hash)',
        '├─ CSS formatting: Preserved',
        '├─ CSS variables: Full names (--xeg-*)',
        '├─ CSS comments: Preserved',
        '└─ Source maps: Inline',
      ]
    : [
        '📦 Optimized for: Distribution Size',
        '├─ CSS class names: Hashed (xeg_*)',
        '├─ CSS formatting: Compressed',
        '├─ CSS variables: Shortened (194 mappings)',
        '├─ CSS comments: Removed',
        '└─ Source maps: Disabled',
      ];

  logger.info(`\n📋 Build Mode: ${mode}`);
  logger.info('─'.repeat(45));
  info.forEach((line) => logger.info(`   ${line}`));
  logger.info('─'.repeat(45));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function build(): Promise<void> {
  const startTime = performance.now();
  const options = parseArgs();

  logger.info('🚀 Starting X.com Enhanced Gallery build...\n');

  const version = await resolveVersion(options);
  logger.info(`📌 Version: ${version}`);
  logger.info(`🔒 Quality checks: ${options.skipChecks ? 'Skipped' : 'Enabled'}`);

  printBuildInfo(options.dev);

  if (!options.skipChecks && !(await runQualityChecks())) {
    logger.error('❌ Build aborted due to quality check failures.');
    logger.info('\n💡 Tips:');
    logger.info('   • Run "deno task check" to see type errors');
    logger.info('   • Run "deno task lint" to see lint errors');
    logger.info('   • Run "deno task fmt" to auto-fix formatting');
    logger.info('   • Use "--skip-checks" or "--fast" to bypass\n');
    Deno.exit(1);
  }

  await ensureDistDir();

  const [bundle, licenses] = await Promise.all([
    bundleWithVite(options.dev),
    aggregateLicenses(BUILD_CONFIG.licensesDir),
  ]);

  const config = createUserscriptConfig(version);
  const metadata = generateUserscriptMeta(config, licenses);
  const { path, sizeKB } = await writeOutput(options, bundle, metadata);

  const duration = ((performance.now() - startTime) / 1000).toFixed(2);

  logger.info('\n✅ Build complete!');
  logger.info(`📄 Output: ${path}`);
  logger.info(`📊 Size: ${sizeKB} KB`);
  logger.info(`⏱️  Duration: ${duration}s`);

  if (options.dev) {
    logger.info('\n💡 Run "deno task build:fast" for production build.');
  }
  logger.info();
}

if (import.meta.main) {
  try {
    await build();
  } catch (error) {
    logger.error('❌ Build failed:', error);
    Deno.exit(1);
  }
}
