import { resolve } from 'node:path';
import type { Plugin, UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { copyExtensionAssetsPlugin } from '../plugins/copy-extension-assets.ts';
import { cssInlinePlugin } from '../plugins/css-inline.ts';
import { enforceIifePlugin } from '../plugins/enforce-iife.ts';
import { getVersionFromPackageJson } from '../utils/version.ts';

export type ExtensionBrowser = 'chrome' | 'firefox';

interface ExtensionTarget {
  buildTarget: string;
  emptyBackgroundOutDir: boolean;
  inlineBackgroundCss: boolean;
  manifestFile: string;
  outDir: string;
}

const root = resolve(import.meta.dirname, '..', '..', '..');
const targets: Record<ExtensionBrowser, ExtensionTarget> = {
  chrome: {
    buildTarget: 'chrome117',
    emptyBackgroundOutDir: false,
    inlineBackgroundCss: false,
    manifestFile: 'manifest.json',
    outDir: resolve(root, 'dist-extension'),
  },
  firefox: {
    buildTarget: 'firefox128',
    emptyBackgroundOutDir: true,
    inlineBackgroundCss: true,
    manifestFile: 'manifest.firefox.json',
    outDir: resolve(root, 'dist-extension-firefox'),
  },
};

function extensionPlugins(): Plugin[] {
  return [
    solidPlugin({
      solid: {
        omitNestedClosingTags: true,
      },
    }),
  ];
}

function sharedConfig(): Pick<UserConfig, 'define' | 'logLevel' | 'resolve' | 'root'> {
  const version = getVersionFromPackageJson();
  if (!version) {
    throw new Error('package.json does not define a valid version.');
  }

  return {
    root,
    resolve: {
      tsconfigPaths: true,
    },
    define: {
      __DEV__: JSON.stringify(false),
      __FEATURE_MEDIA_EXTRACTION__: JSON.stringify(true),
      __VERSION__: JSON.stringify(version),
    },
    logLevel: 'warn',
  };
}

export function extensionBackgroundConfig(browser: ExtensionBrowser): UserConfig {
  const target = targets[browser];
  const plugins = extensionPlugins();
  plugins.push(
    copyExtensionAssetsPlugin({
      root,
      outDir: target.outDir,
      manifestFile: target.manifestFile,
    })
  );
  if (target.inlineBackgroundCss) {
    plugins.push(cssInlinePlugin());
  }

  return {
    ...sharedConfig(),
    plugins,
    build: {
      outDir: target.outDir,
      emptyOutDir: target.emptyBackgroundOutDir,
      sourcemap: false,
      minify: false,
      target: [target.buildTarget],
      lib: {
        entry: [resolve(root, 'src/extension/background.ts')],
        formats: ['es'],
        fileName: (_format, entryName) => `${entryName}.js`,
      },
      rolldownOptions: {
        output: {
          entryFileNames: 'background.js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  };
}

export function extensionContentConfig(browser: ExtensionBrowser): UserConfig {
  const target = targets[browser];

  return {
    ...sharedConfig(),
    plugins: [...extensionPlugins(), cssInlinePlugin(), enforceIifePlugin(browser)],
    build: {
      outDir: target.outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: false,
      target: [target.buildTarget],
      lib: {
        name: 'XEG',
        entry: [resolve(root, 'src/extension/content.ts')],
        formats: ['iife'],
        fileName: (_format, entryName) => `${entryName}.js`,
      },
      rolldownOptions: {
        output: {
          entryFileNames: 'content.js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  };
}
