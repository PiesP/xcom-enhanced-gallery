/**
 * Core Layer - UserScript Types (moved from Infrastructure)
 *
 * Provides type definitions specialized for UserScript API and browser environment.
 * These are interfaces with external systems (UserScript environment), so positioned in Core Layer.
 */

/**
 * UserScript API functions
 */
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

/**
 * Greasemonkey/Tampermonkey API global functions
 * Phase 318.1: GM_xmlhttpRequest removed (MV3 unavailable)
 */
declare global {
  // Other GM APIs
  function GM_setValue(key: string, value: any): void;
  function GM_getValue(key: string, defaultValue?: any): any;
  function GM_deleteValue(key: string): void;
  function GM_listValues(): string[];

  // Info API
  function GM_info(): {
    script: {
      name: string;
      version: string;
      namespace: string;
    };
    scriptHandler: string;
    version: string;
  };
}

/**
 * UserScript script information interface
 */
export interface UserScriptInfo {
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
}

/**
 * UserScript 정보 객체
 */
declare const GM_info: UserScriptInfo;

/**
 * 브라우저 환경 감지 유틸리티 타입
 */
export interface BrowserEnvironment {
  /** 사용 중인 UserScript 매니저 */
  userscriptManager: 'tampermonkey' | 'greasemonkey' | 'violentmonkey' | 'unknown';
  /** 브라우저 타입 */
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  /** 개발 모드 여부 */
  isDevelopment: boolean;
}

/**
 * UserScript 권한 타입
 * Phase 318.1: GM_xmlhttpRequest 제거 (MV3 불가)
 */
export type UserScriptGrant =
  | 'GM_registerMenuCommand'
  | 'GM_setValue'
  | 'GM_getValue'
  | 'GM_download'
  | 'GM_openInTab'
  | 'GM_notification'
  | 'GM_addStyle'
  | 'GM_setClipboard';

/**
 * UserScript 연결 권한 타입
 */
export type UserScriptConnect = 'pbs.twimg.com' | 'video.twimg.com' | '*.x.com' | 'x.com';

/**
 * UserScript 실행 시점 타입
 */
export type UserScriptRunAt = 'document-start' | 'document-body' | 'document-end' | 'document-idle';

/**
 * UserScript 메타데이터 인터페이스
 */
export interface UserScriptMetadata {
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  match: string[];
  grant: UserScriptGrant[];
  connect: UserScriptConnect[];
  'run-at': UserScriptRunAt;
  supportURL: string;
  downloadURL: string;
  updateURL: string;
  noframes?: boolean;
}
