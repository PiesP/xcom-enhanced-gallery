/**
 * Core Layer - UserScript Types (Infrastructure에서 이동)
 *
 * UserScript API와 브라우저 환경에 특화된 타입 정의들을 제공합니다.
 * 이는 외부 시스템(UserScript 환경)과의 인터페이스이므로 Core Layer에 위치합니다.
 */

/**
 * UserScript API 함수들
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
declare function GM_setClipboard(
  data: string,
  info?: string | { type?: string; mimetype?: string }
): void; /**
 * GM_xmlhttpRequest 응답 인터페이스
 */
export interface GMXmlHttpRequestResponse {
  readonly responseText: string;
  readonly responseXML?: Document;
  readonly readyState: number;
  readonly responseHeaders: string;
  readonly status: number;
  readonly statusText: string;
  readonly finalUrl: string;
  readonly response?: any;
}

/**
 * GM_xmlhttpRequest 옵션 인터페이스 (개선된 버전)
 */
export interface GMXmlHttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  data?: string | FormData | Blob;
  binary?: boolean;
  timeout?: number;
  context?: any;
  responseType?: 'text' | 'json' | 'blob' | 'arraybuffer' | 'document';
  overrideMimeType?: string;
  anonymous?: boolean;
  fetch?: boolean;
  username?: string;
  password?: string;

  // 이벤트 핸들러
  onload?: (response: GMXmlHttpRequestResponse) => void;
  onerror?: (response: GMXmlHttpRequestResponse) => void;
  onreadystatechange?: (response: GMXmlHttpRequestResponse) => void;
  ontimeout?: () => void;
  onprogress?: (response: ProgressEvent) => void;
  onloadstart?: (response: ProgressEvent) => void;
  onloadend?: (response: ProgressEvent) => void;
  onabort?: () => void;
}

/**
 * GM_xmlhttpRequest 함수
 */
declare function GM_xmlhttpRequest(options: GMXmlHttpRequestOptions): { abort: () => void };

/**
 * Greasemonkey/Tampermonkey API 전역 함수
 */
declare global {
  function GM_xmlhttpRequest(options: GMXmlHttpRequestOptions): void;

  // 기타 GM API
  function GM_setValue(key: string, value: any): void;
  function GM_getValue(key: string, defaultValue?: any): any;
  function GM_deleteValue(key: string): void;
  function GM_listValues(): string[];

  // 정보 API
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
 * UserScript 스크립트 정보 인터페이스
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
  /** 모바일 여부 */
  isMobile: boolean;
  /** 개발 모드 여부 */
  isDevelopment: boolean;
}

/**
 * UserScript 권한 타입
 */
export type UserScriptGrant =
  | 'GM_registerMenuCommand'
  | 'GM_setValue'
  | 'GM_getValue'
  | 'GM_download'
  | 'GM_openInTab'
  | 'GM_notification'
  | 'GM_xmlhttpRequest'
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
