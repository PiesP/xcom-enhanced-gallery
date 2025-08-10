/**
 * Ultimate DOM Environment for Testing
 * Phase 2: Complete DOM API Simulation with Enhanced Element Creation
 */

import { vi } from 'vitest';

/**
 * 강화된 DOM 요소 생성 함수
 */
function createEnhancedElement(tagName: string): any {
  const element: any = {
    tagName: tagName.toUpperCase(),
    style: {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
      getPropertyValue: vi.fn(() => ''),
    },
    className: '',
    id: '',
    children: [],
    childNodes: [],
    parentNode: null,
    attributes: new Map(),

    // 핵심 메서드들
    setAttribute: vi.fn((name: string, value: string) => {
      element.attributes.set(name, value);
      if (name === 'class') element.className = value;
      if (name === 'id') element.id = value;
    }),
    getAttribute: vi.fn((name: string) => element.attributes.get(name) || null),
    hasAttribute: vi.fn((name: string) => element.attributes.has(name)),
    removeAttribute: vi.fn((name: string) => element.attributes.delete(name)),

    // 이벤트 관련
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),

    // DOM 조작
    appendChild: vi.fn((child: any) => {
      if (child && typeof child === 'object') {
        element.children.push(child);
        element.childNodes.push(child);
        child.parentNode = element;
      }
      return child;
    }),
    removeChild: vi.fn((child: any) => {
      const index = element.children.indexOf(child);
      if (index > -1) {
        element.children.splice(index, 1);
        element.childNodes.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    }),
    insertBefore: vi.fn((newNode: any, referenceNode: any) => {
      const index = referenceNode
        ? element.children.indexOf(referenceNode)
        : element.children.length;
      element.children.splice(index, 0, newNode);
      element.childNodes.splice(index, 0, newNode);
      newNode.parentNode = element;
      return newNode;
    }),

    // 선택자
    querySelector: vi.fn((selector?: string) => {
      const match = (el: any): boolean => {
        if (!selector || typeof selector !== 'string') return false;
        // id
        if (selector.startsWith('#')) return el.id === selector.slice(1);
        // class
        if (selector.startsWith('.')) return (el.className || '').includes(selector.slice(1));
        // tag
        if (/^[a-zA-Z][a-zA-Z0-9-]*$/.test(selector))
          return (el.tagName || '').toLowerCase() === selector.toLowerCase();
        return false;
      };

      const dfs = (root: any): any => {
        if (!root) return null;
        if (match(root)) return root;
        for (const child of root.children || []) {
          const found = dfs(child);
          if (found) return found;
        }
        return null;
      };

      return dfs(element) || null;
    }),
    querySelectorAll: vi.fn((selector?: string) => {
      const results: any[] = [];
      const match = (el: any): boolean => {
        if (!selector || typeof selector !== 'string') return false;
        if (selector.startsWith('#')) return el.id === selector.slice(1);
        if (selector.startsWith('.')) return (el.className || '').includes(selector.slice(1));
        if (/^[a-zA-Z][a-zA-Z0-9-]*$/.test(selector))
          return (el.tagName || '').toLowerCase() === selector.toLowerCase();
        return false;
      };
      const dfs = (root: any) => {
        if (!root) return;
        if (match(root)) results.push(root);
        for (const child of root.children || []) dfs(child);
      };
      dfs(element);
      return results;
    }),

    // 클래스 관리
    classList: {
      add: vi.fn((...classes: string[]) => {
        classes.forEach(cls => {
          if (!element.className.includes(cls)) {
            element.className = element.className ? `${element.className} ${cls}` : cls;
          }
        });
      }),
      remove: vi.fn((...classes: string[]) => {
        classes.forEach(cls => {
          element.className = element.className.replace(new RegExp(`\\b${cls}\\b`, 'g'), '').trim();
        });
      }),
      contains: vi.fn((cls: string) => element.className.includes(cls)),
      toggle: vi.fn((cls: string) => {
        if (element.className.includes(cls)) {
          element.classList.remove(cls);
          return false;
        } else {
          element.classList.add(cls);
          return true;
        }
      }),
      length: 0,
      item: vi.fn(),
    },

    // 레이아웃 정보
    getBoundingClientRect: vi.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      toJSON: () => ({}),
    })),

    // 상호작용
    click: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    contains: vi.fn((node: any) => {
      const dfs = (root: any): boolean => {
        if (!root) return false;
        if (root === node) return true;
        return (root.children || []).some((c: any) => dfs(c));
      };
      return dfs(element);
    }),

    // 내용 관리
    get innerHTML() {
      return element._innerHTML || '';
    },
    set innerHTML(value: string) {
      element._innerHTML = value;
    },

    get textContent() {
      return element._textContent || '';
    },
    set textContent(value: string) {
      element._textContent = value;
    },
  };

  return element;
}

export function setupUltimateDOMEnvironment(): void {
  console.debug('[Ultimate DOM Environment] 🚀 DOM API 완전 설정 시작...');

  // Document 생성 또는 강화
  if (typeof global.document === 'undefined' || !global.document.createElement) {
    global.document = {
      createElement: vi.fn((tagName: string) => createEnhancedElement(tagName)),
      createTextNode: vi.fn((text: string) => ({
        nodeType: 3,
        textContent: text,
        parentNode: null,
      })),
      createDocumentFragment: vi.fn(() => createEnhancedElement('document-fragment')),

      // 선택자
      querySelector: vi.fn((selector?: string) => {
        // 간단한 선택자 대응: 클래스 선택 시 body/element의 children에서 찾아줌
        if (selector && typeof selector === 'string') {
          if (selector.startsWith('.')) {
            const cls = selector.slice(1);
            // body와 documentElement 하위에서 탐색 (간단 모사)
            const search = (root: any): any => {
              if (!root) return null;
              if (typeof root.className === 'string' && root.className.includes(cls)) return root;
              for (const child of root.children || []) {
                const found = search(child);
                if (found) return found;
              }
              return null;
            };
            return search(global.document.body) || search(global.document.documentElement) || null;
          }
        }
        return null;
      }),
      querySelectorAll: vi.fn(() => []),
      getElementById: vi.fn(() => null),
      getElementsByTagName: vi.fn(() => []),
      getElementsByClassName: vi.fn(() => []),

      // 이벤트
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      createEvent: vi.fn(() => ({
        initEvent: vi.fn(),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        type: '',
        bubbles: false,
        cancelable: false,
      })),

      // 기본 속성
      title: 'Test Document',
      URL: 'http://localhost:3000/test',
      domain: 'localhost',

      body: null as any,
      head: null as any,
      documentElement: null as any,
    };

    // 핵심 DOM 요소들 생성
    global.document.documentElement = createEnhancedElement('html');
    // ThemeService 등에서 사용되는 data-theme 설정 지원
    if (!global.document.documentElement.setAttribute) {
      (global.document.documentElement as any).setAttribute = vi.fn();
    }
    global.document.head = createEnhancedElement('head');
    global.document.body = createEnhancedElement('body');

    // 관계 설정
    global.document.documentElement.appendChild(global.document.head);
    global.document.documentElement.appendChild(global.document.body);
  } else {
    // 이미 존재하는 document를 강화: 누락된 핵심 노드와 API 보강
    const doc: any = global.document as any;
    if (typeof doc.createElement !== 'function') {
      doc.createElement = vi.fn((tagName: string) => createEnhancedElement(tagName));
    }
    if (!doc.documentElement) {
      doc.documentElement = createEnhancedElement('html');
    }
    if (!doc.head) {
      doc.head = createEnhancedElement('head');
      doc.documentElement.appendChild(doc.head);
    }
    if (!doc.body) {
      doc.body = createEnhancedElement('body');
      doc.documentElement.appendChild(doc.body);
    }
    if (typeof doc.getElementById !== 'function') {
      doc.getElementById = vi.fn((id: string) => {
        const dfs = (root: any): any => {
          if (!root) return null;
          if (root.id === id) return root;
          for (const c of root.children || []) {
            const found = dfs(c);
            if (found) return found;
          }
          return null;
        };
        return dfs(doc.documentElement) || null;
      });
    }
    if (typeof doc.querySelector !== 'function') {
      doc.querySelector = vi.fn((selector?: string) => {
        const roots = [doc.head, doc.body, doc.documentElement];
        for (const r of roots) {
          const found = r?.querySelector?.(selector as any);
          if (found) return found;
        }
        return null;
      });
    }
    if (typeof doc.querySelectorAll !== 'function') {
      doc.querySelectorAll = vi.fn((selector?: string) => {
        const results: any[] = [];
        const roots = [doc.head, doc.body, doc.documentElement];
        for (const r of roots) {
          const arr = r?.querySelectorAll?.(selector as any) || [];
          results.push(...arr);
        }
        return results;
      });
    }
  }

  // Window 객체 강화
  if (typeof global.window === 'undefined') {
    global.window = {
      document: global.document,

      // 이벤트
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),

      // 스타일 & 레이아웃
      getComputedStyle: vi.fn(() => ({})),

      // 애니메이션
      requestAnimationFrame: vi.fn(cb => setTimeout(cb, 16)),
      cancelAnimationFrame: vi.fn(),

      // 타이머
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      setInterval: global.setInterval,
      clearInterval: global.clearInterval,

      // 위치 정보
      location: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        hostname: 'localhost',
        port: '3000',
        protocol: 'http:',
        host: 'localhost:3000',
        reload: vi.fn(),
        assign: vi.fn(),
        replace: vi.fn(),
      },

      // 옵저버들
      MutationObserver: vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => []),
      })),

      ResizeObserver: vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),

      IntersectionObserver: vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => []),
      })),

      // 콘솔
      console: global.console,

      // 기타
      innerWidth: 1024,
      innerHeight: 768,
      devicePixelRatio: 1,
      navigator: {
        userAgent: 'Test Browser',
        platform: 'Test Platform',
      },
    } as any;
  }

  // Element 기본 클래스 설정 (일부 라이브러리에서 필요)
  if (typeof global.Element === 'undefined') {
    global.Element = function () {} as any;
    global.Element.prototype = {
      getAttribute: vi.fn(),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      hasAttribute: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  }

  // HTMLElement 기본 클래스 설정
  if (typeof global.HTMLElement === 'undefined') {
    global.HTMLElement = function () {} as any;
    global.HTMLElement.prototype = Object.create(global.Element.prototype);
  }

  console.debug('[Ultimate DOM Environment] ✅ DOM API 완전 설정 완료!');
}

export function cleanupUltimateDOMEnvironment(): void {
  // body 내용 정리 - 안전한 방법 사용
  try {
    if (global.document?.body) {
      // children.length 직접 설정 대신 innerHTML 초기화 사용
      global.document.body.innerHTML = '';

      // 또는 removeChild 사용
      while (global.document.body.firstChild) {
        global.document.body.removeChild(global.document.body.firstChild);
      }
    }
  } catch (error) {
    // DOM 정리 실패 시 조용히 처리
    console.warn('[DOM Cleanup] Warning:', error);
  }

  // console.debug가 없는 환경에서 safe하게 처리
  if (typeof console.debug === 'function') {
    console.debug('[Ultimate DOM Environment] ✅ 환경 정리 완료');
  }
}
