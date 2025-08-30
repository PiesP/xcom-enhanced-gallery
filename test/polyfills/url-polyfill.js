/**
 * URL Polyfill for JSDOM
 * Node.js URL을 직접 사용하여 JSDOM 환경에서 URL constructor 지원
 */

// JSDOM에서 URL이 정의되지 않은 경우에만 polyfill 적용
let URLConstructor;

async function setupURLPolyfill() {
  if (typeof globalThis.URL === 'undefined') {
    try {
      // Node.js URL 사용
      const nodeUrl = await import('node:url');
      URLConstructor = nodeUrl.URL;
      globalThis.URL = URLConstructor;
      globalThis.console?.log('URL polyfill applied using Node.js URL');
    } catch (error) {
      globalThis.console?.warn('URL polyfill failed:', error);
      // 기본 fallback 구현
      URLConstructor = function URL(url) {
        if (!(this instanceof URLConstructor)) {
          return new URLConstructor(url);
        }

        const urlRegex = /^(https?):\/\/([^/]+)(\/[^?#]*)?\??([^#]*)#?(.*)$/;
        const match = url.match(urlRegex);

        if (!match) {
          throw new Error(`Invalid URL: ${url}`);
        }

        const [, protocol, host, pathname = '/', search = '', hash = ''] = match;

        this.protocol = `${protocol}:`;
        this.host = host;
        this.hostname = host.split(':')[0];
        this.port = host.includes(':') ? host.split(':')[1] : '';
        this.pathname = pathname;
        this.search = search ? `?${search}` : '';
        this.hash = hash ? `#${hash}` : '';
        this.href = url;
        this.origin = `${protocol}://${host}`;

        this.toString = () => this.href;
        return this;
      };
      globalThis.URL = URLConstructor;
    }
  } else {
    URLConstructor = globalThis.URL;
  }

  // window 객체에도 설정 (JSDOM 호환성)
  if (typeof globalThis.window !== 'undefined' && typeof globalThis.window.URL === 'undefined') {
    globalThis.window.URL = URLConstructor;
  }

  return URLConstructor;
}

// 즉시 실행
setupURLPolyfill();

// 기본값으로 export
export { setupURLPolyfill, URLConstructor as URL };
