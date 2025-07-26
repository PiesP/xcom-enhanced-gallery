/**
 * 테스트 팩토리 함수들
 * 테스트용 데이터와 객체를 생성하는 유틸리티 함수들
 */

// ================================
// Mock URL Factory
// ================================

/**
 * 트위터 미디어 URL 생성
 */
export function createMockMediaUrl(type = 'image', options = {}) {
  const defaults = {
    id: 'test123',
    format: type === 'video' ? 'mp4' : 'jpg',
    quality: 'large',
  };

  const config = { ...defaults, ...options };

  if (type === 'video') {
    return `https://video.twimg.com/tweet_video/${config.id}.${config.format}`;
  } else {
    return `https://pbs.twimg.com/media/${config.id}?format=${config.format}&name=${config.quality}`;
  }
}

/**
 * 다양한 품질의 이미지 URL 생성
 */
export function createMockImageUrls(id = 'test123') {
  return {
    thumb: createMockMediaUrl('image', { id, quality: 'thumb' }),
    small: createMockMediaUrl('image', { id, quality: 'small' }),
    medium: createMockMediaUrl('image', { id, quality: 'medium' }),
    large: createMockMediaUrl('image', { id, quality: 'large' }),
  };
}

// ================================
// Mock DOM Element Factory
// ================================

/**
 * 가짜 DOM 요소 생성
 */
export function createMockElement(tagName = 'div', attributes = {}) {
  const element = {
    tagName: tagName.toUpperCase(),
    getAttribute: function (name) {
      return this.attributes[name] || null;
    },
    setAttribute: function (name, value) {
      this.attributes[name] = value;
    },
    hasAttribute: function (name) {
      return name in this.attributes;
    },
    classList: {
      contains: function (className) {
        return (element.className || '').split(' ').includes(className);
      },
      add: function (className) {
        const current = element.className || '';
        if (!this.contains(className)) {
          element.className = current ? `${current} ${className}` : className;
        }
      },
      remove: function (className) {
        const classes = (element.className || '').split(' ').filter(c => c !== className);
        element.className = classes.join(' ');
      },
    },
    style: {},
    textContent: '',
    innerHTML: '',
    attributes: {},
    onclick: null,
    onkeydown: null,
    onkeypress: null,
    tabIndex: -1,
    querySelectorAll: function () {
      return [];
    },
    querySelector: function () {
      return null;
    },
    addEventListener: function () {
      return true;
    },
  };

  // 속성 설정
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
    if (key === 'class') {
      element.className = value;
    } else {
      element[key] = value;
    }
  });

  return element;
}

/**
 * 가짜 이미지 요소 생성
 */
export function createMockImageElement(src, attributes = {}) {
  const defaultAttrs = {
    src,
    alt: 'Test image',
    loading: 'lazy',
  };

  const element = createMockElement('img', { ...defaultAttrs, ...attributes });
  element.src = src;
  element.naturalWidth = attributes.width || 1920;
  element.naturalHeight = attributes.height || 1080;

  return element;
}

/**
 * 가짜 비디오 요소 생성
 */
export function createMockVideoElement(src, attributes = {}) {
  const defaultAttrs = {
    src,
    controls: true,
    muted: true,
  };

  const element = createMockElement('video', { ...defaultAttrs, ...attributes });
  element.src = src;
  element.duration = attributes.duration || 30;
  element.videoWidth = attributes.width || 1920;
  element.videoHeight = attributes.height || 1080;

  return element;
}

// ================================
// Mock Media Item Factory
// ================================

/**
 * 가짜 미디어 아이템 생성
 */
export function createMockMediaItem(type = 'image', options = {}) {
  const url = createMockMediaUrl(type, options);

  return {
    url,
    type,
    originalUrl: options.originalUrl || url,
    altText: options.altText || `Test ${type}`,
    ...options,
  };
}

/**
 * 가짜 이미지 정보 생성
 */
export function createMockImageInfo(options = {}) {
  const defaults = {
    src: createMockMediaUrl('image'),
    alt: 'Test image',
    width: 1920,
    height: 1080,
  };

  return { ...defaults, ...options };
}

/**
 * 가짜 비디오 정보 생성
 */
export function createMockVideoInfo(options = {}) {
  const defaults = {
    src: createMockMediaUrl('video'),
    poster: createMockMediaUrl('image'),
    duration: 30,
  };

  return { ...defaults, ...options };
}

// ================================
// Mock Gallery State Factory
// ================================

/**
 * 가짜 갤러리 상태 생성
 */
export function createMockGalleryState(options = {}) {
  const defaults = {
    isOpen: false,
    currentIndex: 0,
    items: [],
  };

  return { ...defaults, ...options };
}

/**
 * 오픈된 갤러리 상태 생성 (아이템 포함)
 */
export function createMockOpenGalleryState(itemCount = 3) {
  const items = Array.from({ length: itemCount }, (_, i) =>
    createMockMediaItem('image', { id: `img${i}` })
  );

  return createMockGalleryState({
    isOpen: true,
    currentIndex: 0,
    items,
  });
}

// ================================
// Mock Event Factory
// ================================

/**
 * 가짜 마우스 이벤트 생성
 */
export function createMockMouseEvent(type = 'click', options = {}) {
  const defaults = {
    type,
    bubbles: true,
    cancelable: true,
    clientX: 100,
    clientY: 100,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
  };

  return { ...defaults, ...options };
}

/**
 * 가짜 키보드 이벤트 생성
 */
export function createMockKeyboardEvent(key, type = 'keydown', options = {}) {
  const defaults = {
    type,
    bubbles: true,
    cancelable: true,
    key,
    code: key,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
  };

  return { ...defaults, ...options };
}

/**
 * 가짜 드래그 이벤트 생성
 */
export function createMockDragEvent(type = 'dragstart', options = {}) {
  const defaults = {
    type,
    bubbles: true,
    cancelable: true,
    dataTransfer: {
      getData: function () {
        return '';
      },
      setData: function () {},
      files: [],
    },
  };

  return { ...defaults, ...options };
}

// ================================
// Mock Tweet Structure Factory
// ================================

/**
 * 가짜 트윗 구조 생성
 */
export function createMockTweetStructure(mediaCount = 1, mediaType = 'image') {
  const media = Array.from({ length: mediaCount }, (_, i) => {
    if (mediaType === 'image') {
      return createMockImageElement(createMockMediaUrl('image', { id: `img${i}` }));
    } else {
      return createMockVideoElement(createMockMediaUrl('video', { id: `vid${i}` }));
    }
  });

  const tweetElement = createMockElement('article', {
    'data-testid': 'tweet',
  });

  tweetElement.querySelectorAll = function (selector) {
    if (selector.includes('img')) {
      return media.filter(m => m.tagName === 'IMG');
    } else if (selector.includes('video')) {
      return media.filter(m => m.tagName === 'VIDEO');
    }
    return media;
  };

  return tweetElement;
}

// ================================
// Utility Functions
// ================================

/**
 * 비동기 대기 유틸리티
 */
export function wait(ms = 0) {
  return new Promise(resolve => {
    const timeoutFn = globalThis.setTimeout || globalThis.window?.setTimeout;
    if (timeoutFn) {
      timeoutFn(resolve, ms);
    } else {
      resolve();
    }
  });
}

/**
 * 무작위 ID 생성
 */
export function generateRandomId(prefix = 'test') {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 가짜 성능 메트릭 생성
 */
export function createMockPerformanceMetrics(options = {}) {
  const defaults = {
    loadTime: 150,
    renderTime: 50,
    memoryUsage: 1024 * 1024, // 1MB
    errorCount: 0,
  };

  return { ...defaults, ...options };
}
