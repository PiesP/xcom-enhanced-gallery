import type { Plugin } from 'vite';
import { getBuildModeConfig } from '../build-mode';
import { USERSCRIPT_CONFIG } from '../constants';
import {
  collectUsedUserscriptConnects,
  collectUsedUserscriptGrants,
  generateUserscriptHeader,
} from '../userscript/metadata';
import { resolveVersion } from '../version';

export function userscriptHeaderPlugin(mode: string): Plugin {
  const isDev = mode === 'development';
  const version = resolveVersion(isDev);
  const buildMode = getBuildModeConfig(mode);
  const autoGrantRaw = process.env.XEG_BUILD_AUTO_GRANT;
  const autoGrantEnabled =
    autoGrantRaw === '1' || autoGrantRaw?.toLowerCase?.() === 'true' || autoGrantRaw === 'on';
  const autoGrantReportOnly = autoGrantRaw?.toLowerCase?.() === 'report';

  // Auto-detect `@connect` hosts similarly to how grants are auto-detected.
  const autoConnectRaw = process.env.XEG_BUILD_AUTO_CONNECT;
  const autoConnectEnabled =
    autoConnectRaw === '1' || autoConnectRaw?.toLowerCase?.() === 'true' || autoConnectRaw === 'on';
  const autoConnectReportOnly = autoConnectRaw?.toLowerCase?.() === 'report';

  return {
    name: 'userscript-header',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      let grantOverride: readonly string[] | undefined;
      let connectOverride: readonly string[] | undefined;

      if (autoGrantEnabled || autoGrantReportOnly) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            const usedGrants = collectUsedUserscriptGrants(chunk.code, USERSCRIPT_CONFIG.grant);
            const finalGrants = usedGrants.length > 0 ? usedGrants : [...USERSCRIPT_CONFIG.grant];

            if (autoGrantReportOnly || isDev) {
              console.log(
                `[userscript] Auto-grant ${autoGrantReportOnly ? 'report' : 'enabled'}:`,
                finalGrants
              );
            }

            if (autoGrantEnabled) {
              grantOverride = finalGrants;
            }

            break;
          }
        }
      }

      if (autoConnectEnabled || autoConnectReportOnly) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            const usedConnects = collectUsedUserscriptConnects(
              chunk.code,
              USERSCRIPT_CONFIG.connect
            );
            const finalConnects =
              usedConnects.length > 0 ? usedConnects : [...USERSCRIPT_CONFIG.connect];

            if (autoConnectReportOnly || isDev) {
              console.log(
                `[userscript] Auto-connect ${autoConnectReportOnly ? 'report' : 'enabled'}:`,
                finalConnects
              );
            }

            if (autoConnectEnabled) {
              connectOverride = finalConnects;
            }

            break;
          }
        }
      }

      const header = generateUserscriptHeader({
        version,
        isDev,
        ...(grantOverride === undefined ? {} : { grantOverride }),
        ...(connectOverride === undefined ? {} : { connectOverride }),
      });

      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = `${header}\n${chunk.code}`;
          break;
        }
      }
    },

    closeBundle() {
      const modeLabel = isDev ? 'Development' : 'Production';
      const sourceMapLabel =
        buildMode.sourceMap === 'inline' ? 'Inline' : buildMode.sourceMap ? 'External' : 'Disabled';
      const info = isDev
        ? [
            '📖 Optimized for: Debugging & Analysis',
            '├─ CSS class names: Readable (Component__class__hash)',
            '├─ CSS formatting: Preserved',
            '├─ CSS variables: Full names (--xeg-*)',
            '├─ CSS comments: Preserved',
            `└─ Source maps: ${sourceMapLabel}`,
          ]
        : [
            '📦 Optimized for: Distribution Size',
            '├─ CSS class names: Hashed (xg-*)',
            '├─ CSS formatting: Compressed',
            '├─ CSS variables: Shortened',
            '├─ CSS custom properties: Pruned',
            '├─ CSS comments: Removed',
            `└─ Source maps: ${sourceMapLabel}`,
          ];

      console.log(`\n📋 Build Mode: ${modeLabel}`);
      console.log('─'.repeat(50));
      info.forEach((line) => console.log(`   ${line}`));
      console.log('─'.repeat(50));
      console.log(`📌 Version: ${version}`);
    },
  };
}
