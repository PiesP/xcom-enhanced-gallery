/**
 * Global Type Declarations for XEG UserScript
 *
 * Provides type definitions for userscript APIs and browser-specific functionality.
 */

// UserScript API declarations
declare function GM_download(url: string, filename: string): void;
declare function GM_getValue(name: string, defaultValue?: any): any;
declare function GM_setValue(name: string, value: any): void;
declare function GM_deleteValue(name: string): void;
declare function GM_listValues(): string[];
declare function GM_getResourceText(name: string): string;
declare function GM_getResourceURL(name: string): string;
declare function GM_addStyle(css: string): HTMLStyleElement;
declare function GM_openInTab(
  url: string,
  options?: { active?: boolean; insert?: boolean; setParent?: boolean }
): void;
declare function GM_registerMenuCommand(name: string, fn: () => void, accessKey?: string): number;
declare function GM_unregisterMenuCommand(menuCmdId: number): void;
declare function GM_notification(
  text: string,
  title?: string,
  image?: string,
  onclick?: () => void
): void;
declare function GM_setClipboard(
  data: string,
  info?: string | { type?: string; mimetype?: string }
): void;
declare function GM_xmlhttpRequest(details: {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  data?: string;
  binary?: boolean;
  timeout?: number;
  context?: any;
  responseType?: 'text' | 'json' | 'blob' | 'arraybuffer' | 'document';
  overrideMimeType?: string;
  anonymous?: boolean;
  fetch?: boolean;
  username?: string;
  password?: string;
  onload?: (response: any) => void;
  onerror?: (response: any) => void;
  onreadystatechange?: (response: any) => void;
  ontimeout?: () => void;
  onprogress?: (response: any) => void;
  onloadstart?: (response: any) => void;
  onloadend?: (response: any) => void;
}): { abort: () => void };

// UserScript info object
declare const GM_info: {
  script: {
    author: string;
    copyright: string;
    description: string;
    excludes: string[];
    homepage: string;
    icon: string;
    icon64: string;
    includes: string[];
    lastModified: number;
    matches: string[];
    name: string;
    namespace: string;
    position: number;
    resources: Array<{
      name: string;
      url: string;
      error?: string;
      content?: string;
    }>;
    'run-at': string;
    supportURL: string;
    system?: boolean;
    unwrap: boolean;
    version: string;
  };
  scriptMetaStr: string;
  scriptSource: string;
  scriptUpdateURL: string;
  scriptWillUpdate: boolean;
  scriptHandler: string;
  isIncognito: boolean;
  downloadMode: string;
  version: string;
};

// Environment detection
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'test';
  }
}

// Vite environment variables
declare const __VERSION__: string;
declare const __DEV__: boolean;
declare const __PROD__: boolean;

// Extend Window interface for XEG
declare global {
  interface Window {
    // XEG_DEBUG?: {  // Currently unused - commented out
    //   getState: () => Record<string, unknown>;
    //   restart: () => Promise<void>;
    // };
    gallerySignals?: any;
  }
}

// Browser compatibility
interface Document {
  webkitExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
  msExitFullscreen?: () => void;
}

interface HTMLElement {
  webkitRequestFullscreen?: () => void;
  mozRequestFullScreen?: () => void;
  msRequestFullscreen?: () => void;
}

// Export to make this a module
export {};
