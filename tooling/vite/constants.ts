import type { UserscriptBaseConfig } from './types';

export const STYLE_ID = 'xeg-injected-styles' as const;

export const OUTPUT_FILE_NAMES = {
  dev: 'xcom-enhanced-gallery.dev.user.js',
  prod: 'xcom-enhanced-gallery.user.js',
  meta: 'xcom-enhanced-gallery.meta.js',
} as const;

export const LICENSE_OUTPUT_FILES = {
  project: 'LICENSE',
  thirdPartyDir: 'LICENSES',
  combined: 'LICENSES.txt',
} as const;

export const CDN_BASE_URL =
  'https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@release/dist' as const;

const BROWSER_COMPATIBILITY = {
  chrome: '117',
  firefox: '119',
  edge: '117',
  safari: '17',
} as const;

export const USERSCRIPT_CONFIG = {
  name: 'X.com Enhanced Gallery',
  namespace: 'https://github.com/PiesP/xcom-enhanced-gallery',
  description: 'Media viewer and download functionality for X.com',
  author: 'PiesP',
  license: 'MIT',
  // Note: `https://*.x.com/*` does not match the root domain (`https://x.com/*`) in
  // common userscript managers. Include both to ensure the script runs on x.com.
  match: ['https://x.com/*', 'https://*.x.com/*'],
  grant: [
    'GM_setValue',
    'GM_getValue',
    'GM_deleteValue',
    'GM_listValues',
    'GM_download',
    'GM_notification',
    'GM_xmlhttpRequest',
    'GM_cookie',
  ],
  connect: ['pbs.twimg.com', 'video.twimg.com', 'api.twitter.com'],
  runAt: 'document-idle' as const,
  supportURL: 'https://github.com/PiesP/xcom-enhanced-gallery/issues',
  homepageURL: 'https://github.com/PiesP/xcom-enhanced-gallery',
  icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
  noframes: true,
  compatible: BROWSER_COMPATIBILITY,
} as const satisfies UserscriptBaseConfig;

export const LICENSE_NAME_MAP: Record<string, string> = {
  'solid-js': 'Solid.js',
  lucide: 'Lucide',
  'lucide-ISC': 'Lucide',
  'xcom-enhanced-gallery': 'X.com Enhanced Gallery',
};
