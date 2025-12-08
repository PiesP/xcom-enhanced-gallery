/// <reference lib="deno.ns" />
/**
 * Deno Build Script for X.com Enhanced Gallery Userscript
 *
 * Uses Vite with vite-plugin-solid for bundling SolidJS code.
 * Based on: https://deno.com/blog/build-solidjs-with-deno
 *
 * Quality checks are enforced before bundling:
 * - Type checking (deno check)
 * - Linting (deno lint)
 * - Format checking (deno fmt --check)
 *
 * Usage:
 *   deno task build              # Production build with quality checks
 *   deno task build:dev          # Development build with quality checks
 *   deno task build:fast         # Production build without quality checks
 *   deno task build:dev:fast     # Development build without quality checks
 */

import { build as viteBuild, type InlineConfig, type Plugin } from 'npm:vite@^6.0.0';
import solidPlugin from 'npm:vite-plugin-solid@^2.11.0';
import { resolve } from 'node:path';
import { generateUserscriptMeta, type UserscriptConfig } from './userscript-meta.ts';
import { aggregateLicenses } from './license-aggregator.ts';

const DIST_DIR = './dist';
const ENTRY_POINT = './src/main.ts';

/**
 * Vite plugin to inline CSS into JavaScript bundle
 * Optimized for Tampermonkey/userscript environments:
 * - Prevents duplicate style injection
 * - CSP-safe style injection (no inline styles)
 * - Layer order preservation for CSS cascade
 */
function cssInlinePlugin(isDev = false): Plugin {
  const STYLE_ID = 'xeg-injected-styles';

  return {
    name: 'css-inline',
    apply: 'build',
    enforce: 'post', // Run after other CSS plugins

    // Process generated CSS bundle and inline it
    generateBundle(_options, bundle) {
      let cssContent = '';

      // Extract CSS from bundle (Vite generates style.css from CSS modules)
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && asset.type === 'asset') {
          const source = asset.source;
          if (typeof source === 'string') {
            cssContent += source + '\n';
          } else if (source instanceof Uint8Array) {
            cssContent += new TextDecoder().decode(source) + '\n';
          }
          // Remove the CSS file from bundle
          delete bundle[fileName];
        }
      }

      // Skip if no CSS collected
      if (!cssContent.trim()) {
        return;
      }

      // Keep CSS readable (no minification for userscript debugging)
      const processedCss = cssContent;

      // Find JS entry and inject CSS with duplicate prevention
      for (const [_fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          const cssInjection = `
(function() {
  'use strict';
  if (typeof document === 'undefined') return;

  // Prevent duplicate injection (userscript may reload)
  var existingStyle = document.getElementById('${STYLE_ID}');
  if (existingStyle) {
    existingStyle.textContent = ${JSON.stringify(processedCss)};
    return;
  }

  // Create style element with ID for tracking
  var style = document.createElement('style');
  style.id = '${STYLE_ID}';
  style.setAttribute('data-xeg-version', '${isDev ? 'dev' : 'prod'}');
  style.textContent = ${JSON.stringify(processedCss)};

  // Insert at the end of head for proper cascade order
  (document.head || document.documentElement).appendChild(style);
})();
`;
          chunk.code = cssInjection + chunk.code;
        }
      }
    },
  };
}

interface BuildOptions {
  dev: boolean;
  version?: string;
  skipChecks: boolean;
}

function parseArgs(): BuildOptions {
  const args = Deno.args;
  return {
    dev: args.includes('--dev'),
    version: args.find((arg) => arg.startsWith('--version='))?.split('=')[1],
    skipChecks: args.includes('--skip-checks') || args.includes('--fast'),
  };
}

async function getVersion(options: BuildOptions): Promise<string> {
  if (options.version) {
    return options.version;
  }

  // Try to get version from git tag
  try {
    const command = new Deno.Command('git', {
      args: ['describe', '--tags', '--abbrev=0'],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { stdout, success } = await command.output();
    if (success) {
      const version = new TextDecoder().decode(stdout).trim();
      // Remove 'v' prefix if present
      return version.startsWith('v') ? version.slice(1) : version;
    }
  } catch {
    // Ignore git errors
  }

  // Default version for development
  return options.dev ? '0.0.0-dev' : '1.0.0';
}

async function ensureDistDir(): Promise<void> {
  try {
    await Deno.mkdir(DIST_DIR, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Run a command and return whether it succeeded
 */
async function runCommand(
  command: string,
  args: string[],
  description: string,
): Promise<boolean> {
  console.log(`🔍 ${description}...`);

  const cmd = new Deno.Command(command, {
    args,
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const { success } = await cmd.output();

  if (!success) {
    console.error(`❌ ${description} failed`);
    return false;
  }

  console.log(`✅ ${description} passed`);
  return true;
}

/**
 * Run all quality checks (type check, lint, format)
 */
async function runQualityChecks(): Promise<boolean> {
  console.log('📋 Running quality checks...\n');

  // Type check using TypeScript compiler via Deno (build-specific tsconfig)
  const typeCheckPassed = await runCommand(
    'deno',
    ['run', '-A', 'npm:typescript/tsc', '--noEmit', '--project', 'tsconfig.build.json'],
    'Type checking',
  );
  if (!typeCheckPassed) {
    return false;
  }

  // Lint check
  const lintPassed = await runCommand(
    'deno',
    ['lint'],
    'Linting',
  );
  if (!lintPassed) {
    return false;
  }

  // Format check
  const formatPassed = await runCommand(
    'deno',
    ['fmt', '--check'],
    'Format checking',
  );
  if (!formatPassed) {
    console.log('\n💡 Tip: Run "deno task fmt" to auto-fix formatting issues.\n');
    return false;
  }

  console.log('\n✅ All quality checks passed!\n');
  return true;
}

interface BundleResult {
  code: string;
  sourceMap?: string;
}

/**
 * Create Vite configuration for building
 * Optimized for Deno + Tampermonkey userscript environment
 */
function createViteConfig(isDev: boolean): InlineConfig {
  const cwd = Deno.cwd();
  const outputFileName = isDev
    ? 'xcom-enhanced-gallery.dev.user.js'
    : 'xcom-enhanced-gallery.user.js';

  return {
    plugins: [solidPlugin(), cssInlinePlugin(isDev)],
    configFile: false,
    root: cwd,

    resolve: {
      alias: {
        '@': resolve(cwd, 'src'),
        '@bootstrap': resolve(cwd, 'src/bootstrap'),
        '@constants': resolve(cwd, 'src/constants'),
        '@features': resolve(cwd, 'src/features'),
        '@shared': resolve(cwd, 'src/shared'),
        '@styles': resolve(cwd, 'src/styles'),
        '@types': resolve(cwd, 'src/types'),
      },
    },

    build: {
      target: 'esnext',
      minify: false, // Userscript source should be readable
      sourcemap: isDev ? 'inline' : false, // Inline sourcemap for dev
      outDir: 'dist',
      emptyOutDir: false,
      write: true,
      // Disable CSS code splitting - inline into JS
      cssCodeSplit: false,
      // CSS minification handled by our plugin for better control
      cssMinify: false,

      lib: {
        entry: resolve(cwd, ENTRY_POINT),
        name: 'XcomEnhancedGallery',
        formats: ['iife'],
        fileName: () => outputFileName.replace('.user.js', ''),
        // Disable CSS file output for library mode
        cssFileName: 'style',
      },

      rollupOptions: {
        output: {
          entryFileNames: outputFileName,
          // Inline dynamic imports for userscript
          inlineDynamicImports: true,
          // Use named exports to suppress warning
          exports: 'named',
        },
      },
    },

    css: {
      // CSS Modules configuration optimized for userscript
      modules: {
        // Predictable class names in dev, short hashes in prod
        generateScopedName: isDev ? '[name]__[local]__[hash:base64:5]' : 'xeg_[hash:base64:6]',
        // Export camelCase class names for JS compatibility
        localsConvention: 'camelCaseOnly',
        // Scope behavior - local by default
        scopeBehaviour: 'local',
      },
      // Disable devSourcemap in production for smaller bundles
      devSourcemap: isDev,
    },

    define: {
      __DEV__: JSON.stringify(isDev),
      'import.meta.env.MODE': JSON.stringify(isDev ? 'development' : 'production'),
      'import.meta.env.DEV': JSON.stringify(isDev),
      'import.meta.env.PROD': JSON.stringify(!isDev),
    },

    logLevel: 'warn',
  };
}

/**
 * Bundle source code using Vite
 */
async function bundleWithVite(dev: boolean): Promise<BundleResult> {
  console.log(`📦 Bundling with Vite (${dev ? 'development' : 'production'})...`);

  const config = createViteConfig(dev);
  await viteBuild(config);

  // Read the generated output
  const outputFileName = dev
    ? 'xcom-enhanced-gallery.dev.user.js'
    : 'xcom-enhanced-gallery.user.js';
  const outputPath = `${DIST_DIR}/${outputFileName}`;

  const code = await Deno.readTextFile(outputPath);

  let sourceMap: string | undefined;
  if (dev) {
    try {
      sourceMap = await Deno.readTextFile(`${outputPath}.map`);
    } catch {
      // Sourcemap may be inline
    }
  }

  // Clean up any generated CSS files (CSS should be inlined)
  try {
    for await (const entry of Deno.readDir(DIST_DIR)) {
      if (entry.name.endsWith('.css')) {
        await Deno.remove(`${DIST_DIR}/${entry.name}`);
      }
    }
  } catch {
    // Ignore cleanup errors
  }

  // Remove the auto-generated sourceMappingURL if present (we'll manage it ourselves)
  const cleanCode = code.replace(/\n?\/\/# sourceMappingURL=.*$/m, '');

  return { code: cleanCode, sourceMap };
}

async function build(): Promise<void> {
  const startTime = performance.now();
  const options = parseArgs();

  console.log('🚀 Starting X.com Enhanced Gallery build...\n');

  // Get version
  const version = await getVersion(options);
  console.log(`📌 Version: ${version}`);
  console.log(`🔧 Mode: ${options.dev ? 'Development' : 'Production'}`);
  console.log(`🔒 Quality checks: ${options.skipChecks ? 'Skipped' : 'Enabled'}\n`);

  // Run quality checks unless skipped
  if (!options.skipChecks) {
    const checksPass = await runQualityChecks();
    if (!checksPass) {
      console.error('❌ Build aborted due to quality check failures.');
      console.log('\n💡 Tips:');
      console.log('   • Run "deno task check" to see type errors');
      console.log('   • Run "deno task lint" to see lint errors');
      console.log('   • Run "deno task fmt" to auto-fix formatting');
      console.log('   • Use "--skip-checks" or "--fast" to bypass checks\n');
      Deno.exit(1);
    }
  }

  // Ensure dist directory exists
  await ensureDistDir();

  // Bundle source code using Vite
  const bundleResult = await bundleWithVite(options.dev);

  // Aggregate licenses
  const licenses = await aggregateLicenses('./LICENSES');

  // Generate userscript config
  const config: UserscriptConfig = {
    name: 'X.com Enhanced Gallery',
    namespace: 'https://github.com/PiesP/xcom-enhanced-gallery',
    version,
    description: 'Media viewer and download functionality for X.com',
    author: 'PiesP',
    license: 'MIT',
    match: ['https://*.x.com/*'],
    grant: [
      'GM_setValue',
      'GM_getValue',
      'GM_download',
      'GM_notification',
      'GM_xmlhttpRequest',
    ],
    connect: ['pbs.twimg.com', 'video.twimg.com', 'api.twitter.com'],
    runAt: 'document-idle',
    supportURL: 'https://github.com/PiesP/xcom-enhanced-gallery/issues',
    downloadURL:
      `https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@v${version}/dist/xcom-enhanced-gallery.user.js`,
    updateURL:
      `https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@v${version}/dist/xcom-enhanced-gallery.user.js`,
    noframes: true,
  };

  // Generate userscript metadata
  const metadata = generateUserscriptMeta(config, licenses);

  // Write output file
  const outputFileName = options.dev
    ? 'xcom-enhanced-gallery.dev.user.js'
    : 'xcom-enhanced-gallery.user.js';
  const outputPath = `${DIST_DIR}/${outputFileName}`;

  // Add sourceMappingURL comment if source map exists
  let finalCode = bundleResult.code;
  if (options.dev && bundleResult.sourceMap) {
    const sourceMapFileName = `${outputFileName}.map`;
    finalCode += `\n//# sourceMappingURL=${sourceMapFileName}\n`;
  }

  // Combine metadata and bundled code
  const userscript = `${metadata}\n${finalCode}`;

  await Deno.writeTextFile(outputPath, userscript);

  // Write source map file if in dev mode
  if (options.dev && bundleResult.sourceMap) {
    const sourceMapPath = `${outputPath}.map`;
    await Deno.writeTextFile(sourceMapPath, bundleResult.sourceMap);
    console.log(`🗺️  Source map: ${sourceMapPath}`);
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Get file size
  const stat = await Deno.stat(outputPath);
  const sizeKB = (stat.size / 1024).toFixed(2);

  console.log(`\n✅ Build complete!`);
  console.log(`📄 Output: ${outputPath}`);
  console.log(`📊 Size: ${sizeKB} KB`);
  console.log(`⏱️  Duration: ${duration}s\n`);
}

// Run build
if (import.meta.main) {
  try {
    await build();
  } catch (error) {
    console.error('❌ Build failed:', error);
    Deno.exit(1);
  }
}
