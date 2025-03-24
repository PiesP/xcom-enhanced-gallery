// ==UserScript==
// @name         X.com Enhanced Image Gallery
// @namespace    https://github.com/PiesP/xcom-enhanced-gallery
// @version      0.9.6
// @description  Enhanced image viewer for X.com that displays original-sized images in a vertical gallery with adjustable view modes and batch download options.
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/js/all.min.js
// ==/UserScript==

// == I18N/locales.js ==
const LOCALE_DATA = {
  "en": {
    "viewer": {
      "title": "Enhanced Image Viewer",
      "controls": {
        "prev": "Previous",
        "next": "Next",
        "close": "Close",
        "download": "Download",
        "downloadZip": "Download All"
      },
      "modes": {
        "original": "Original Size",
        "fitWidth": "Fit to Width",
        "fitHeight": "Fit to Height",
        "fitWindow": "Fit to Window"
      },
      "indicators": {
        "currentImage": "Image {{current}} of {{total}}"
      }
    },
    "download": {
      "filename": "{{username}}_tweet_{{tweetId}}_image_{{index}}",
      "zipName": "{{username}}_tweet_{{tweetId}}_images",
      "preparing": "Preparing download...",
      "complete": "Download complete"
    },
    "errors": {
      "loading": "Failed to load image",
      "download": "Failed to download image"
    },
    "unknownUser": "unknown",
    "unknownID": "unknown"
  },
  "es": {
    "viewer": {
      "title": "Visor de Imágenes Mejorado",
      "controls": {
        "prev": "Anterior",
        "next": "Siguiente",
        "close": "Cerrar",
        "download": "Descargar",
        "downloadZip": "Descargar Todo"
      },
      "modes": {
        "original": "Tamaño Original",
        "fitWidth": "Ajustar al Ancho",
        "fitHeight": "Ajustar a la Altura",
        "fitWindow": "Ajustar a la Ventana"
      },
      "indicators": {
        "currentImage": "Imagen {{current}} de {{total}}"
      }
    },
    "download": {
      "filename": "{{username}}_tweet_{{tweetId}}_imagen_{{index}}",
      "zipName": "{{username}}_tweet_{{tweetId}}_imagenes",
      "preparing": "Preparando descarga...",
      "complete": "Descarga completa"
    },
    "errors": {
      "loading": "Error al cargar la imagen",
      "download": "Error al descargar la imagen"
    },
    "unknownUser": "desconocido",
    "unknownID": "desconocido"
  },
  "fr": {
    "viewer": {
      "title": "Visionneuse d'Images Améliorée",
      "controls": {
        "prev": "Précédent",
        "next": "Suivant",
        "close": "Fermer",
        "download": "Télécharger",
        "downloadZip": "Tout Télécharger"
      },
      "modes": {
        "original": "Taille Originale",
        "fitWidth": "Ajuster à la Largeur",
        "fitHeight": "Ajuster à la Hauteur",
        "fitWindow": "Ajuster à la Fenêtre"
      },
      "indicators": {
        "currentImage": "Image {{current}} sur {{total}}"
      }
    },
    "download": {
      "filename": "{{username}}_tweet_{{tweetId}}_image_{{index}}",
      "zipName": "{{username}}_tweet_{{tweetId}}_images",
      "preparing": "Préparation du téléchargement...",
      "complete": "Téléchargement terminé"
    },
    "errors": {
      "loading": "Échec du chargement de l'image",
      "download": "Échec du téléchargement de l'image"
    },
    "unknownUser": "inconnu",
    "unknownID": "inconnu"
  },
  "ja": {
    "viewer": {
      "title": "拡張画像ビューア",
      "controls": {
        "prev": "前へ",
        "next": "次へ",
        "close": "閉じる",
        "download": "ダウンロード",
        "downloadZip": "すべてダウンロード"
      },
      "modes": {
        "original": "原寸大",
        "fitWidth": "幅に合わせる",
        "fitHeight": "高さに合わせる",
        "fitWindow": "画面に合わせる"
      },
      "indicators": {
        "currentImage": "画像 {{current}}/{{total}}"
      }
    },
    "download": {
      "filename": "{{username}}_ツイート_{{tweetId}}_画像_{{index}}",
      "zipName": "{{username}}_ツイート_{{tweetId}}_画像集",
      "preparing": "ダウンロード準備中...",
      "complete": "ダウンロード完了"
    },
    "errors": {
      "loading": "画像の読み込みに失敗しました",
      "download": "画像のダウンロードに失敗しました"
    },
    "unknownUser": "不明",
    "unknownID": "不明"
  },
  "ko": {
    "viewer": {
      "title": "고급 이미지 뷰어",
      "controls": {
        "prev": "이전",
        "next": "다음",
        "close": "닫기",
        "download": "다운로드",
        "downloadZip": "모두 다운로드"
      },
      "modes": {
        "original": "원본 크기",
        "fitWidth": "너비에 맞춤",
        "fitHeight": "높이에 맞춤",
        "fitWindow": "화면에 맞춤"
      },
      "indicators": {
        "currentImage": "이미지 {{current}}/{{total}}"
      }
    },
    "download": {
      "filename": "{{username}}_트윗_{{tweetId}}_이미지_{{index}}",
      "zipName": "{{username}}_트윗_{{tweetId}}_이미지들",
      "preparing": "다운로드 준비 중...",
      "complete": "다운로드 완료"
    },
    "errors": {
      "loading": "이미지 로딩 실패",
      "download": "이미지 다운로드 실패"
    },
    "unknownUser": "알수없음",
    "unknownID": "알수없음"
  },
  "zh-CN": {
    "viewer": {
      "title": "增强图像查看器",
      "controls": {
        "prev": "上一张",
        "next": "下一张",
        "close": "关闭",
        "download": "下载",
        "downloadZip": "全部下载"
      },
      "modes": {
        "original": "原始尺寸",
        "fitWidth": "适应宽度",
        "fitHeight": "适应高度",
        "fitWindow": "适应窗口"
      },
      "indicators": {
        "currentImage": "图片 {{current}}/{{total}}"
      }
    },
    "download": {
      "filename": "{{username}}_推文_{{tweetId}}_图片_{{index}}",
      "zipName": "{{username}}_推文_{{tweetId}}_图片集",
      "preparing": "准备下载中...",
      "complete": "下载完成"
    },
    "errors": {
      "loading": "加载图片失败",
      "download": "下载图片失败"
    },
    "unknownUser": "未知用户",
    "unknownID": "未知ID"
  }
};

// == debug.js ==

/**
 * 디버그 로그 출력 함수
 * @param {string} message - 로그 메시지
 * @param {any} data - 추가 데이터 (선택 사항)
 */
function debugLog(message, data = null) {
    if (CONFIG.debugMode) {
        if (data) {
            console.log(`[XcomGallery] ${message}`, data);
        } else {
            console.log(`[XcomGallery] ${message}`);
        }
    }
}

// == config.js ==
/**
 * 애플리케이션 전역 설정
 */
const CONFIG = {
    enableMediaTab: true,  // 미디어란 지원 활성화
    debugMode: true        // 디버그 메시지 표시 활성화
};

// == CSS.js ==
const STYLE_ID = 'xcom-image-viewer-styles';

const CSS = `
    /* CSS 변수 기본값 (폴백) */
    :root {
        /* 색상 */
        --xcom-bg-primary: #ffffff;
        --xcom-bg-secondary: #f5f8fa;
        --xcom-bg-tertiary: #e1e8ed;
        --xcom-bg-overlay: rgba(255, 255, 255, 0.9);
        --xcom-bg-modal: rgba(0, 0, 0, 0.7);
        
        --xcom-text-primary: #14171a;
        --xcom-text-secondary: #657786;
        --xcom-text-tertiary: #aab8c2;
        --xcom-text-inverse: #ffffff;
        
        --xcom-accent-primary: #1da1f2;
        --xcom-accent-secondary: #0c7abf;
        --xcom-accent-tertiary: #e1f5fe;
        
        --xcom-border-light: #e1e8ed;
        --xcom-border-medium: #ccd6dd;
        --xcom-border-dark: #657786;
        
        /* 그림자 */
        --xcom-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
        --xcom-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
        --xcom-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
        
        /* 레이아웃 */
        --xcom-radius-sm: 4px;
        --xcom-radius-md: 8px;
        --xcom-radius-lg: 16px;
        --xcom-radius-pill: 9999px;
        
        --xcom-space-xs: 4px;
        --xcom-space-sm: 8px;
        --xcom-space-md: 16px;
        --xcom-space-lg: 24px;
        --xcom-space-xl: 32px;
        
        /* 애니메이션 */
        --xcom-transition-fast: 150ms;
        --xcom-transition-normal: 300ms;
        --xcom-transition-slow: 500ms;
        
        /* 헤더와 바 요소 */
        --xcom-header-bg: rgba(255, 255, 255, 0.85);
        --xcom-header-text: #14171a;
        --xcom-header-border: #e1e8ed;
        --xcom-header-height: 50px;
        
        --xcom-toolbar-bg: rgba(255, 255, 255, 0.85);
        --xcom-toolbar-text: #14171a;
        --xcom-toolbar-border: #e1e8ed;
        
        --xcom-thumbnail-bg: rgba(255, 255, 255, 0.85);
        --xcom-thumbnail-border: #e1e8ed;
        --xcom-thumbnail-active: #1da1f2;
        
        /* 이미지 뷰어 특수 변수 */
        --xcom-backdrop-color: rgba(0, 0, 0, 0.85);
        --xcom-indicator-bg: rgba(0, 0, 0, 0.7);
        --xcom-indicator-text: #ffffff;
        --xcom-button-hover-bg: #f5f8fa;
    }

    /* 테마 전환 시 전환 효과 */
    #xcom-image-viewer * {
        transition: background-color var(--xcom-transition-normal), 
                    color var(--xcom-transition-normal), 
                    border-color var(--xcom-transition-normal), 
                    box-shadow var(--xcom-transition-normal);
    }
    
    #xcom-image-viewer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--xcom-backdrop-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        overflow-y: auto;
        z-index: 10000;
        overscroll-behavior: contain;
        touch-action: pan-y pinch-zoom;
        cursor: pointer;
    }

    #optionsBar {
        width: 100%;
        padding: var(--xcom-space-sm) var(--xcom-space-md);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--xcom-space-sm);
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10004;
        background-color: var(--xcom-toolbar-bg);
        color: var(--xcom-toolbar-text);
        border-bottom: 1px solid var(--xcom-toolbar-border);
        box-shadow: var(--xcom-shadow-sm);
        transition: transform 0.3s ease;
        transform: translateY(0);
        height: var(--xcom-header-height);
    }

    #thumbnailBar {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--xcom-space-sm);
        transition: transform 0.3s ease;
        transform: translateY(0);
        z-index: 10004;
        padding: var(--xcom-space-sm) var(--xcom-space-md);
        margin-bottom: var(--xcom-space-md);
        overflow-x: auto;
        background-color: var(--xcom-thumbnail-bg);
        border-top: 1px solid var(--xcom-thumbnail-border);
    }

    .icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--xcom-space-xs) var(--xcom-space-sm);
        border: none;
        cursor: pointer;
        font-size: 16px;
        border-radius: var(--xcom-radius-sm);
        background-color: transparent;
        color: var(--xcom-toolbar-text);
        transition: all var(--xcom-transition-fast) ease;
    }

    .icon-button:hover {
        background-color: var(--xcom-button-hover-bg);
    }

    .icon-button:focus {
        outline: 2px solid var(--xcom-accent-primary);
    }

    .viewer-image {
        display: block;
        width: auto;
        height: auto;
        max-width: 100%;
        object-fit: contain;
        transition: all 0.3s ease;
        transform-origin: top center;
        margin: 0;
        cursor: pointer;
        user-select: none;
        pointer-events: auto;
        -webkit-user-drag: none;
    }

    .image-container {
        position: relative;
        margin: var(--xcom-space-sm) 0;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
        pointer-events: auto;
        z-index: 10001;
    }

    .image-container-wrapper {
        pointer-events: none;
    }

    .thumbnail {
        height: 60px;
        max-height: 60px;
        cursor: pointer;
        transition: all var(--xcom-transition-normal) ease;
        border: 3px solid transparent;
        pointer-events: auto;
        border-radius: var(--xcom-radius-sm);
    }

    .thumbnail:hover {
        transform: scale(1.05);
        box-shadow: var(--xcom-shadow-md);
    }

    .thumbnail.active {
        border-color: var(--xcom-thumbnail-active);
        transform: scale(1.1);
        box-shadow: var(--xcom-shadow-md);
    }

    .image-indicator {
        position: absolute;
        top: var(--xcom-space-sm);
        right: var(--xcom-space-sm);
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--xcom-accent-primary);
        box-shadow: var(--xcom-shadow-sm);
        pointer-events: none;
        z-index: 10003;
    }

    #current-image-indicator {
        position: fixed;
        bottom: 15px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--xcom-indicator-bg);
        color: var(--xcom-indicator-text);
        padding: var(--xcom-space-sm) var(--xcom-space-md);
        border-radius: var(--xcom-radius-pill);
        font-size: 14px;
        font-weight: bold;
        z-index: 10004;
        pointer-events: none;
        box-shadow: var(--xcom-shadow-md);
    }
    
    /* 테마 토글 버튼 */
    .theme-toggle-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--xcom-radius-sm);
        background-color: transparent;
        color: var(--xcom-toolbar-text);
        font-size: 18px;
        cursor: pointer;
        transition: all var(--xcom-transition-fast) ease;
    }

    .theme-toggle-button:hover {
        background-color: var(--xcom-button-hover-bg);
    }

    /* 반응형 스타일 */
    @media (max-width: 768px) {
        .icon-button {
            padding: var(--xcom-space-xs);
            font-size: 14px;
        }

        #optionsBar {
            flex-wrap: wrap;
            justify-content: space-around;
            padding: var(--xcom-space-xs);
        }

        .thumbnail {
            height: 50px;
        }
        
        /* 모바일 화면에서 더 직관적인 컨트롤 */
        #optionsBar > div {
            flex: 1;
            justify-content: center;
        }
        
        /* 섹션별 간격 조정 */
        #optionsBar > div:nth-child(2) {
            order: 3; /* 모바일에서는 맨 아래로 */
            width: 100%;
            margin-top: var(--xcom-space-xs);
        }
    }
    
    /* 키보드 포커스 스타일 */
    :focus-visible {
        outline: 2px solid var(--xcom-accent-primary);
        outline-offset: 2px;
    }
    
    /* 애니메이션 효과 */
    @keyframes pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
    }
    
    .loading {
        animation: pulse 1.5s infinite ease-in-out;
    }
`;

// == utils/StorageUtils.js ==
/**
 * 로컬 스토리지 관련 유틸리티 함수
 */
class StorageUtils {
    /**
     * 로컬 스토리지에서 항목 가져오기
     * @param {string} key - 로컬 스토리지 키
     * @param {any} defaultValue - 기본값
     * @returns {any} 저장된 값 또는 기본값
     */
    static getLocalStorageItem(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * 로컬 스토리지에 항목 저장
     * @param {string} key - 로컬 스토리지 키
     * @param {any} value - 저장할 값
     */
    static setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`localStorage save failed: ${e.message}`);
        }
    }
}

// == utils/DOMUtils.js ==
/**
 * DOM 관련 유틸리티 함수
 */
class DOMUtils {
    /**
     * 스타일시트 생성
     * @param {string} id - 스타일시트 ID
     * @param {string} cssContent - CSS 내용
     */
    static createStyleSheet(id, cssContent) {
        if (!document.getElementById(id)) {
            const styleSheet = document.createElement('style');
            styleSheet.id = id;
            styleSheet.textContent = cssContent;
            document.head.appendChild(styleSheet);
        }
    }

    /**
     * 사용자 UI 색상 가져오기
     * @returns {Object} bgColor와 textColor를 포함한 객체
     */
    static getUserUIColor() {
        try {
            const computedStyle = getComputedStyle(document.body);
            return {
                bgColor: computedStyle.backgroundColor || 'black',
                textColor: computedStyle.color || 'white'
            };
        } catch (e) {
            return { bgColor: 'black', textColor: 'white' };
        }
    }

    /**
     * 색상에 알파 값 추가
     * @param {string} color - 색상 문자열
     * @param {number} alpha - 알파 값(0~1)
     * @returns {string} 알파 값이 추가된 색상 문자열
     */
    static addAlpha(color, alpha) {
        try {
            if (color.startsWith("rgb(")) {
                return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
            }
            return color;
        } catch (e) {
            return `rgba(0, 0, 0, ${alpha})`;
        }
    }
}

// == utils/URLUtils.js ==
/**
 * URL 관련 유틸리티 함수
 */
class URLUtils {
    /**
     * URL에서 파일 확장자 추출
     * @param {string} url - 이미지 URL
     * @returns {string} 파일 확장자
     */
    static getFileExtension(url) {
        try {
            const urlParams = new URL(url).searchParams;
            const format = urlParams.get('format');
            return format ? format : 'jpg';
        } catch (e) {
            return 'jpg';
        }
    }
}

// == utils/FunctionUtils.js ==
/**
 * 함수 관련 유틸리티
 */
class FunctionUtils {
    /**
     * 디바운스 함수
     * @param {Function} func - 디바운스할 함수
     * @param {number} wait - 대기 시간(ms)
     * @param {boolean} immediate - 첫 호출 시 즉시 실행 여부
     * @returns {Function} 디바운스된 함수
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function(...args) {
            const context = this;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
}

// == Utils.js ==

/**
 * 통합 유틸리티 클래스
 * 분할된 유틸리티 모듈을 하나의 인터페이스로 제공합니다.
 */
class Utils {
    // StorageUtils
    static getLocalStorageItem(key, defaultValue) {
        return StorageUtils.getLocalStorageItem(key, defaultValue);
    }

    static setLocalStorageItem(key, value) {
        StorageUtils.setLocalStorageItem(key, value);
    }

    // DOMUtils
    static createStyleSheet(id, cssContent) {
        DOMUtils.createStyleSheet(id, cssContent);
    }

    static getUserUIColor() {
        return DOMUtils.getUserUIColor();
    }

    static addAlpha(color, alpha) {
        return DOMUtils.addAlpha(color, alpha);
    }

    // URLUtils
    static getFileExtension(url) {
        return URLUtils.getFileExtension(url);
    }

    // FunctionUtils
    static debounce(func, wait, immediate = false) {
        return FunctionUtils.debounce(func, wait, immediate);
    }
}

// == I18N/utils/StringFormatter.js ==
/**
 * 문자열 포맷팅을 위한 유틸리티 클래스
 */
class StringFormatter {
  /**
   * 템플릿 문자열에 변수 값 대입
   * @param {string} template - 템플릿 문자열 (예: "Hello {{name}}")
   * @param {Object} params - 대입할 변수 (예: {name: "World"})
   * @returns {string} 변수가 대입된 문자열
   */
  static format(template, params = {}) {
    if (!template) return '';
    if (!params || typeof params !== 'object') return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }
  
  /**
   * 순서 기반 포맷팅 (인덱스로 변수 참조)
   * @param {string} template - 템플릿 문자열 (예: "Hello {0}, it's {1}")
   * @param  {...any} args - 순서대로 대입할 변수들
   * @returns {string} 변수가 대입된 문자열
   */
  static formatIndexed(template, ...args) {
    if (!template) return '';
    if (!args || args.length === 0) return template;
    
    return template.replace(/\{(\d+)\}/g, (match, index) => {
      const idx = parseInt(index, 10);
      return idx < args.length ? args[idx] : match;
    });
  }
  
  /**
   * 복수형 처리
   * @param {number} count - 개수
   * @param {string} singular - 단수형 문자열
   * @param {string} plural - 복수형 문자열
   * @returns {string} 개수에 따른 적절한 문자열
   */
  static pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }
  
  /**
   * HTML 이스케이핑
   * @param {string} text - 원본 텍스트
   * @returns {string} 이스케이핑된 텍스트
   */
  static escapeHTML(text) {
    if (!text) return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// == I18N/utils/LocaleDetector.js ==
/**
 * 사용자의 브라우저 언어 설정을 감지하는 유틸리티
 */
class LocaleDetector {
  /**
   * 사용자의 브라우저 언어 설정 감지
   * @param {Array} supportedLocales - 지원되는 언어 코드 배열
   * @param {string} fallbackLocale - 기본 언어 코드
   * @returns {string} 감지된 언어 코드
   */
  static detectUserLocale(supportedLocales, fallbackLocale = 'en') {
    try {
      const userLanguage = navigator.language || navigator.userLanguage;
      
      if (!userLanguage) return fallbackLocale;
      
      // 전체 언어 코드 확인 (예: ko-KR)
      if (supportedLocales.includes(userLanguage)) {
        return userLanguage;
      }
      
      // 기본 언어 코드만 확인 (예: ko)
      const baseLanguage = userLanguage.split('-')[0].toLowerCase();
      if (supportedLocales.includes(baseLanguage)) {
        return baseLanguage;
      }
      
      // 지원되지 않는 언어인 경우 기본 언어 반환
      return fallbackLocale;
    } catch (e) {
      console.error('Error detecting user locale:', e);
      return fallbackLocale;
    }
  }
  
  /**
   * 로컬 스토리지에서 저장된 언어 설정 가져오기
   * @param {string} key - 로컬 스토리지 키
   * @param {string} fallbackLocale - 기본 언어 코드
   * @returns {string} 저장된 언어 코드 또는 기본값
   */
  static getSavedLocale(key = 'xcom-gallery-locale', fallbackLocale = 'en') {
    try {
      const savedLocale = localStorage.getItem(key);
      return savedLocale || fallbackLocale;
    } catch (e) {
      console.error('Error getting saved locale:', e);
      return fallbackLocale;
    }
  }
  
  /**
   * 언어 설정을 로컬 스토리지에 저장
   * @param {string} locale - 언어 코드
   * @param {string} key - 로컬 스토리지 키
   */
  static saveLocale(locale, key = 'xcom-gallery-locale') {
    try {
      localStorage.setItem(key, locale);
    } catch (e) {
      console.error('Error saving locale:', e);
    }
  }
}

// == I18N/TranslationManager.js ==
/**
 * 다국어 지원 핵심 클래스
 */
class TranslationManager {
  constructor() {
    this.translations = {};
    this.currentLocale = 'en'; // 기본 언어 설정
    this.fallbackLocale = 'en';
  }

  /**
   * 언어 리소스 로드
   * @param {string} locale - 언어 코드
   * @param {Object} translations - 번역 객체
   */
  setTranslations(locale, translations) {
    this.translations[locale] = translations;
  }

  /**
   * 현재 언어 설정
   * @param {string} locale - 언어 코드
   */
  setLocale(locale) {
    if (this.translations[locale]) {
      this.currentLocale = locale;
    } else {
      console.warn(`Locale ${locale} not available, using ${this.fallbackLocale}`);
      this.currentLocale = this.fallbackLocale;
    }
  }

  /**
   * 번역 문자열 가져오기
   * @param {string} key - 점 표기법으로 된 키 (예: 'viewer.controls.next')
   * @param {Object} params - 대체할 변수 객체 (예: {current: 1, total: 5})
   * @returns {string} 번역된 문자열
   */
  translate(key, params = {}) {
    // 현재 언어의 번역 또는 대체 언어의 번역
    const translations = this.translations[this.currentLocale] || this.translations[this.fallbackLocale];
    
    if (!translations) {
      console.error('No translations available');
      return key;
    }

    // 점 표기법으로 객체 내부 값 찾기
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    // 번역 없을 경우 키 반환
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // 변수 대체
    return this._replaceParams(value, params);
  }

  /**
   * 문자열 내 변수 대체
   * @param {string} text - 원본 텍스트
   * @param {Object} params - 대체할 변수
   * @returns {string} 변수 대체된 텍스트
   */
  _replaceParams(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }

  /**
   * 사용자 언어 감지
   * @returns {string} 감지된 언어 코드
   */
  detectUserLocale() {
    const userLanguage = navigator.language || navigator.userLanguage;
    const baseLanguage = userLanguage.split('-')[0].toLowerCase();
    
    // 지원되는 언어면 반환, 아니면 기본 언어
    return this.translations[baseLanguage] ? baseLanguage : this.fallbackLocale;
  }
}

// == I18N/index.js ==

// 번역 매니저 인스턴스 생성
const i18n = new TranslationManager();

// 지원 언어 목록 - 새로운 언어 추가
const SUPPORTED_LOCALES = ['en', 'ko', 'ja', 'zh-CN', 'es', 'fr'];

// 언어 감지 및 설정
const initI18N = async () => {
  try {
    // JSON 파일 로드 (빌드 스크립트에서 실제 데이터로 대체됨)
    for (const locale of SUPPORTED_LOCALES) {
      try {
        const translations = await loadLocaleFile(locale);
        i18n.setTranslations(locale, translations);
      } catch (e) {
        console.error(`Failed to load locale: ${locale}`, e);
      }
    }

    // 저장된 언어 설정 확인
    let userLocale = LocaleDetector.getSavedLocale();
    
    // 저장된 설정이 없으면 브라우저 언어 감지
    if (!SUPPORTED_LOCALES.includes(userLocale)) {
      userLocale = LocaleDetector.detectUserLocale(SUPPORTED_LOCALES);
      if (userLocale) {
        LocaleDetector.saveLocale(userLocale);
      }
    }
    
    // 언어 설정
    i18n.setLocale(userLocale);
    
    console.log(`Initialized i18n with locale: ${userLocale}`);
  } catch (e) {
    console.error('Failed to initialize i18n:', e);
  }
};

/**
 * 번역 함수
 * @param {string} key - 번역 키 (점 표기법, 예: 'viewer.controls.next')
 * @param {...any} params - 대체할 변수들
 * @returns {string} 번역된 문자열
 */
function translate(key, ...params) {
  // 파라미터가 객체인 경우와 순서대로 값만 넘긴 경우 모두 지원
  if (params.length === 1 && typeof params[0] === 'object') {
    return i18n.translate(key, params[0]);
  } else if (params.length > 0) {
    // 순서대로 값만 넘긴 경우, 파라미터 객체 생성
    const paramObj = {};
    params.forEach((value, index) => {
      // 1부터 시작하는 숫자 키 사용하거나, 특정 패턴에 따라 키 이름 생성
      paramObj[index + 1] = value;
    });
    return i18n.translate(key, paramObj);
  }
  return i18n.translate(key);
};

/**
 * 로케일 변경 함수
 * @param {string} locale - 변경할 언어 코드
 */
function setLocale(locale) {
  if (SUPPORTED_LOCALES.includes(locale)) {
    i18n.setLocale(locale);
    LocaleDetector.saveLocale(locale);
    return true;
  }
  return false;
};

/**
 * 현재 로케일 가져오기
 * @returns {string} 현재 설정된 언어 코드
 */
function getLocale() {
  return i18n.currentLocale;
};

/**
 * 지원 언어 목록 가져오기
 * @returns {Array} 지원되는 언어 코드 배열
 */
function getSupportedLocales() {
  return [...SUPPORTED_LOCALES];
};

/**
 * JSON 파일 로드 함수 (빌드 프로세스에서 실제 구현으로 대체됨)
 * @param {string} locale - 로드할 언어 코드
 * @returns {Object} 번역 데이터 객체
 */
const loadLocaleFile = async (locale) => {
  return LOCALE_DATA[locale] || {};
};

// 초기화 수행
initI18N();



// == tweet/ImageExtractor.js ==
/**
 * 트윗으로부터 이미지를 추출하는 클래스
 */
class ImageExtractor {
    /**
     * 트윗 컨테이너에서 모든 이미지 URL 추출
     * @param {HTMLElement} containerElement - 트윗 컨테이너 요소
     * @param {boolean} isMediaTab - 미디어 탭 여부
     * @returns {Array} 이미지 URL 배열
     */
    static getAllImagesFromTweet(containerElement, isMediaTab) {
        try {
            // 일반 타임라인과 미디어란 모두에서 이미지 찾기
            let images = [...containerElement.querySelectorAll('img[src*="pbs.twimg.com/media/"]')]
                .map(img => img.src.replace(/&name=\w+/, '&name=orig'));
            
            // 미디어란에서는 추가적인 방법으로 이미지 찾기 시도
            if (isMediaTab && images.length === 0) {
                // 클릭한 이미지가 있는지 확인
                const clickedImage = containerElement.tagName === 'IMG' ? 
                                    containerElement : 
                                    containerElement.querySelector('img');
                
                if (clickedImage && clickedImage.src && clickedImage.src.includes('pbs.twimg.com/media/')) {
                    // 클릭한 이미지를 추가
                    images.push(clickedImage.src.replace(/&name=\w+/, '&name=orig'));
                }
            }
            
            // 이미지 중복 제거
            return [...new Set(images)];
        } catch (e) {
            console.error("Error getting images from tweet:", e);
            return [];
        }
    }
}

// == tweet/TweetDataExtractor.js ==
/**
 * 트윗 데이터 추출 클래스
 */
class TweetDataExtractor {
    /**
     * 트윗 ID 추출
     * @param {HTMLElement} containerElement - 트윗 컨테이너 요소
     * @param {boolean} isMediaTab - 미디어 탭 여부
     * @returns {string|null} 트윗 ID 또는 null
     */
    static extractTweetId(containerElement, isMediaTab) {
        try {
            // 미디어란의 경우 다른 방법으로 트윗 ID 추출 시도
            if (isMediaTab) {
                // 링크 탐색
                const statusLink = containerElement.querySelector('a[href*="/status/"]');
                if (statusLink) {
                    const match = statusLink.href.match(/\/status\/(\d+)/);
                    if (match) return match[1];
                }
                
                // 데이터 속성 탐색
                const linkElement = containerElement.closest('[role="link"]');
                if (linkElement && linkElement.href) {
                    const match = linkElement.href.match(/\/status\/(\d+)/);
                    if (match) return match[1];
                }
                
                return null;
            }
            
            // 일반 타임라인에서는 기존 방식 사용
            const statusLinks = containerElement.querySelectorAll('a[href*="/status/"]');
            for (const link of statusLinks) {
                const match = link.href.match(/\/status\/(\d+)/);
                if (match) return match[1];
            }
            return null;
        } catch (e) {
            console.error("Error extracting tweet ID:", e);
            return null;
        }
    }

    /**
     * 트윗 사용자 추출
     * @param {HTMLElement} containerElement - 트윗 컨테이너 요소
     * @param {boolean} isMediaTab - 미디어 탭 여부
     * @returns {string|null} 사용자 이름 또는 null
     */
    static extractTweetUser(containerElement, isMediaTab) {
        try {
            // 미디어란의 경우 URL에서 사용자 정보 추출 시도
            if (isMediaTab) {
                // 현재 URL에서 타니다면 사용자 아이디 추출 시도
                const pathMatch = window.location.pathname.match(/^\/(\w+)/);
                if (pathMatch && pathMatch[1]) {
                    return pathMatch[1];
                }
                
                // 링크에서 추출 시도
                const userLink = containerElement.querySelector('a[href^="/"]');
                if (userLink) {
                    const username = userLink.getAttribute('href').split('/')[1];
                    if (username && !username.includes('#') && !username.includes('?')) {
                        return username;
                    }
                }
                
                return null;
            }
            
            // 일반 타임라인에서는 기존 방식 사용
            const userLink = containerElement.querySelector('a[href^="/"]');
            if (!userLink) return null;
            
            const username = userLink.getAttribute('href').split('/')[1];
            if (username && !username.includes('#') && !username.includes('?')) {
                return username;
            }
            return null;
        } catch (e) {
            console.error("Error extracting tweet user:", e);
            return null;
        }
    }
}

// == TweetInfo.js ==

/**
 * 트윗 정보 클래스
 */
class TweetInfo {
    constructor() {
        this.user = '';
        this.id = '';
        this.imageUrls = [];
        this.isMediaTab = false;
    }

    /**
     * 트윗 요소에서 정보 추출
     * @param {HTMLElement} containerElement - 트윗 컨테이너 요소
     * @returns {boolean} 추출 성공 여부
     */
    extractFromTweet(containerElement) {
        try {
            // 미디어란인지 확인 (아티클이 아닌 경우)
            this.isMediaTab = !containerElement.tagName || containerElement.tagName.toLowerCase() !== 'article';
            
            // 이미지 URL 추출
            this.imageUrls = ImageExtractor.getAllImagesFromTweet(containerElement, this.isMediaTab);
            if (this.imageUrls.length === 0) return false;

            // 트윗 ID 및 사용자 추출
            this.id = TweetDataExtractor.extractTweetId(containerElement, this.isMediaTab) || translate('unknownID');
            this.user = TweetDataExtractor.extractTweetUser(containerElement, this.isMediaTab) || translate('unknownUser');

            return this.imageUrls.length > 0;
        } catch (e) {
            console.error("Error extracting tweet info:", e);
            return false;
        }
    }
}

// == components/ViewerState.js ==

/**
 * 뷰어 상태 관리 클래스
 */
class ViewerState {
    constructor() {
        this.currentIndex = 0;
        this.initialImageIndex = 0;
        this.totalImages = 0;
        this._isSelecting = false;
        this._lastActionTime = 0;
        this.isManualNavigating = false;
        this.navigationTimeout = null;
    }
    
    /**
     * 상태 초기화
     * @param {number} initialIndex - 초기 이미지 인덱스
     * @param {number} totalCount - 전체 이미지 수
     */
    init(initialIndex, totalCount) {
        this.currentIndex = initialIndex;
        this.initialImageIndex = initialIndex;
        this.totalImages = totalCount;
        debugLog(`뷰어 상태 초기화: currentIndex=${initialIndex}, totalImages=${totalCount}`);
    }
    
    /**
     * 현재 인덱스 반환
     * @returns {number} 현재 이미지 인덱스
     */
    getCurrentIndex() {
        return this.currentIndex;
    }
    
    /**
     * 이미지 선택 가능 상태 확인
     * @returns {boolean} 이미지 선택 가능 여부
     */
    canSelectImage() {
        return !this._isSelecting;
    }
    
    /**
     * 이미지 선택 진행 상태 설정
     * @param {boolean} isSelecting - 이미지 선택 진행 중 여부
     */
    setSelectingState(isSelecting) {
        this._isSelecting = isSelecting;
    }
    
    /**
     * 선택 이벤트 시작
     */
    startSelecting() {
        this._isSelecting = true;
    }
    
    /**
     * 선택 이벤트 종료
     * @param {number} delay - 선택 종료 후 대기 시간 (ms)
     */
    endSelecting(delay = 200) {
        setTimeout(() => {
            this._isSelecting = false;
        }, delay);
    }
    
    /**
     * 현재 인덱스 업데이트
     * @param {number} index - 새 인덱스
     * @returns {boolean} 인덱스가 변경되었는지 여부
     */
    updateIndex(index) {
        // 범위 검사
        if (index < 0 || index >= this.totalImages) {
            debugLog(`잘못된 인덱스 업데이트 시도: ${index}, 유효 범위: 0-${this.totalImages - 1}`);
            return false;
        }
        
        const changed = index !== this.currentIndex;
        this.currentIndex = index;
        
        if (changed) {
            this._lastActionTime = Date.now();
            debugLog(`인덱스 업데이트: ${index}`);
        }
        
        return changed;
    }
    
    /**
     * 이전 이미지로 이동
     * @returns {number} 새 인덱스
     */
    navigatePrev() {
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) newIndex = this.totalImages - 1;
        
        this.currentIndex = newIndex;
        this.setupNavigationTimeout();
        
        return newIndex;
    }
    
    /**
     * 다음 이미지로 이동
     * @returns {number} 새 인덱스
     */
    navigateNext() {
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        let newIndex = this.currentIndex + 1;
        if (newIndex >= this.totalImages) newIndex = 0;
        
        this.currentIndex = newIndex;
        this.setupNavigationTimeout();
        
        return newIndex;
    }
    
    /**
     * 첫 번째 이미지로 이동
     * @returns {number} 첫 번째 이미지 인덱스(0)
     */
    goToFirst() {
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        this.currentIndex = 0;
        this.setupNavigationTimeout();
        
        return this.currentIndex;
    }
    
    /**
     * 마지막 이미지로 이동
     * @returns {number} 마지막 이미지 인덱스
     */
    goToLast() {
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        this.currentIndex = this.totalImages - 1;
        this.setupNavigationTimeout();
        
        return this.currentIndex;
    }
    
    /**
     * 특정 이미지 선택
     * @param {number} index - 선택할 이미지 인덱스
     * @returns {number} 선택된 이미지 인덱스
     */
    selectImage(index) {
        // 범위 체크
        if (index < 0 || index >= this.totalImages) {
            debugLog(`잘못된 인덱스 선택 시도: ${index}`);
            return this.currentIndex;
        }
        
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        this.currentIndex = index;
        this.setupNavigationTimeout();
        
        return index;
    }
    
    /**
     * 내비게이션 타임아웃 설정
     */
    setupNavigationTimeout() {
        this.navigationTimeout = setTimeout(() => {
            this.isManualNavigating = false;
        }, 800);
    }
    
    /**
     * 내비게이션 타임아웃 정리
     */
    clearNavigationTimeout() {
        if (this.navigationTimeout) {
            clearTimeout(this.navigationTimeout);
            this.navigationTimeout = null;
        }
    }
    
    /**
     * 뷰어 상태 정리
     */
    cleanup() {
        this.clearNavigationTimeout();
        this.isManualNavigating = false;
        this._isSelecting = false;
    }
}

// == components/ImageAdjustment.js ==

/**
 * 이미지 크기 조정 클래스
 */
class ImageAdjustment {
    constructor(imageContainer) {
        this.imageContainer = imageContainer;
        this.currentAdjustMode = Utils.getLocalStorageItem('adjustMode', 'window');
    }
    
    /**
     * 현재 조정 모드 반환
     * @returns {string} 현재 조정 모드
     */
    getCurrentMode() {
        return this.currentAdjustMode;
    }
    
    /**
     * 모든 이미지 조정
     * @param {string} mode - 조정 모드 ('width', 'height', 'window', 'original')
     * @param {Function} focusCallback - 포커스 콜백 함수 (선택 사항)
     */
    adjustImages(mode, focusCallback = null) {
        this.currentAdjustMode = mode;
        Utils.setLocalStorageItem('adjustMode', mode);
        
        const images = this.imageContainer.querySelectorAll('.viewer-image');
        images.forEach(img => this.adjustImageElement(img));
        
        if (focusCallback) {
            setTimeout(() => focusCallback(true), 50);
        }
    }
    
    /**
     * 개별 이미지 요소 조정
     * @param {HTMLElement} img - 이미지 요소
     */
    adjustImageElement(img) {
        if (!img.complete || !img.naturalWidth) {
            img.addEventListener('load', () => this.updateImageStyles(img, this.currentAdjustMode), { once: true });
            return;
        }
        
        this.updateImageStyles(img, this.currentAdjustMode);
    }
    
    /**
     * 이미지 스타일 업데이트
     * @param {HTMLElement} img - 이미지 요소
     * @param {string} mode - 조정 모드
     */
    updateImageStyles(img, mode) {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight - 160;

        switch(mode) {
            case 'width':
                img.style.width = `${Math.min(winWidth, imgWidth)}px`;
                img.style.height = 'auto';
                break;
            case 'height':
                img.style.height = `${Math.min(winHeight, imgHeight)}px`;
                img.style.width = 'auto';
                break;
            case 'window':
                const scale = Math.min(1, winWidth / imgWidth, winHeight / imgHeight);
                img.style.width = `${imgWidth * scale}px`;
                img.style.height = `${imgHeight * scale}px`;
                break;
            case 'original':
                img.style.width = `${imgWidth}px`;
                img.style.height = `${imgHeight}px`;
                break;
        }

        img.style.objectFit = "initial";
        img.style.margin = "0 auto";
        img.style.position = "static";
        img.style.transform = "none";

        if (mode === 'original') {
            img.style.maxWidth = "none";
        } else {
            img.style.maxWidth = "100%";
        }
    }
}

// == components/ThumbnailManager.js ==

/**
 * 썸네일 관리 클래스
 */
class ThumbnailManager {
    constructor(thumbnailBar) {
        this.thumbnailBar = thumbnailBar;
        this.currentIndex = 0;
    }
    
    /**
     * 현재 인덱스 설정
     * @param {number} index - 현재 이미지 인덱스
     */
    setCurrentIndex(index) {
        this.currentIndex = index;
    }
    
    /**
     * 썸네일 포커스 업데이트
     */
    updateThumbnailFocus() {
        if (!this.thumbnailBar) return;

        const thumbs = this.thumbnailBar.querySelectorAll('.thumbnail');
        thumbs.forEach((thumb, idx) => {
            thumb.classList.remove('active');
            thumb.setAttribute('aria-selected', 'false');

            if (idx === this.currentIndex) {
                thumb.classList.add('active');
                thumb.setAttribute('aria-selected', 'true');

                thumb.style.transform = 'scale(1.1)';
                thumb.style.boxShadow = '0 0 8px rgba(29, 161, 242, 0.8)';
                thumb.style.border = '3px solid #1da1f2';

                setTimeout(() => {
                    if (thumb.classList.contains('active')) {
                        thumb.style.transform = 'scale(1.05)';
                        thumb.style.boxShadow = '0 0 5px rgba(29, 161, 242, 0.6)';
                    }
                }, 300);
            } else {
                thumb.style.transform = 'scale(1)';
                thumb.style.boxShadow = 'none';
                thumb.style.border = '3px solid transparent';
            }
        });

        const selectedThumb = this.thumbnailBar.querySelector(`.thumbnail[data-index="${this.currentIndex}"]`);
        if (selectedThumb) {
            selectedThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }
    
    /**
     * 썸네일 클릭 핸들러 설정
     * @param {function} clickHandler - 클릭 핸들러 함수
     */
    setupThumbnailClickHandlers(clickHandler) {
        if (!this.thumbnailBar) return;
        
        const thumbs = this.thumbnailBar.querySelectorAll('.thumbnail');
        thumbs.forEach(thumb => {
            const index = parseInt(thumb.dataset.index);
            
            // 기존 핸들러 제거
            const newThumb = thumb.cloneNode(true);
            thumb.parentNode.replaceChild(newThumb, thumb);
            
            // 디바운스된 새 핸들러 할당
            const handleThumbClick = Utils.debounce((e) => {
                // 버블링 멈춤
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                
                // 썸네일 클릭 시 이미지 선택
                clickHandler(index, true);
                
                // 클릭된 썸네일 효과 추가
                newThumb.style.transform = 'scale(1.2)';
                newThumb.style.boxShadow = '0 0 10px rgba(29, 161, 242, 0.9)';
                
                // 효과 원복
                setTimeout(() => {
                    if (newThumb.classList.contains('active')) {
                        newThumb.style.transform = 'scale(1.1)';
                        newThumb.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.7)';
                    } else {
                        newThumb.style.transform = '';
                        newThumb.style.boxShadow = '';
                    }
                }, 300);
                
                return false;
            }, 300, true);
            
            newThumb.addEventListener('click', handleThumbClick, { capture: true });
            
            // 키보드 접근성
            newThumb.setAttribute('role', 'tab');
            newThumb.setAttribute('aria-selected', index === this.currentIndex ? 'true' : 'false');
            newThumb.setAttribute('tabindex', '0');
            
            newThumb.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    clickHandler(index, true);
                }
            });
        });
    }
}

// == components/LanguageSelector.js ==

/**
 * 언어 선택 드롭다운 메뉴 컴포넌트
 */
class LanguageSelector {
    /**
     * 언어 선택 드롭다운 메뉴 생성
     * @param {Function} onLanguageChange - 언어 변경 시 호출될 콜백 함수
     * @returns {HTMLElement} 언어 선택 드롭다운 메뉴 요소
     */
    static createLanguageDropdown(onLanguageChange) {
        const { bgColor, textColor } = Utils.getUserUIColor();

        // 언어 목록 가져오기
        const supportedLocales = getSupportedLocales();
        
        // 현재 선택된 언어 가져오기
        const currentLocale = getLocale();
        
        // 언어 이름 매핑
        const localeNames = {
            'en': 'English',
            'ko': '한국어',
            'ja': '日本語',
            'zh-CN': '简体中文',
            'es': 'Español',
            'fr': 'Français'
        };
        
        // 컨테이너 생성
        const container = document.createElement('div');
        container.className = 'language-selector-container';
        container.style.cssText = `
            display: flex;
            align-items: center;
            margin-left: 10px;
        `;
        
        // 모든 컨테이너 이벤트 중지 - 상위 요소로 전파 방지
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { capture: true });
        
        // 아이콘 생성
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-language';
        icon.style.cssText = `
            margin-right: 5px;
            font-size: 16px;
        `;
        
        // 드롭다운 생성
        const select = document.createElement('select');
        select.id = 'language-select';
        select.className = 'language-select';
        select.style.cssText = `
            background: ${bgColor};
            color: ${textColor};
            border: none;
            border-radius: 4px;
            padding: 2px 5px;
            font-size: 14px;
            cursor: pointer;
        `;
        
        // 포커스/클릭 시 이벤트 전파 중지
        select.addEventListener('focus', (e) => {
            e.stopPropagation();
        }, { capture: true });
        
        select.addEventListener('click', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { capture: true });
        
        // 각 언어에 대한 옵션 추가
        supportedLocales.forEach(locale => {
            const option = document.createElement('option');
            option.value = locale;
            option.textContent = localeNames[locale] || locale;
            option.selected = locale === currentLocale;
            select.appendChild(option);
        });
        
        // 언어 변경 이벤트 핸들러 - 철저한 이벤트 제어
        select.addEventListener('change', (e) => {
            // 이벤트 전파 중지
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            
            const selectedLocale = select.value;
            if (setLocale(selectedLocale)) {
                // 로그 추가
                console.log(`언어 변경: ${selectedLocale}`);
                
                // 로컬 스토리지에 언어 설정 저장
                try {
                    localStorage.setItem('xcom-gallery-locale', selectedLocale);
                } catch (e) {
                    console.warn('언어 설정 저장 오류:', e);
                }
                
                // 안전한 방식으로 콜백 호출
                if (typeof onLanguageChange === 'function') {
                    // 비동기적으로 호출하여 현재 이벤트 루프에 영향을 주지 않도록 함
                    setTimeout(() => {
                        try {
                            onLanguageChange(selectedLocale);
                        } catch (err) {
                            console.error('언어 변경 콜백 오류:', err);
                        }
                    }, 0);
                }
                
                // 성공 메시지 표시
                const toast = document.createElement('div');
                toast.textContent = `언어가 ${localeNames[selectedLocale]}로 변경되었습니다.`;
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 10010;
                    font-size: 14px;
                `;
                document.body.appendChild(toast);
                
                // 3초 후 토스트 메시지 자동 삭제
                setTimeout(() => {
                    if (toast && toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 3000);
            }
            
            // 이벤트 전파 방지 강화
            return false;
        }, { capture: true });
        
        // 요소 조립
        container.appendChild(icon);
        container.appendChild(select);
        
        return container;
    }
}

// == components/ViewerDOM.js ==

class ViewerDOM {
    constructor(viewer) {
        this.viewer = viewer;
    }

    createViewer() {
        const viewer = document.createElement('div');
        viewer.id = 'xcom-image-viewer';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-label', 'Image Viewer');

        const backgroundOverlay = document.createElement('div');
        backgroundOverlay.className = 'background-overlay';
        backgroundOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            cursor: default;
        `;
        
        // 배경 오버레이 클릭 시 닫기
        backgroundOverlay.addEventListener('click', (event) => {
            if (event.target === backgroundOverlay) {
                const closeEvent = new CustomEvent('viewer-close');
                viewer.dispatchEvent(closeEvent);
                event.stopPropagation();
                event.preventDefault();
            }
        });

        viewer.appendChild(backgroundOverlay);
        return viewer;
    }

    createOptionsBar(tweetInfo, currentIndex, currentAdjustMode, handlers) {
        const { bgColor, textColor } = Utils.getUserUIColor();

        const optionsBar = document.createElement('div');
        optionsBar.id = 'optionsBar';
        optionsBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: ${Utils.addAlpha(bgColor, 0.8)};
            color: ${textColor};
            padding: 0 10px;
            height: 50px;
        `;
        optionsBar.setAttribute('role', 'toolbar');
        optionsBar.setAttribute('aria-label', 'Image Viewer Controls');

        // 왼쪽, 중앙, 오른쪽 섹션 생성
        const leftSection = document.createElement('div');
        leftSection.style.cssText = 'display: flex; align-items: center; gap: 5px;';
        
        const centerSection = document.createElement('div');
        centerSection.style.cssText = 'display: flex; align-items: center; flex: 1; justify-content: center;';
        
        const rightSection = document.createElement('div');
        rightSection.style.cssText = 'display: flex; align-items: center; gap: 5px;';

        // 네비게이션 버튼 생성
        const prevBtn = this.createIconButton('fa-solid fa-arrow-left', handlers.prevImage, translate('viewer.controls.prev'));
        const nextBtn = this.createIconButton('fa-solid fa-arrow-right', handlers.nextImage, translate('viewer.controls.next'));

        // 이미지 선택 드롭다운 생성
        const imageSelect = document.createElement('select');
        imageSelect.id = 'image-select';
        imageSelect.setAttribute('aria-label', 'Select Image');

        tweetInfo.imageUrls.forEach((url, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = (index + 1).toString();
            imageSelect.appendChild(option);
        });

        imageSelect.selectedIndex = currentIndex;
        imageSelect.addEventListener('change', () => {
            handlers.selectImage(parseInt(imageSelect.value), true);
        });

        // 이미지 조정 버튼 생성
        const fitWidthBtn = this.createIconButton('fa-solid fa-arrows-left-right', () => handlers.adjustImages('width'), translate('viewer.modes.fitWidth'));
        const fitHeightBtn = this.createIconButton('fa-solid fa-arrows-up-down', () => handlers.adjustImages('height'), translate('viewer.modes.fitHeight'));
        const fitWindowBtn = this.createIconButton('fa-solid fa-expand', () => handlers.adjustImages('window'), translate('viewer.modes.fitWindow'));
        const originalSizeBtn = this.createIconButton('fa-solid fa-image', () => handlers.adjustImages('original'), translate('viewer.modes.original'));

        // 다운로드 버튼 생성
        const downloadCurrentBtn = this.createIconButton('fa-solid fa-download', handlers.downloadCurrentImage, translate('viewer.controls.download'));
        const downloadAllBtn = this.createIconButton('fa-solid fa-file-zipper', handlers.downloadAllImages, translate('viewer.controls.downloadZip'));

        // 테마 토글 버튼 생성
        const themeToggleBtn = ThemeManager.createThemeToggle();
        
        // 레이아웃 토글 버튼 생성
        const layoutToggleBtn = LayoutManager.createLayoutToggle();
        
        // 언어 선택기 생성
        const languageSelector = LanguageSelector.createLanguageDropdown((newLocale) => {
            // UI 요소들 언어 변경 적용
            if (handlers.onLanguageChange) {
                handlers.onLanguageChange(newLocale);
            }
        });
        
        // 닫기 버튼 생성
        const closeBtn = this.createIconButton('fa-solid fa-xmark', handlers.close, translate('viewer.controls.close'));
        
        // 요소들을 섹션에 배치
        leftSection.append(prevBtn, imageSelect, nextBtn);
        
        centerSection.append(
            fitWidthBtn,
            fitHeightBtn,
            fitWindowBtn,
            originalSizeBtn
        );
        
        rightSection.append(
            downloadCurrentBtn,
            downloadAllBtn,
            themeToggleBtn,
            layoutToggleBtn,
            languageSelector,
            closeBtn
        );

        // 섹션들을 옵션바에 추가
        optionsBar.append(leftSection, centerSection, rightSection);

        return optionsBar;
    }

    createIconButton(iconClass, onClick, tooltipText) {
        try {
            const { bgColor, textColor } = Utils.getUserUIColor();

            const button = document.createElement('button');
            button.className = 'icon-button';
            button.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
            button.style.background = 'transparent';
            button.style.color = textColor;

            if (tooltipText) {
                button.title = tooltipText;
                button.setAttribute('aria-label', tooltipText);
            }

            button.addEventListener('click', (event) => {
                event.stopPropagation();
                onClick();
            });

            return button;
        } catch (e) {
            const fallbackButton = document.createElement('button');
            fallbackButton.textContent = tooltipText || "Button";
            return fallbackButton;
        }
    }

    createImageContainer() {
        const container = document.createElement('div');
        container.className = 'image-container-wrapper';
        container.style.cssText = `
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 60px 0 100px 0;
            z-index: 10001;
            pointer-events: none;
        `;
        return container;
    }

    createImageElement(url, index, currentIndex, handlers) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-container';
        imgContainer.dataset.index = index;
        imgContainer.dataset.url = url;

        const img = document.createElement('img');
        img.src = url;
        img.className = 'viewer-image';
        img.dataset.index = index;
        img.alt = `Image ${index + 1}`;
        
        // 클래스 명으로 이미지 뷰어 내부 이미지 식별하기 위한 추가 클래스
        img.classList.add('xcom-viewer-img');
        imgContainer.classList.add('xcom-viewer-container');

        // ===== 개선된 이미지 클릭 핸들러 - 디바운싱 적용 =====
        const handleImageClick = Utils.debounce((e) => {
            // 버블링 멈춤
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            
            console.log(`이미지 클릭됨: index=${index}`);
            
            // 클릭된 이미지가 현재 선택된 이미지인지 확인
            if (parseInt(index) !== currentIndex) {
                handlers.selectImage(parseInt(index), true);
            } else {
                handlers.focusImage(parseInt(index));
            }
            
            return false;
        }, 300, true); // 300ms 디바운스, 첫 클릭 즉시 실행

        // 단일 이벤트 리스너로 간소화 (중복 방지)
        imgContainer.addEventListener('click', handleImageClick, { capture: true });
        
        // 마우스 오버 효과
        imgContainer.addEventListener('mouseenter', () => {
            imgContainer.style.boxShadow = 'var(--xcom-shadow-md)';
            img.style.opacity = '0.95';
        });

        imgContainer.addEventListener('mouseleave', () => {
            imgContainer.style.boxShadow = 'none';
            img.style.opacity = '1';
        });

        if (parseInt(index) === currentIndex) {
            const indicator = document.createElement('div');
            indicator.className = 'image-indicator';
            imgContainer.appendChild(indicator);
        }

        imgContainer.appendChild(img);
        return { imgContainer, img };
    }

    createThumbnailBar(tweetInfo, currentIndex, handlers) {
        const { bgColor } = Utils.getUserUIColor();

        const thumbnailBar = document.createElement('div');
        thumbnailBar.id = 'thumbnailBar';
        thumbnailBar.style.cssText = `
            background: ${Utils.addAlpha(bgColor, 0.8)};
            border-top: 1px solid var(--xcom-thumbnail-border);
        `;

        tweetInfo.imageUrls.forEach((url, index) => {
            const thumb = document.createElement('img');
            thumb.src = url.replace(/&name=orig/, '&name=small');
            thumb.className = index === currentIndex ? 'thumbnail active' : 'thumbnail';
            thumb.dataset.index = index;
            thumb.alt = `Thumbnail ${index + 1}`;
            
            // 클래스 명으로 썸네일 식별
            thumb.classList.add('xcom-thumbnail');

            // ===== 개선된 썸네일 클릭 핸들러 - 디바운싱 적용 =====
            const handleThumbClick = Utils.debounce((e) => {
                // 버블링 멈춤
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log(`썸네일 클릭됨: index=${index}`);
                
                // 썸네일 클릭 시에도 동일한 핵심 함수(번호 선택) 사용
                handlers.selectImage(parseInt(index), true);
                
                // 클릭된 썸네일 효과 추가
                thumb.style.transform = 'scale(1.2)';
                thumb.style.boxShadow = 'var(--xcom-shadow-md)';
                
                // 효과 원복
                setTimeout(() => {
                    if (thumb.classList.contains('active')) {
                        thumb.style.transform = 'scale(1.1)';
                        thumb.style.boxShadow = 'var(--xcom-shadow-md)';
                    } else {
                        thumb.style.transform = '';
                        thumb.style.boxShadow = '';
                    }
                }, 300);
                
                return false;
            }, 300, true); // 300ms 디바운스, 첫 클릭 즉시 실행
            
            // 이벤트 할당 (중복 방지를 위해 하나의 이벤트 리스너만 사용)
            thumb.addEventListener('click', handleThumbClick, { capture: true });

            thumb.setAttribute('role', 'tab');
            thumb.setAttribute('aria-selected', index === currentIndex ? 'true' : 'false');
            thumb.setAttribute('tabindex', '0');

            thumb.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handlers.selectImage(index);
                }
            });

            thumbnailBar.appendChild(thumb);
        });

        return thumbnailBar;
    }

    createCurrentImageIndicator(currentIndex, totalImages) {
        const { bgColor, textColor } = Utils.getUserUIColor();
        
        const indicator = document.createElement('div');
        indicator.id = 'current-image-indicator';
        indicator.textContent = translate('viewer.indicators.currentImage', { current: currentIndex + 1, total: totalImages });
        indicator.style.cssText = `
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--xcom-indicator-bg);
            color: var(--xcom-indicator-text);
            padding: var(--xcom-space-sm) var(--xcom-space-md);
            border-radius: var(--xcom-radius-pill);
            font-size: 14px;
            font-weight: bold;
            z-index: 10002;
            box-shadow: var(--xcom-shadow-md);
        `;
        return indicator;
    }

    updateImageStyles(img, mode) {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight - 160;

        switch(mode) {
            case 'width':
                img.style.width = `${Math.min(winWidth, imgWidth)}px`;
                img.style.height = 'auto';
                break;
            case 'height':
                img.style.height = `${Math.min(winHeight, imgHeight)}px`;
                img.style.width = 'auto';
                break;
            case 'window':
                const scale = Math.min(1, winWidth / imgWidth, winHeight / imgHeight);
                img.style.width = `${imgWidth * scale}px`;
                img.style.height = `${imgHeight * scale}px`;
                break;
            case 'original':
                img.style.width = `${imgWidth}px`;
                img.style.height = `${imgHeight}px`;
                break;
        }

        img.style.objectFit = "initial";
        img.style.margin = "0 auto";
        img.style.position = "static";
        img.style.transform = "none";

        if (mode === 'original') {
            img.style.maxWidth = "none";
        } else {
            img.style.maxWidth = "100%";
        }
    }
}

// == components/ViewerNavigation.js ==
class ViewerNavigation {
    constructor(viewer) {
        this.viewer = viewer;
        this.currentIndex = 0;
        this.currentAdjustMode = 'window';
        this.isManualNavigating = false;
        this.navigationTimeout = null;
    }

    navigateImage(direction, imagesCount) {
        try {
            if (imagesCount <= 1) return this.currentIndex;

            this.isManualNavigating = true;
            clearTimeout(this.navigationTimeout);

            let newIndex = this.currentIndex + direction;

            if (newIndex < 0) newIndex = imagesCount - 1;
            if (newIndex >= imagesCount) newIndex = 0;

            this.currentIndex = newIndex;
            
            this.navigationTimeout = setTimeout(() => {
                this.isManualNavigating = false;
            }, 1000);
            
            return this.currentIndex;
        } catch (e) {
            console.error(`Error navigating image: ${e.message}`);
            this.isManualNavigating = false;
            return this.currentIndex;
        }
    }

    selectImage(index, imagesCount, smooth = true) {
        if (index < 0 || index >= imagesCount) return this.currentIndex;
        
        this.isManualNavigating = true;
        clearTimeout(this.navigationTimeout);
        
        this.currentIndex = index;
        
        this.navigationTimeout = setTimeout(() => {
            this.isManualNavigating = false;
        }, 1000);
        
        return this.currentIndex;
    }

    setupKeyboardNavigation(handlers) {
        const keyHandler = (event) => {
            if (!this.viewer) return;

            switch(event.key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                    event.preventDefault();
                    console.log('키보드: 이전 이미지');
                    handlers.prevImage();
                    break;
                case 'ArrowDown':
                case 'ArrowRight':
                    event.preventDefault();
                    console.log('키보드: 다음 이미지');
                    handlers.nextImage();
                    break;
                case 'Escape':
                    event.preventDefault();
                    console.log('키보드: 닫기');
                    handlers.close();
                    break;
                case ' ': // Space
                    event.preventDefault();
                    console.log('키보드: 다음 이미지 (Space)');
                    handlers.nextImage();
                    break;
                case 'Home':
                    event.preventDefault();
                    console.log('키보드: 처음 이미지');
                    handlers.goToFirst();
                    break;
                case 'End':
                    event.preventDefault();
                    console.log('키보드: 마지막 이미지');
                    handlers.goToLast();
                    break;
            }
        };

        document.addEventListener('keydown', keyHandler);
        return keyHandler; // Return for cleanup
    }

    setupMouseWheelNavigation(handlers) {
        const wheelHandler = (event) => {
            if (event.deltaY !== 0) {
                if (event.shiftKey || event.ctrlKey) {
                    event.preventDefault();
                    if (event.deltaY > 0) {
                        handlers.nextImage();
                    } else {
                        handlers.prevImage();
                    }
                }
            }
        };

        this.viewer.addEventListener('wheel', wheelHandler, { passive: false });
        return wheelHandler; // Return for cleanup
    }

    focusCurrentImage(container, smooth = true) {
        try {
            const target = container.querySelector(`.image-container[data-index="${this.currentIndex}"]`);
            if (!target) return;

            target.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
                block: 'center'
            });
        } catch (e) {
            console.error(`focusCurrentImage error:`, e);
        }
    }

    updateThumbnailFocus(thumbnailBar) {
        if (!thumbnailBar) return;

        const thumbs = thumbnailBar.querySelectorAll('.thumbnail');
        thumbs.forEach((thumb, idx) => {
            thumb.classList.remove('active');
            thumb.setAttribute('aria-selected', 'false');

            if (idx === this.currentIndex) {
                thumb.classList.add('active');
                thumb.setAttribute('aria-selected', 'true');

                thumb.style.transform = 'scale(1.1)';
                thumb.style.boxShadow = '0 0 8px rgba(29, 161, 242, 0.8)';
                thumb.style.border = '3px solid #1da1f2';

                setTimeout(() => {
                    if (thumb.classList.contains('active')) {
                        thumb.style.transform = 'scale(1.05)';
                        thumb.style.boxShadow = '0 0 5px rgba(29, 161, 242, 0.6)';
                    }
                }, 300);
            } else {
                thumb.style.transform = 'scale(1)';
                thumb.style.boxShadow = 'none';
                thumb.style.border = '3px solid transparent';
            }
        });

        const selectedThumb = thumbnailBar.querySelector(`.thumbnail[data-index="${this.currentIndex}"]`);
        if (selectedThumb) {
            selectedThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }
}

// == components/ViewerDownload.js ==

class ViewerDownload {
    constructor(viewer) {
        this.viewer = viewer;
    }

    async downloadCurrentImage(tweetInfo, currentIndex) {
        try {
            if (!tweetInfo.imageUrls.length) return;

            const url = tweetInfo.imageUrls[currentIndex];
            const ext = Utils.getFileExtension(url);
            
            // 새로운 I18N 구조 사용
            const filenameTemplate = translate('download.filename');
            const filename = filenameTemplate
                .replace('{{username}}', tweetInfo.user)
                .replace('{{tweetId}}', tweetInfo.id)
                .replace('{{index}}', (currentIndex + 1).toString()) + '.' + ext;

            const downloadIndicator = document.createElement('div');
            downloadIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10010;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                max-width: 80%;
            `;

            const preview = document.createElement('img');
            preview.src = url.replace(/&name=orig/, '&name=small');
            preview.style.cssText = `
                max-width: 150px;
                max-height: 150px;
                border: 2px solid white;
            `;

            downloadIndicator.innerHTML = `
                <h3>${translate('download.preparing')}</h3>
                <p>${filename}</p>
            `;
            downloadIndicator.appendChild(preview);

            this.viewer.appendChild(downloadIndicator);

            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                if (typeof saveAs === 'function') {
                    saveAs(url, filename);
                } else {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } catch (err) {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            downloadIndicator.innerHTML = `
                <h3>${translate('download.complete')}</h3>
                <p>${filename}</p>
            `;
            downloadIndicator.appendChild(preview);

            setTimeout(() => {
                if (downloadIndicator.parentNode) {
                    downloadIndicator.parentNode.removeChild(downloadIndicator);
                }
            }, 1500);
        } catch (e) {
            const existingIndicator = this.viewer.querySelector('div[style*="z-index: 10010"]');
            if (existingIndicator) {
                existingIndicator.parentNode.removeChild(existingIndicator);
            }
            console.error("Error downloading image:", e);
        }
    }

    async downloadAllImages(tweetInfo) {
        try {
            if (!tweetInfo.imageUrls.length) return;

            if (typeof JSZip !== 'function' && typeof window.JSZip !== 'function') {
                alert("JSZip library is not available. Please reload the page or use single image download.");
                return;
            }

            const ZipConstructor = typeof JSZip === 'function' ? JSZip : window.JSZip;
            const zip = new ZipConstructor();
            
            // 새로운 I18N 구조 사용
            const zipNameTemplate = translate('download.zipName');
            const zipFolderName = zipNameTemplate
                .replace('{{username}}', tweetInfo.user)
                .replace('{{tweetId}}', tweetInfo.id);
                
            const folder = zip.folder(zipFolderName);

            const loadingIndicator = document.createElement('div');
            loadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10010;
                text-align: center;
            `;
            loadingIndicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Downloading images...</p>';
            this.viewer.appendChild(loadingIndicator);

            const downloadPromises = tweetInfo.imageUrls.map(async (url, index) => {
                try {
                    const ext = Utils.getFileExtension(url);
                    
                    // 새로운 I18N 구조 사용
                    const filenameTemplate = translate('download.filename');
                    const filename = filenameTemplate
                        .replace('{{username}}', tweetInfo.user)
                        .replace('{{tweetId}}', tweetInfo.id)
                        .replace('{{index}}', (index + 1).toString()) + '.' + ext;
                    
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const blob = await response.blob();
                    folder.file(filename, blob);

                    loadingIndicator.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                        <p>Downloading images (${index + 1}/${tweetInfo.imageUrls.length})...</p>
                    `;
                } catch (error) {
                    console.warn(`${translate('errors.download')}: ${url}`, error);
                }
            });

            await Promise.allSettled(downloadPromises);

            try {
                const zipContent = await zip.generateAsync({ type: 'blob' });
                
                if (typeof saveAs === 'function') {
                    saveAs(zipContent, `${zipFolderName}.zip`);
                } else if (typeof window.saveAs === 'function') {
                    window.saveAs(zipContent, `${zipFolderName}.zip`);
                } else {
                    const url = URL.createObjectURL(zipContent);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${zipFolderName}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            } catch (error) {
                console.error(`Error creating zip file: ${error.message}`);
                alert(`Error creating zip file: ${error.message}`);
            }

            if (loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
        } catch (e) {
            const loadingIndicator = this.viewer.querySelector('div[style*="z-index: 10010"]');
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
            console.error("Error downloading all images:", e);
            alert(`Error downloading all images: ${e.message}`);
        }
    }
}

// == components/ViewerEvents.js ==

class ViewerEvents {
    constructor(viewer) {
        this.viewer = viewer;
        this.eventListeners = [];
        this.isMouseOverOptionsBar = false;
        this.isMouseOverThumbnailBar = false;
        this.isMouseInTopDetectionZone = false;
        this.isMouseInBottomDetectionZone = false;
        this.hideOptionsBarTimer = null;
        this.hideThumbnailBarTimer = null;
        this.detectionZoneSize = 150;
    }

    setupUIAutoHide(optionsBar, thumbnailBar) {
        // 옵션 바 이벤트 핸들러
        optionsBar.addEventListener('mouseenter', () => {
            this.isMouseOverOptionsBar = true;
            clearTimeout(this.hideOptionsBarTimer);
            optionsBar.style.transform = 'translateY(0)';
        });

        optionsBar.addEventListener('mouseleave', () => {
            this.isMouseOverOptionsBar = false;
            if (!this.isMouseInTopDetectionZone) {
                this.hideOptionsBarTimer = setTimeout(() => {
                    if (!this.isMouseOverOptionsBar && !this.isMouseInTopDetectionZone) {
                        optionsBar.style.transform = 'translateY(-100%)';
                    }
                }, 2000);
            }
        });

        // 썸네일 바 이벤트 핸들러
        thumbnailBar.addEventListener('mouseenter', () => {
            this.isMouseOverThumbnailBar = true;
            clearTimeout(this.hideThumbnailBarTimer);
            thumbnailBar.style.transform = 'translateY(0)';
        });

        thumbnailBar.addEventListener('mouseleave', () => {
            this.isMouseOverThumbnailBar = false;
            if (!this.isMouseInBottomDetectionZone) {
                this.hideThumbnailBarTimer = setTimeout(() => {
                    if (!this.isMouseOverThumbnailBar && !this.isMouseInBottomDetectionZone) {
                        thumbnailBar.style.transform = 'translateY(100%)';
                    }
                }, 2000);
            }
        });

        // 처음 자동 숨김 타이머 설정
        this.hideOptionsBarTimer = setTimeout(() => {
            if (!this.isMouseOverOptionsBar) {
                optionsBar.style.transform = 'translateY(-100%)';
            }
        }, 2000);

        this.hideThumbnailBarTimer = setTimeout(() => {
            if (!this.isMouseOverThumbnailBar) {
                thumbnailBar.style.transform = 'translateY(100%)';
            }
        }, 2000);

        // 마우스 움직임 핸들러 설정
        const mouseMoveHandler = Utils.debounce((e) => {
            if (!this.viewer) return;

            const isInTopZone = e.clientY < this.detectionZoneSize;
            if (isInTopZone !== this.isMouseInTopDetectionZone) {
                this.isMouseInTopDetectionZone = isInTopZone;

                if (isInTopZone && optionsBar) {
                    clearTimeout(this.hideOptionsBarTimer);
                    optionsBar.style.transform = 'translateY(0)';
                }
                else if (optionsBar && !this.isMouseOverOptionsBar) {
                    this.hideOptionsBarTimer = setTimeout(() => {
                        if (!this.isMouseOverOptionsBar && !this.isMouseInTopDetectionZone) {
                            optionsBar.style.transform = 'translateY(-100%)';
                        }
                    }, 2000);
                }
            }

            const isInBottomZone = e.clientY > window.innerHeight - this.detectionZoneSize;
            if (isInBottomZone !== this.isMouseInBottomDetectionZone) {
                this.isMouseInBottomDetectionZone = isInBottomZone;

                if (isInBottomZone && thumbnailBar) {
                    clearTimeout(this.hideThumbnailBarTimer);
                    thumbnailBar.style.transform = 'translateY(0)';
                }
                else if (thumbnailBar && !this.isMouseOverThumbnailBar) {
                    this.hideThumbnailBarTimer = setTimeout(() => {
                        if (!this.isMouseOverThumbnailBar && !this.isMouseInBottomDetectionZone) {
                            thumbnailBar.style.transform = 'translateY(100%)';
                        }
                    }, 2000);
                }
            }
        }, 50);

        this.viewer.addEventListener('mousemove', mouseMoveHandler);
        this.eventListeners.push({ event: 'mousemove', listener: mouseMoveHandler, element: this.viewer });
    }

    setupBackgroundClickHandler(closeHandler) {
        const backgroundClickHandler = (event) => {
            // 버튼이 왼쪽 클릭이 아닌 경우 무시
            if ('button' in event && event.button !== 0) return;
            
            // 인터랙티브 요소 클릭 시 무시
            const isInteractiveElement = event.target.closest(
                '.image-container, .viewer-image, #optionsBar, #thumbnailBar, ' +
                '.icon-button, select, .thumbnail, .image-placeholder, button'
            );
            
            // 뷰어 배경 또는 오버레이 클릭 시 닫기
            if (event.target === this.viewer || 
                event.target.classList.contains('background-overlay') ||
                (!isInteractiveElement && this.viewer.contains(event.target))) {
                event.preventDefault();
                event.stopPropagation();
                closeHandler();
            }
        };

        this.viewer.addEventListener('click', backgroundClickHandler, { capture: true });
        this.eventListeners.push({ 
            event: 'click', 
            listener: backgroundClickHandler, 
            options: { capture: true }, 
            element: this.viewer 
        });
    }

    setupIntersectionObserver(imageContainer, callbacks) {
        try {
            const options = {
                root: this.viewer,
                threshold: [0.1, 0.5, 0.9]
            };

            const observer = new IntersectionObserver((entries) => {
                // 가장 큰 교차 비율을 가진 이미지 찾기
                if (callbacks.isManualNavigating()) return;

                let maxVisibility = 0;
                let mostVisibleIndex = -1;

                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > maxVisibility) {
                        const container = entry.target;
                        const index = parseInt(container.dataset.index);
                        if (!isNaN(index)) {
                            maxVisibility = entry.intersectionRatio;
                            mostVisibleIndex = index;
                        }
                    }
                });

                if (mostVisibleIndex !== -1 && mostVisibleIndex !== callbacks.getCurrentIndex()) {
                    callbacks.updateCurrentIndex(mostVisibleIndex);
                }
            }, options);

            const containers = imageContainer.querySelectorAll('.image-container');
            containers.forEach(container => {
                observer.observe(container);
            });

            return observer;
        } catch (e) {
            console.error(`Error setting up intersection observer: ${e.message}`);
            return null;
        }
    }

    cleanupEventListeners() {
        this.eventListeners.forEach(({ event, listener, options, element }) => {
            const targetElement = element || document;
            if (targetElement && targetElement.removeEventListener) {
                targetElement.removeEventListener(event, listener, options);
            }
        });
        this.eventListeners = [];

        clearTimeout(this.hideOptionsBarTimer);
        clearTimeout(this.hideThumbnailBarTimer);
    }
}

// == components/ViewerImageLoader.js ==

/**
 * 이미지 로딩 관리 클래스
 */
class ViewerImageLoader {
    constructor(imageContainer) {
        this.imageContainer = imageContainer;
        this.lazyLoadedImages = new Set();
        this.currentIndex = 0;
        this.dom = null;
    }
    
    /**
     * DOM 컴포넌트 설정
     * @param {ViewerDOM} dom - DOM 컴포넌트
     */
    setDOMComponent(dom) {
        this.dom = dom;
    }
    
    /**
     * 현재 인덱스 설정
     * @param {number} index - 현재 이미지 인덱스
     */
    setCurrentIndex(index) {
        this.currentIndex = index;
    }
    
    /**
     * 모든 이미지에 대한 플레이스홀더 생성
     * @param {Array} imageUrls - 이미지 URL 배열
     */
    createPlaceholders(imageUrls) {
        imageUrls.forEach((url, index) => {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.dataset.index = index;
            placeholder.dataset.src = url;
            placeholder.style.cssText = `
                width: 100%;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 5px 0;
            `;

            const loadingSpinner = document.createElement('div');
            loadingSpinner.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x"></i>';
            placeholder.appendChild(loadingSpinner);

            this.imageContainer.appendChild(placeholder);
        });
    }
    
    /**
     * 지연 로딩 설정
     */
    setupLazyLoading() {
        const loadVisibleImages = () => {
            if (!this.imageContainer) return;
            
            const containerRect = this.imageContainer.getBoundingClientRect();
            const containerTop = containerRect.top - containerRect.height;
            const containerBottom = containerRect.bottom + containerRect.height;
            
            const placeholders = this.imageContainer.querySelectorAll('.image-placeholder');
            placeholders.forEach(placeholder => {
                const index = parseInt(placeholder.dataset.index);
                const rect = placeholder.getBoundingClientRect();
                
                if ((rect.bottom >= containerTop && rect.top <= containerBottom) ||
                    index === this.currentIndex) {
                    this.loadImage(placeholder.dataset.src, index);
                }
            });
        };
        
        const scrollHandler = Utils.debounce(loadVisibleImages, 200);
        this.imageContainer.parentElement.addEventListener('scroll', scrollHandler);
        
        loadVisibleImages();
    }
    
    /**
     * 이미지 로드
     * @param {string} url - 이미지 URL
     * @param {number} index - 이미지 인덱스
     * @param {Object} handlers - 이벤트 핸들러 객체
     */
    loadImage(url, index, handlers = {}) {
        if (this.lazyLoadedImages.has(index)) return;
        
        const placeholder = this.imageContainer.querySelector(`.image-placeholder[data-index="${index}"]`);
        if (!placeholder) return;
        
        if (!this.dom) {
            debugLog('DOM 컴포넌트가 설정되지 않았습니다.');
            return;
        }
        
        const { imgContainer, img } = this.dom.createImageElement(url, index, this.currentIndex, handlers);
        
        // 이미지 로딩 후 조정 설정
        img.onload = () => {
            this.dom.updateImageStyles(img, 'window'); // 기본값 window로 설정
            
            if (parseInt(index) === this.currentIndex) {
                setTimeout(() => {
                    if (handlers.focusImage) {
                        handlers.focusImage(index);
                    }
                }, 50);
            }
        };
        
        // 이미지 로드 에러 처리
        img.onerror = () => {
            img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjODg4Ij5JbWFnZSBMb2FkIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
        };
        
        // 플레이스홀더 교체
        placeholder.parentNode.replaceChild(imgContainer, placeholder);
        this.lazyLoadedImages.add(index);
    }
    
    /**
     * 지정된 이미지 로드 강제 실행
     * @param {string} url - 이미지 URL
     * @param {number} index - 이미지 인덱스
     * @param {Object} handlers - 이벤트 핸들러 객체
     */
    forceLoadImage(url, index, handlers = {}) {
        if (this.lazyLoadedImages.has(index)) {
            if (handlers.focusImage) {
                handlers.focusImage(index);
            }
            return;
        }
        
        this.loadImage(url, index, handlers);
    }
    
    /**
     * 모든 이미지 로드
     * @param {Array} imageUrls - 이미지 URL 배열
     * @param {Object} handlers - 이벤트 핸들러 객체
     */
    loadImages(imageUrls, handlers = {}) {
        // 모든 이미지를 위한 플레이스홀더 생성
        this.createPlaceholders(imageUrls);
        
        // 이미지 지연 로딩 설정
        this.setupLazyLoading();
        
        // 현재 인덱스의 이미지는 강제 로드
        if (imageUrls.length > 0 && this.currentIndex >= 0 && this.currentIndex < imageUrls.length) {
            this.forceLoadImage(imageUrls[this.currentIndex], this.currentIndex, handlers);
        }
    }
    
    /**
     * 이미지 스타일 업데이트
     * @param {string} mode - 조정 모드 ('width', 'height', 'window', 'original')
     */
    adjustAllImages(mode) {
        const images = this.imageContainer.querySelectorAll('.viewer-image');
        images.forEach(img => this.adjustImageElement(img, mode));
    }
    
    /**
     * 개별 이미지 스타일 조정
     * @param {HTMLElement} img - 이미지 요소
     * @param {string} mode - 조정 모드
     */
    adjustImageElement(img, mode) {
        if (!img.complete || !img.naturalWidth) {
            img.addEventListener('load', () => {
                if (this.dom) {
                    this.dom.updateImageStyles(img, mode);
                }
            }, { once: true });
            return;
        }
        
        if (this.dom) {
            this.dom.updateImageStyles(img, mode);
        }
    }
}

// == components/ViewerFocus.js ==

/**
 * 이미지 포커스 및 스크롤 관리 클래스
 */
class ViewerFocus {
    constructor(viewer, imageContainer) {
        this.viewer = viewer;
        this.imageContainer = imageContainer;
        this._isScrolling = false;
        this._scrollAnimationFrame = null;
    }
    
    /**
     * 현재 이미지에 포커스
     * @param {number} currentIndex - 현재 이미지 인덱스
     * @param {boolean} smooth - 부드러운 스크롤 여부
     * @param {Function} loadImageCallback - 이미지 로드 콜백 함수
     */
    focusCurrentImage(currentIndex, smooth = false, loadImageCallback = null) {
        try {
            debugLog(`focusCurrentImage 호출됨: currentIndex=${currentIndex}, smooth=${smooth}`);
            
            if (!this.imageContainer) {
                debugLog('이미지 컨테이너가 없습니다');
                return;
            }
            
            // 기존 이미지에서 강조 효과 제거
            const allContainers = this.imageContainer.querySelectorAll('.image-container');
            allContainers.forEach(container => {
                const containerIndex = parseInt(container.dataset.index || '-1');
                if (containerIndex !== currentIndex) {
                    container.style.boxShadow = 'none';
                    container.style.transform = 'scale(1)';
                }
            });
            
            // 현재 이미지 요소 찾기
            const targetElements = this.imageContainer.querySelectorAll(`.image-container[data-index="${currentIndex}"]`);
            const targetElement = targetElements.length > 0 ? targetElements[0] : null;
            debugLog('대상 요소:', targetElement ? '찾음' : '없음');
            
            if (!targetElement) {
                // 현재 이미지 요소가 없으면 해당 이미지 로드
                debugLog(`이미지 로드 시도: index=${currentIndex}`);
                
                if (loadImageCallback) {
                    loadImageCallback(currentIndex);
                }
                
                // 로드 후 재시도 (300ms 후 한번 더)
                setTimeout(() => {
                    const newTargets = this.imageContainer.querySelectorAll(`.image-container[data-index="${currentIndex}"]`);
                    const newTarget = newTargets.length > 0 ? newTargets[0] : null;
                    debugLog('재시도 후 대상 요소:', newTarget ? '찾음' : '없음');
                    
                    if (newTarget) {
                        this.scrollToImageElement(newTarget, smooth);
                        this.highlightCurrentImage(newTarget);
                    }
                }, 300);
                
                return;
            }
            
            // 화면 중앙 스크롤
            this.scrollToImageElement(targetElement, smooth);
            
            // 현재 이미지 강조 표시
            this.highlightCurrentImage(targetElement);
            
        } catch (e) {
            console.error("focusCurrentImage 오류:", e);
        }
    }
    
    /**
     * 현재 이미지 강조 표시
     * @param {HTMLElement} container - 이미지 컨테이너 요소
     */
    highlightCurrentImage(container) {
        if (!container) return;
        
        // 현재 이미지 강조 효과
        container.style.boxShadow = '0 0 15px rgba(29, 161, 242, 0.7)';
        container.style.transform = 'scale(1.02)';
        
        // 애니메이션 효과 - 보다 자연스럽게
        setTimeout(() => {
            container.style.boxShadow = '0 0 10px rgba(29, 161, 242, 0.4)';
            container.style.transform = 'scale(1.01)';
        }, 300);
    }
    
    /**
     * 지정된 이미지 요소로 스크롤
     * @param {HTMLElement} element - 이미지 요소
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    scrollToImageElement(element, smooth = true) {
        if (!element || !this.viewer) {
            debugLog('scrollToImageElement: 원소나 뷰어가 없습니다');
            return;
        }
        
        // 연속 스크롤 중인지 확인
        if (this._isScrolling) {
            // 진행 중인 스크롤 애니메이션 취소
            if (this._scrollAnimationFrame) {
                cancelAnimationFrame(this._scrollAnimationFrame);
                this._scrollAnimationFrame = null;
            }
        }
        
        this._isScrolling = true;
        
        try {
            // 뷰어 크기 및 스크롤 위치 계산
            const viewerRect = this.viewer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            // 화면 중앙에 이미지가 오도록 위치 계산
            const targetPosition = elementRect.top + this.viewer.scrollTop - viewerRect.top;
            const offset = (viewerRect.height - elementRect.height) / 2;
            const scrollTarget = Math.max(0, targetPosition - offset);
            
            debugLog('스크롤 정보:', {
                viewerHeight: viewerRect.height,
                elementHeight: elementRect.height,
                elementTop: elementRect.top,
                viewerTop: viewerRect.top,
                viewerScrollTop: this.viewer.scrollTop,
                targetPosition,
                offset,
                scrollTarget
            });
            
            if (!smooth) {
                // 즉시 스크롤
                this.viewer.scrollTo({
                    top: scrollTarget,
                    behavior: 'auto'
                });
                this._isScrolling = false;
                return;
            }

            // 부드러운 스크롤 직접 구현
            const startPosition = this.viewer.scrollTop;
            const distance = scrollTarget - startPosition;
            const duration = 400; // 스크롤 애니메이션 시간 (ms)
            let startTime;
            
            // 스크롤 애니메이션 함수
            const animateScroll = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsedTime = timestamp - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                // easeInOutCubic 완화 함수 적용
                const easedProgress = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                const currentPosition = startPosition + distance * easedProgress;
                this.viewer.scrollTop = currentPosition;
                
                if (progress < 1) {
                    // 애니메이션 계속
                    this._scrollAnimationFrame = requestAnimationFrame(animateScroll);
                } else {
                    // 애니메이션 완료
                    this._isScrolling = false;
                    this._scrollAnimationFrame = null;
                }
            };
            
            // 애니메이션 시작
            this._scrollAnimationFrame = requestAnimationFrame(animateScroll);
            
        } catch (e) {
            console.error('scrollToImageElement 오류:', e);
            this._isScrolling = false;
            
            // 오류 발생 시 단순한 스크롤로 폴백
            try {
                element.scrollIntoView({
                    behavior: smooth ? 'smooth' : 'auto',
                    block: 'center'
                });
            } catch (e2) {
                console.error('scrollIntoView 도 실패:', e2);
            }
        }
    }
    
    /**
     * 뷰어 정리
     */
    cleanup() {
        // 진행 중인 애니메이션 취소
        if (this._scrollAnimationFrame) {
            cancelAnimationFrame(this._scrollAnimationFrame);
            this._scrollAnimationFrame = null;
        }
        
        this._isScrolling = false;
        this.viewer = null;
        this.imageContainer = null;
    }
}

// == URLManager.js ==

/**
 * URL 관리 클래스
 */
class URLManager {
    /**
     * 미디어란 URL인지 확인
     * @returns {boolean} 미디어란 여부
     */
    static isMediaTab() {
        return window.location.pathname.match(/\/[^\/]+\/media/);
    }
    
    /**
     * URL에서 /photo/ 경로 제거
     */
    static cleanPhotoPath() {
        if (window.location.href.includes('/photo/')) {
            const newUrl = window.location.href.replace(/\/photo\/\d+$/, '');
            history.replaceState(null, '', newUrl);
        }
    }
    
    /**
     * URL 변경 감지 설정
     */
    static setupURLChangeDetection() {
        try {
            const titleElement = document.querySelector('title');
            if (titleElement) {
                const urlObserver = new MutationObserver(() => {
                    URLManager.cleanPhotoPath();
                });
                
                urlObserver.observe(titleElement, {
                    subtree: true,
                    characterData: true,
                    childList: true
                });
                
                debugLog('URL 변경 감지 설정 완료 (title 요소 방식)');
            } else {
                // title 요소를 찾을 수 없는 경우 정기적으로 확인
                let lastUrl = window.location.href;
                setInterval(() => {
                    if (lastUrl !== window.location.href) {
                        lastUrl = window.location.href;
                        URLManager.cleanPhotoPath();
                    }
                }, 500);
                
                debugLog('URL 변경 감지 설정 완료 (폴링 방식)');
            }
        } catch (e) {
            console.error("URL 감시 설정 중 오류 발생:", e);
        }
    }
}

// == EventListeners.js ==

/**
 * 이벤트 리스너 관리 클래스
 */
class EventListeners {
    /**
     * 레이아웃 연결 요소
     */
    static layoutConnectors = {
        // 언어 선택기 연결 요소
        languageSelectorContainer: null,
        // 테마 토글 버튼
        themeToggleBtn: null,
        // 레이아웃 토글 버튼
        layoutToggleBtn: null,
        // 전역 제어 패널
        controlPanel: null
    };
    
    /**
     * 전체 UI 초기화 - 추가 UI 기능
     */
    static setupGlobalUI() {
        // 전역 제어 패널 생성
        EventListeners.setupControlPanel();
        
        // 단축키 설정
        EventListeners.setupGlobalKeyboardShortcuts();
        
        debugLog('전역 UI 초기화 완료');
    }
    
    /**
     * 전역 제어 패널 설정
     */
    static setupControlPanel() {
        // 기존 패널 제거
        if (EventListeners.layoutConnectors.controlPanel) {
            try {
                EventListeners.layoutConnectors.controlPanel.remove();
            } catch (e) {
                console.error('제어 패널 요소 삭제 오류:', e);
            }
        }
        
        const { bgColor, textColor } = Utils.getUserUIColor();
        
        // 제어 패널 컨테이너 생성
        const panel = document.createElement('div');
        panel.className = 'xcom-control-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 20px;
            z-index: 9000;
            display: flex;
            align-items: center;
            background: var(--xcom-bg-secondary, ${Utils.addAlpha(bgColor, 0.85)});
            color: var(--xcom-text-primary, ${textColor});
            padding: 4px 8px;
            border-radius: var(--xcom-radius-md, 8px);
            box-shadow: var(--xcom-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
            border: 1px solid var(--xcom-border-light, #e1e8ed);
            gap: 8px;
        `;
        
        // 테마 토글 버튼 생성
        const themeToggleBtn = ThemeManager.createThemeToggle();
        EventListeners.layoutConnectors.themeToggleBtn = themeToggleBtn;
        
        // 레이아웃 토글 버튼 생성
        const layoutToggleBtn = LayoutManager.createLayoutToggle();
        EventListeners.layoutConnectors.layoutToggleBtn = layoutToggleBtn;
        
        // 언어 선택기 생성
        const languageSelector = LanguageSelector.createLanguageDropdown((newLocale) => {
            window.location.reload();
        });
        EventListeners.layoutConnectors.languageSelectorContainer = languageSelector;
        
        // 로고/타이틀 생성
        const logo = document.createElement('div');
        logo.className = 'xcom-logo';
        logo.innerHTML = '<i class="fa-solid fa-image" aria-hidden="true"></i>';
        logo.style.cssText = `
            font-size: 18px;
            color: var(--xcom-accent-primary, #1da1f2);
            margin-right: 4px;
        `;
        
        // 패널에 요소 추가
        panel.appendChild(logo);
        panel.appendChild(themeToggleBtn);
        panel.appendChild(layoutToggleBtn);
        panel.appendChild(languageSelector);
        
        // 문서에 패널 추가
        document.body.appendChild(panel);
        
        // 패널 참조 저장
        EventListeners.layoutConnectors.controlPanel = panel;
        
        // 글로벌 스타일 추가 (필요한 경우)
        if (!document.getElementById('xcom-global-styles')) {
            const style = document.createElement('style');
            style.id = 'xcom-global-styles';
            style.textContent = `
                .xcom-control-panel {
                    transition: opacity 0.3s ease;
                }
                .xcom-control-panel:hover {
                    opacity: 1;
                }
                .xcom-control-panel.minimized {
                    opacity: 0.3;
                }
                @media (max-width: 768px) {
                    .xcom-control-panel {
                        top: auto;
                        bottom: 10px;
                        right: 10px;
                        padding: 4px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 5초 후 투명도 줄이기
        setTimeout(() => {
            panel.classList.add('minimized');
        }, 5000);
        
        // 마우스 오버 시 투명도 복원
        panel.addEventListener('mouseenter', () => {
            panel.classList.remove('minimized');
        });
        
        // 마우스 아웃 시 투명도 줄이기
        panel.addEventListener('mouseleave', () => {
            setTimeout(() => {
                panel.classList.add('minimized');
            }, 1000);
        });
        
        debugLog('전역 제어 패널 설정 완료');
    }
    
    /**
     * 전역 키보드 단축키 설정
     */
    static setupGlobalKeyboardShortcuts() {
        // 기존 리스너 제거 (중복 방지)
        if (EventListeners._globalKeyHandler) {
            document.removeEventListener('keydown', EventListeners._globalKeyHandler);
        }
        
        // 새 키보드 이벤트 리스너
        EventListeners._globalKeyHandler = (event) => {
            // 입력 요소에서는 단축키 비활성화
            if (event.target.matches('input, textarea, select, [contenteditable="true"]')) {
                return;
            }
            
            // Alt + T: 테마 전환
            if (event.altKey && event.key === 't') {
                event.preventDefault();
                ThemeManager.cycleTheme();
            }
            
            // Alt + L: 레이아웃 전환
            if (event.altKey && event.key === 'l') {
                event.preventDefault();
                const newMode = LayoutManager.getCurrentMode() === LayoutManager.LAYOUT_MODES.COMPACT
                    ? LayoutManager.LAYOUT_MODES.COMFORTABLE
                    : LayoutManager.LAYOUT_MODES.COMPACT;
                LayoutManager.setLayoutMode(newMode);
            }
        };
        
        // 이벤트 리스너 등록
        document.addEventListener('keydown', EventListeners._globalKeyHandler);
        
        debugLog('전역 키보드 단축키 설정 완료');
    }
    
    /**
     * 이미지 클릭 이벤트 핸들러 설정
     */
    static setupImageClickHandler() {
        document.addEventListener("click", EventListeners.imageClickHandler, { 
            capture: true, 
            passive: false 
        });
        
        debugLog('이미지 클릭 이벤트 핸들러 설정 완료');
    }
    
    /**
     * 이미지 클릭 이벤트 핸들러
     * @param {Event} event - 클릭 이벤트
     */
    static imageClickHandler(event) {
        // 이미지 요소가 있는지 확인
        const imageElement = event.target.closest('img[src*="pbs.twimg.com/media/"]');
        if (!imageElement) return;
        
        const isInMediaTab = URLManager.isMediaTab();
        debugLog(`이미지 클릭 감지 - 미디어란: ${isInMediaTab}`);
        
        // 미디어란이고 미디어란 지원이 비활성화된 경우 기본 동작 허용
        if (isInMediaTab && !CONFIG.enableMediaTab) {
            debugLog('미디어란 지원이 비활성화되어 있습니다. 기본 동작 허용');
            return;
        }
        
        // 미디어란인 경우 상위 요소 탐색 방식 변경
        let containerElement;
        if (isInMediaTab) {
            // 미디어란에서는 다른 컨테이너 사용
            // 여러 가지 선택자를 시도하여 바른 컨테이너를 찾음
            containerElement = event.target.closest('[data-testid="cellInnerDiv"]') || 
                               event.target.closest('[role="link"]') ||
                               event.target.closest('div[tabindex="0"]');

            // 컨테이너를 찾지 못한 경우, 클릭한 이미지를 포함하는 가장 가까운 대용 컨테이너 사용
            if (!containerElement) {
                const parentNode = imageElement.parentNode;
                if (parentNode && parentNode.parentNode) {
                    containerElement = parentNode.parentNode;
                } else {
                    containerElement = parentNode || imageElement;
                }
            }
            
            debugLog('미디어란 컨테이너 요소:', containerElement);
        } else {
            // 일반 타임라인에서는 article 요소 사용
            containerElement = event.target.closest("article");
            debugLog('일반 컨테이너 요소:', containerElement);
        }
        
        if (!containerElement) {
            debugLog('컨테이너 요소를 찾을 수 없습니다');
            return;
        }
        
        // 이벤트 방지
        event.preventDefault();
        event.stopPropagation();
        
        // 이미지 뷰어 초기화 - 클릭된 이미지 정보 전달
        const viewer = new ImageViewer();
        viewer.init(containerElement, imageElement.src);
    }
    
    /**
     * 터치 및 마우스 이벤트 핸들러 설정
     */
    static setupTouchAndMouseHandlers() {
        // 마우스 다운 및 터치 시작 이벤트 캡처
        document.addEventListener("pointerdown", (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            
            const imageElement = event.target.closest('img[src*="pbs.twimg.com/media/"]');
            if (imageElement) {
                // 미디어란에서도 이미지 클릭 방지
                if (URLManager.isMediaTab() && CONFIG.enableMediaTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    debugLog('미디어란에서 이미지 클릭 방지 성공');
                } else {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }, { capture: true, passive: false });
        
        // 터치 시작 이벤트도 캡처 (모바일 지원)
        document.addEventListener("touchstart", (event) => {
            const touch = event.touches[0];
            if (!touch) return;
            
            // 터치 위치에서 요소 찾기
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.tagName === 'IMG' && element.src && element.src.includes('pbs.twimg.com/media/')) {
                if (URLManager.isMediaTab() && CONFIG.enableMediaTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }
            }
        }, { capture: true, passive: false });
        
        debugLog('터치 및 마우스 이벤트 핸들러 설정 완료');
    }
    
    /**
     * 트위터의 이미지 확대 기능 방지 - 강화 버전
     */
    static setupEventPreventionReinforcement() {
        const reinforcementListener = (event) => {
            if ('button' in event && event.button !== 0) return;
            
            // 뷰어 내부 요소는 처리하지 않음
            if (event.target.closest('#xcom-image-viewer')) {
                return;
            }
            
            // 이미지 뷰어 내부 요소인지 확인
            if (event.target.classList && 
                (event.target.classList.contains('xcom-viewer-img') || 
                 event.target.classList.contains('xcom-viewer-container') || 
                 event.target.classList.contains('xcom-thumbnail'))) {
                return;
            }
            
            // 제어 패널 내부 요소인지 확인
            if (event.target.closest('.xcom-control-panel')) {
                return;
            }
            
            // 이미지 요소 찾기 - 간접적인 이미지 클릭도 캡처
            const imgElement = event.target.tagName === 'IMG' ? 
                              event.target : 
                              event.target.querySelector('img[src*="pbs.twimg.com/media/"]');
            
            if (imgElement && imgElement.src && imgElement.src.includes('pbs.twimg.com/media/')) {
                const isInMediaTab = URLManager.isMediaTab();
                debugLog(`강화 이미지 착취 - 미디어란: ${isInMediaTab}`, imgElement);
                
                // 미디어란이고 미디어란 지원이 활성화된 경우
                if (isInMediaTab && CONFIG.enableMediaTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    
                    // 이미지 클릭 핸들러 직접 호출
                    setTimeout(() => {
                        EventListeners.imageClickHandler({
                            target: imgElement,
                            preventDefault: () => {},
                            stopPropagation: () => {}
                        });
                    }, 0);
                } else {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        };
        
        // 다양한 이벤트에 리스너 추가
        document.body.addEventListener('click', reinforcementListener, {
            capture: true,
            passive: false
        });
        
        document.body.addEventListener('mousedown', reinforcementListener, {
            capture: true,
            passive: false
        });
        
        document.body.addEventListener('touchstart', reinforcementListener, {
            capture: true,
            passive: false
        });
        
        debugLog('이벤트 방지 강화 설정 완료');
    }
}

// == core/ViewerComponentInitializer.js ==

/**
 * 뷰어 컴포넌트 초기화를 담당하는 클래스
 */
class ViewerComponentInitializer {
    /**
     * 뷰어 컴포넌트 설정
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static setupComponents(core) {
        core.navigation = new core.deps.ViewerNavigation(core.viewer);
        core.navigation.currentIndex = core.state.getCurrentIndex();
        
        core.download = new core.deps.ViewerDownload(core.viewer);
        core.events = new core.deps.ViewerEvents(core.viewer);
        
        // 핸들러 생성
        const handlers = {
            prevImage: () => core.prevImage(),
            nextImage: () => core.nextImage(),
            selectImage: (index, smooth = true) => core.selectImage(index, smooth),
            focusImage: (index) => core.focus.focusCurrentImage(
                index, 
                true, 
                (idx) => core.imageLoader.forceLoadImage(
                    core.tweetInfo.imageUrls[idx], 
                    idx, 
                    handlers
                )
            ),
            adjustImages: (mode) => core.adjustImages(mode),
            downloadCurrentImage: () => core.downloadCurrentImage(),
            downloadAllImages: () => core.downloadAllImages(),
            close: () => core.destroy(),
            goToFirst: () => core.goToFirst(),
            goToLast: () => core.goToLast()
        };
        
        // 이미지 컨테이너 생성
        core.imageContainer = core.dom.createImageContainer();
        
        // 이미지 로더 설정
        core.imageLoader = new core.deps.ViewerImageLoader(core.imageContainer);
        core.imageLoader.setDOMComponent(core.dom);
        core.imageLoader.setCurrentIndex(core.state.getCurrentIndex());
        
        // 포커스 관리자 설정
        core.focus = new core.deps.ViewerFocus(core.viewer, core.imageContainer);
        
        // 이미지 조정 관리자 설정
        core.adjustment = new core.deps.ImageAdjustment(core.imageContainer);
        
        // UI 컴포넌트 생성
        core.optionsBar = core.dom.createOptionsBar(
            core.tweetInfo, 
            core.state.getCurrentIndex(), 
            core.adjustment.getCurrentMode(), 
            handlers
        );
        
        core.thumbnailBar = core.dom.createThumbnailBar(
            core.tweetInfo, 
            core.state.getCurrentIndex(), 
            handlers
        );
        
        // 썸네일 관리자 설정
        core.thumbnailManager = new core.deps.ThumbnailManager(core.thumbnailBar);
        core.thumbnailManager.setCurrentIndex(core.state.getCurrentIndex());
        core.thumbnailManager.setupThumbnailClickHandlers((index, smooth) => core.selectImage(index, smooth));
        
        // 현재 이미지 인디케이터 생성
        core.currentImageIndicator = core.dom.createCurrentImageIndicator(
            core.state.getCurrentIndex(), 
            core.tweetInfo.imageUrls.length
        );
        
        // 컴포넌트를 뷰어에 추가
        core.viewer.appendChild(core.optionsBar);
        core.viewer.appendChild(core.imageContainer);
        core.viewer.appendChild(core.thumbnailBar);
        core.viewer.appendChild(core.currentImageIndicator);
    }
    
    /**
     * 이벤트 핸들러 설정
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static setupEventHandlers(core) {
        // 키보드 및 마우스 네비게이션 설정
        const handlers = {
            prevImage: () => core.prevImage(),
            nextImage: () => core.nextImage(),
            close: () => core.destroy(),
            goToFirst: () => core.goToFirst(),
            goToLast: () => core.goToLast()
        };
        
        core.keyboardHandler = core.navigation.setupKeyboardNavigation(handlers);
        core.wheelHandler = core.navigation.setupMouseWheelNavigation(handlers);
        
        // UI 자동 숨김 설정
        core.events.setupUIAutoHide(core.optionsBar, core.thumbnailBar);
        
        // 배경 클릭 핸들러 설정
        core.events.setupBackgroundClickHandler(() => core.destroy());
        
        // 이미지 교차 관찰 설정
        const intersectionCallbacks = {
            isManualNavigating: () => core.state.isManualNavigating,
            getCurrentIndex: () => core.state.getCurrentIndex(),
            updateCurrentIndex: (index) => core.updateCurrentIndex(index)
        };
        
        const observer = core.events.setupIntersectionObserver(core.imageContainer, intersectionCallbacks);
        if (observer) {
            core.observers.push(observer);
        }
        
        // viewer-close 이벤트 리스너 추가
        core.viewer.addEventListener('viewer-close', () => core.destroy());
    }
}

// == core/ViewerNavigationManager.js ==

/**
 * 뷰어 내비게이션을 담당하는 클래스
 */
class ViewerNavigationManager {
    /**
     * 이전 이미지로 이동
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static prevImage(core) {
        const newIndex = core.state.navigatePrev();
        ViewerNavigationManager.updateViewerForIndex(core, newIndex);
    }
    
    /**
     * 다음 이미지로 이동
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static nextImage(core) {
        const newIndex = core.state.navigateNext();
        ViewerNavigationManager.updateViewerForIndex(core, newIndex);
    }
    
    /**
     * 특정 이미지 선택
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     * @param {number} index - 선택할 이미지 인덱스
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    static selectImage(core, index, smooth = true) {
        debugLog(`selectImage 호출됨: index=${index}, smooth=${smooth}`);
        
        // 범위 확인
        if (index < 0 || index >= core.tweetInfo.imageUrls.length) {
            debugLog(`잘못된 인덱스: ${index}, 최대 값: ${core.tweetInfo.imageUrls.length - 1}`);
            return;
        }
        
        // 이미 진행 중인 선택 작업이 있는지 확인
        if (!core.state.canSelectImage()) {
            debugLog('이미지 선택 작업이 이미 진행 중입니다. 중복 요청 무시.');
            return;
        }
        
        // 선택 작업 시작
        core.state.startSelecting();
        
        try {
            // 이전 인덱스와 다른 경우에만 네비게이션 로직 적용
            if (index !== core.state.getCurrentIndex()) {
                core.state.selectImage(index);
                
                // UI 업데이트
                core.updateAllUIElements();
            }
            
            // 포커스 설정 - 인덱스 변경여부와 관계없이 항상 실행
            core.focus.focusCurrentImage(
                index, 
                smooth, 
                (idx) => core.imageLoader.forceLoadImage(
                    core.tweetInfo.imageUrls[idx], 
                    idx, 
                    {
                        selectImage: (i) => core.selectImage(i),
                        focusImage: (i) => core.focus.focusCurrentImage(i, true)
                    }
                )
            );
            
            // 이미지가 제대로 로드되었는지 확인
            const targetImage = core.imageContainer.querySelector(`.image-container[data-index="${index}"] img`);
            if (targetImage && (!targetImage.complete || !targetImage.naturalWidth)) {
                // 이미지가 아직 로드 중인 경우
                debugLog(`이미지 ${index}가 아직 로드 중입니다. 로드 완료 후 포커스합니다.`);
                targetImage.addEventListener('load', () => {
                    setTimeout(() => {
                        core.focus.focusCurrentImage(index, smooth);
                    }, 50);
                }, { once: true });
            }
        } catch (e) {
            console.error('이미지 선택 오류:', e);
        } finally {
            // 선택 작업 완료 플래그 해제
            core.state.endSelecting(200);
        }
    }
    
    /**
     * 첫 번째 이미지로 이동
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static goToFirst(core) {
        const newIndex = core.state.goToFirst();
        ViewerNavigationManager.selectImage(core, newIndex);
    }
    
    /**
     * 마지막 이미지로 이동
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static goToLast(core) {
        const newIndex = core.state.goToLast();
        ViewerNavigationManager.selectImage(core, newIndex);
    }
    
    /**
     * 현재 인덱스 업데이트
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     * @param {number} index - 새 인덱스
     */
    static updateCurrentIndex(core, index) {
        if (!core.state.updateIndex(index)) return;
        
        // UI 업데이트
        core.updateAllUIElements();
    }
    
    /**
     * 새 인덱스로 뷰어 업데이트
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     * @param {number} index - 새 인덱스
     */
    static updateViewerForIndex(core, index) {
        // 상태 업데이트
        core.state.updateIndex(index);
        
        // UI 업데이트
        core.updateAllUIElements();
        
        // 이미지 포커스
        core.focus.focusCurrentImage(
            index, 
            true, 
            (idx) => core.imageLoader.forceLoadImage(
                core.tweetInfo.imageUrls[idx], 
                idx, 
                {
                    selectImage: (i) => core.selectImage(i),
                    focusImage: (i) => core.focus.focusCurrentImage(i, true)
                }
            )
        );
    }
}

// == core/ViewerUIManager.js ==

/**
 * 뷰어 UI 관리를 담당하는 클래스
 */
class ViewerUIManager {
    /**
     * 모든 UI 요소 업데이트
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static updateAllUIElements(core) {
        const currentIndex = core.state.getCurrentIndex();
        
        // 드롭다운 메뉴 업데이트
        const imageSelect = document.getElementById('image-select');
        if (imageSelect) {
            imageSelect.value = currentIndex;
        }
        
        // 썸네일 바 업데이트
        core.thumbnailManager.setCurrentIndex(currentIndex);
        core.thumbnailManager.updateThumbnailFocus();
        
        // 현재 이미지 인디케이터 업데이트
        if (core.currentImageIndicator) {
            core.currentImageIndicator.textContent = translate('viewer.indicators.currentImage', { 
                current: currentIndex + 1, 
                total: core.tweetInfo.imageUrls.length 
            });
        }
        
        // 네비게이션 인덱스 업데이트
        if (core.navigation) {
            core.navigation.currentIndex = currentIndex;
        }
    }
    
    /**
     * 이미지 크기 조정
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     * @param {string} mode - 조정 모드
     */
    static adjustImages(core, mode) {
        core.adjustment.adjustImages(mode, () => {
            core.focus.focusCurrentImage(
                core.state.getCurrentIndex(), 
                true, 
                (idx) => core.imageLoader.forceLoadImage(
                    core.tweetInfo.imageUrls[idx], 
                    idx, 
                    {
                        selectImage: (i) => core.selectImage(i),
                        focusImage: (i) => core.focus.focusCurrentImage(i, true)
                    }
                )
            );
        });
    }
    
    /**
     * 현재 이미지 다운로드
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static downloadCurrentImage(core) {
        core.download.downloadCurrentImage(core.tweetInfo, core.state.getCurrentIndex());
    }
    
    /**
     * 모든 이미지 다운로드
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static downloadAllImages(core) {
        core.download.downloadAllImages(core.tweetInfo);
    }
}

// == core/ViewerCleanup.js ==
/**
 * 뷰어 정리 담당 클래스
 */
class ViewerCleanup {
    /**
     * 뷰어 정리 및 종료
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static destroy(core) {
        if (!core.viewer) return;
        
        // 이벤트 정리
        if (core.events) {
            core.events.cleanupEventListeners();
        }
        
        // 키보드 이벤트 정리
        if (core.keyboardHandler) {
            document.removeEventListener('keydown', core.keyboardHandler);
        }
        
        // 마우스 휠 이벤트 정리
        if (core.wheelHandler && core.viewer) {
            core.viewer.removeEventListener('wheel', core.wheelHandler);
        }
        
        // 옵저버 정리
        core.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        
        // 포커스 정리
        if (core.focus) {
            core.focus.cleanup();
        }
        
        // 상태 정리
        if (core.state) {
            core.state.cleanup();
        }
        
        // DOM 정리
        if (core.viewer && core.viewer.parentNode) {
            core.viewer.parentNode.removeChild(core.viewer);
        }
        
        // 상태 초기화
        core.viewer = null;
        core.optionsBar = null;
        core.thumbnailBar = null;
        core.imageContainer = null;
        core.currentImageIndicator = null;
        core.observers = [];
        
        // 스크롤 위치 복원
        document.body.style.overflow = '';
        window.scrollTo(0, core.savedScrollPos);
    }
}

// == ViewerCore.js ==

// 새로 분할된 핵심 모듈 가져오기

/**
 * 이미지 뷰어 핵심 클래스
 */
class ViewerCore {
    constructor() {
        // 기본 상태
        this.tweetInfo = new TweetInfo();
        this.savedScrollPos = 0;
        
        // DOM 요소
        this.viewer = null;
        this.optionsBar = null;
        this.thumbnailBar = null;
        this.imageContainer = null;
        this.currentImageIndicator = null;
        
        // 컴포넌트 및 유틸리티
        this.dom = null;
        this.navigation = null;
        this.download = null;
        this.events = null;
        this.imageLoader = null;
        this.focus = null;
        this.adjustment = null;
        this.thumbnailManager = null;
        this.state = null;
        
        // 이벤트 핸들러
        this.keyboardHandler = null;
        this.wheelHandler = null;
        
        // 옵저버 및 기타
        this.observers = [];
        
        // 의존성 참조 - 분리된 모듈에서 접근할 수 있도록
        this.deps = {
            ViewerNavigation,
            ViewerDownload,
            ViewerEvents,
            ViewerImageLoader,
            ViewerFocus,
            ImageAdjustment,
            ThumbnailManager
        };
    }
    
    /**
     * 뷰어 초기화
     * @param {HTMLElement} tweetElement - 트윗 요소
     * @param {string} clickedImageSrc - 클릭한 이미지 URL (선택 사항)
     */
    init(tweetElement, clickedImageSrc = null) {
        if (!this.tweetInfo.extractFromTweet(tweetElement)) return;
        
        // 기존 뷰어 정리
        this.destroy();
        
        // 스크롤 위치 저장 및 스크롤 방지
        this.savedScrollPos = window.pageYOffset || document.documentElement.scrollTop;
        document.body.style.overflow = 'hidden';
        
        // 클릭한 이미지의 인덱스 찾기
        let initialIndex = 0;
        if (clickedImageSrc) {
            const originalSrc = clickedImageSrc.replace(/&name=\w+/, '&name=orig');
            const clickedIndex = this.tweetInfo.imageUrls.findIndex(url => url === originalSrc);
            if (clickedIndex !== -1) {
                initialIndex = clickedIndex;
                debugLog(`클릭한 이미지 인덱스: ${clickedIndex}`);
            }
        }
        
        // 상태 초기화
        this.state = new ViewerState();
        this.state.init(initialIndex, this.tweetInfo.imageUrls.length);
        
        this.createViewer();
        ViewerComponentInitializer.setupComponents(this);
        ViewerComponentInitializer.setupEventHandlers(this);
        
        // 이미지 로딩 시작
        const handlers = {
            selectImage: (index, smooth = true) => this.selectImage(index, smooth),
            focusImage: (index) => this.focus.focusCurrentImage(index, true, () => 
                this.imageLoader.forceLoadImage(this.tweetInfo.imageUrls[index], index, handlers)
            )
        };
        
        this.imageLoader.loadImages(this.tweetInfo.imageUrls, handlers);
        
        document.body.appendChild(this.viewer);
        this.focus.focusCurrentImage(this.state.getCurrentIndex(), false, (index) => 
            this.imageLoader.forceLoadImage(this.tweetInfo.imageUrls[index], index, handlers)
        );
    }
    
    /**
     * 뷰어 생성
     */
    createViewer() {
        this.dom = new ViewerDOM();
        this.viewer = this.dom.createViewer();
        
        // 닫기 기능 강화
        this.viewer.addEventListener('click', (e) => {
            if (e.target === this.viewer) {
                e.preventDefault();
                e.stopPropagation();
                this.destroy();
            }
        });
    }
    
    /**
     * 이전 이미지로 이동
     */
    prevImage() {
        ViewerNavigationManager.prevImage(this);
    }
    
    /**
     * 다음 이미지로 이동
     */
    nextImage() {
        ViewerNavigationManager.nextImage(this);
    }
    
    /**
     * 특정 이미지 선택
     * @param {number} index - 선택할 이미지 인덱스
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    selectImage(index, smooth = true) {
        ViewerNavigationManager.selectImage(this, index, smooth);
    }
    
    /**
     * 첫 번째 이미지로 이동
     */
    goToFirst() {
        ViewerNavigationManager.goToFirst(this);
    }
    
    /**
     * 마지막 이미지로 이동
     */
    goToLast() {
        ViewerNavigationManager.goToLast(this);
    }
    
    /**
     * 현재 인덱스 업데이트
     * @param {number} index - 새 인덱스
     */
    updateCurrentIndex(index) {
        ViewerNavigationManager.updateCurrentIndex(this, index);
    }
    
    /**
     * 모든 UI 요소 업데이트
     */
    updateAllUIElements() {
        ViewerUIManager.updateAllUIElements(this);
    }
    
    /**
     * 새 인덱스로 뷰어 업데이트
     * @param {number} index - 새 인덱스
     */
    updateViewerForIndex(index) {
        ViewerNavigationManager.updateViewerForIndex(this, index);
    }
    
    /**
     * 이미지 크기 조정
     * @param {string} mode - 조정 모드
     */
    adjustImages(mode) {
        ViewerUIManager.adjustImages(this, mode);
    }
    
    /**
     * 현재 이미지 다운로드
     */
    downloadCurrentImage() {
        ViewerUIManager.downloadCurrentImage(this);
    }
    
    /**
     * 모든 이미지 다운로드
     */
    downloadAllImages() {
        ViewerUIManager.downloadAllImages(this);
    }
    
    /**
     * 뷰어 정리 및 종료
     */
    destroy() {
        ViewerCleanup.destroy(this);
    }
}

// == ImageViewer.js ==

/**
 * 이미지 뷰어 진입점 클래스
 * 호환성을 위해 ViewerCore를 감싸는 래퍼 클래스로 유지
 */
class ImageViewer {
    constructor() {
        this.core = new ViewerCore();
    }

    /**
     * 뷰어 초기화
     * @param {HTMLElement} tweetElement - 트윗 요소
     * @param {string} clickedImageSrc - 클릭한 이미지 URL
     */
    init(tweetElement, clickedImageSrc = null) {
        this.core.init(tweetElement, clickedImageSrc);
    }
    
    /**
     * 뷰어 정리 및 종료
     */
    destroy() {
        this.core.destroy();
    }
}

// == theme/themeVariables.js ==
/**
 * 테마 변수 정의
 * 앱 전체에서 사용되는 색상, 간격, 크기 등의 디자인 변수
 */
const themeVariables = {
  // 라이트 테마 변수
  light: {
    // 색상
    "bg-primary": "#ffffff",
    "bg-secondary": "#f5f8fa",
    "bg-tertiary": "#e1e8ed",
    "bg-overlay": "rgba(255, 255, 255, 0.9)",
    "bg-modal": "rgba(0, 0, 0, 0.7)",
    
    "text-primary": "#14171a",
    "text-secondary": "#657786",
    "text-tertiary": "#aab8c2",
    "text-inverse": "#ffffff",
    
    "accent-primary": "#1da1f2",
    "accent-secondary": "#0c7abf",
    "accent-tertiary": "#e1f5fe",
    
    "border-light": "#e1e8ed",
    "border-medium": "#ccd6dd",
    "border-dark": "#657786",
    
    // 그림자
    "shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.1)",
    "shadow-md": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "shadow-lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
    
    // 효과
    "opacity-disabled": "0.5",
    "opacity-hover": "0.8",
    
    // 레이아웃
    "radius-sm": "4px",
    "radius-md": "8px",
    "radius-lg": "16px",
    "radius-pill": "9999px",
    
    "space-xs": "4px",
    "space-sm": "8px",
    "space-md": "16px",
    "space-lg": "24px",
    "space-xl": "32px",
    
    // 애니메이션
    "transition-fast": "150ms",
    "transition-normal": "300ms",
    "transition-slow": "500ms",
    
    // 헤더와 바 요소
    "header-bg": "rgba(255, 255, 255, 0.85)",
    "header-text": "#14171a",
    "header-border": "#e1e8ed",
    "header-height": "50px",
    
    "toolbar-bg": "rgba(255, 255, 255, 0.85)",
    "toolbar-text": "#14171a",
    "toolbar-border": "#e1e8ed",
    
    "thumbnail-bg": "rgba(255, 255, 255, 0.85)",
    "thumbnail-border": "#e1e8ed",
    "thumbnail-active": "#1da1f2",
    
    // 이미지 뷰어 특수 변수
    "backdrop-color": "rgba(0, 0, 0, 0.85)",
    "indicator-bg": "rgba(0, 0, 0, 0.7)",
    "indicator-text": "#ffffff",
    "button-hover-bg": "#f5f8fa",
  },
  
  // 다크 테마 변수
  dark: {
    // 색상
    "bg-primary": "#15202b",
    "bg-secondary": "#1c2938",
    "bg-tertiary": "#243447",
    "bg-overlay": "rgba(21, 32, 43, 0.9)",
    "bg-modal": "rgba(0, 0, 0, 0.85)",
    
    "text-primary": "#ffffff",
    "text-secondary": "#8899a6",
    "text-tertiary": "#66757f",
    "text-inverse": "#15202b",
    
    "accent-primary": "#1da1f2",
    "accent-secondary": "#1a91da",
    "accent-tertiary": "#0c2d48",
    
    "border-light": "#38444d",
    "border-medium": "#536471",
    "border-dark": "#8899a6",
    
    // 그림자
    "shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.3)",
    "shadow-md": "0 4px 6px rgba(0, 0, 0, 0.4)",
    "shadow-lg": "0 10px 15px rgba(0, 0, 0, 0.5)",
    
    // 효과
    "opacity-disabled": "0.5",
    "opacity-hover": "0.9",
    
    // 레이아웃
    "radius-sm": "4px",
    "radius-md": "8px",
    "radius-lg": "16px",
    "radius-pill": "9999px",
    
    "space-xs": "4px",
    "space-sm": "8px",
    "space-md": "16px",
    "space-lg": "24px",
    "space-xl": "32px",
    
    // 애니메이션
    "transition-fast": "150ms",
    "transition-normal": "300ms",
    "transition-slow": "500ms",
    
    // 헤더와 바 요소
    "header-bg": "rgba(21, 32, 43, 0.85)",
    "header-text": "#ffffff",
    "header-border": "#38444d",
    "header-height": "50px",
    
    "toolbar-bg": "rgba(21, 32, 43, 0.85)",
    "toolbar-text": "#ffffff",
    "toolbar-border": "#38444d",
    
    "thumbnail-bg": "rgba(21, 32, 43, 0.85)",
    "thumbnail-border": "#38444d",
    "thumbnail-active": "#1da1f2",
    
    // 이미지 뷰어 특수 변수
    "backdrop-color": "rgba(0, 0, 0, 0.95)",
    "indicator-bg": "rgba(29, 161, 242, 0.2)",
    "indicator-text": "#ffffff",
    "button-hover-bg": "#243447",
  }
};

// == theme/ThemeManager.js ==

/**
 * 테마 관리 클래스
 * 라이트/다크 모드와 같은 테마 설정을 관리하고 적용합니다.
 */
class ThemeManager {
  static LOCAL_STORAGE_KEY = "xcom-gallery-theme";
  static THEMES = {
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
  };
  
  // 현재 테마
  static currentTheme = null;
  
  // 테마 변경 리스너
  static themeChangeListeners = [];
  
  /**
   * 테마 관리자 초기화
   * @returns {string} 적용된 테마
   */
  static initialize() {
    // 저장된 테마 설정 불러오기
    const savedTheme = StorageUtils.getLocalStorageItem(
      this.LOCAL_STORAGE_KEY, 
      this.THEMES.SYSTEM
    );
    
    // 시스템 설정 감지 및 이벤트 리스너 설정
    this.setupSystemThemeListener();
    
    // 테마 적용
    return this.setTheme(savedTheme, false);
  }
  
  /**
   * 시스템 테마 설정 감지 리스너 설정
   */
  static setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      // 변경 감지 리스너
      const handleChange = (e) => {
        if (this.currentTheme === this.THEMES.SYSTEM) {
          this.applyThemeVariables(e.matches ? this.THEMES.DARK : this.THEMES.LIGHT);
          this.notifyThemeChangeListeners();
        }
      };
      
      // 현대 이벤트 리스너 API 사용
      try {
        mediaQuery.addEventListener("change", handleChange);
      } catch (e) {
        // 구형 브라우저 호환성
        mediaQuery.addListener(handleChange);
      }
    }
  }
  
  /**
   * 테마 설정
   * @param {string} theme - 테마 식별자 (light, dark, system)
   * @param {boolean} save - 설정 저장 여부
   * @returns {string} 적용된 테마
   */
  static setTheme(theme, save = true) {
    // 유효한 테마인지 확인
    if (!Object.values(this.THEMES).includes(theme)) {
      theme = this.THEMES.SYSTEM;
    }
    
    this.currentTheme = theme;
    
    // 시스템 테마일 경우 현재 시스템 설정 감지
    if (theme === this.THEMES.SYSTEM) {
      const isDarkMode = window.matchMedia && 
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      this.applyThemeVariables(isDarkMode ? this.THEMES.DARK : this.THEMES.LIGHT);
    } else {
      this.applyThemeVariables(theme);
    }
    
    // 테마 설정 저장
    if (save) {
      StorageUtils.setLocalStorageItem(this.LOCAL_STORAGE_KEY, theme);
    }
    
    // 변경 알림
    this.notifyThemeChangeListeners();
    
    return this.getEffectiveTheme();
  }
  
  /**
   * 현재 적용된 테마 가져오기
   * @returns {string} 현재 적용 중인 테마
   */
  static getCurrentTheme() {
    return this.currentTheme || this.THEMES.SYSTEM;
  }
  
  /**
   * 실제로 적용된 테마 가져오기 (시스템 테마가 아닌 실제 표시 테마)
   * @returns {string} 효과적으로 적용된 테마
   */
  static getEffectiveTheme() {
    if (this.currentTheme !== this.THEMES.SYSTEM) {
      return this.currentTheme;
    }
    
    // 시스템 테마일 경우 현재 시스템 설정 반환
    return window.matchMedia && 
      window.matchMedia("(prefers-color-scheme: dark)").matches ? 
      this.THEMES.DARK : this.THEMES.LIGHT;
  }
  
  /**
   * 테마 변수 적용
   * @param {string} theme - 적용할 테마
   */
  static applyThemeVariables(theme) {
    const variables = theme === this.THEMES.DARK ? 
      themeVariables.dark : themeVariables.light;
    
    // CSS 변수를 루트 요소에 적용
    const style = document.documentElement.style;
    
    // 모든 변수 적용
    Object.entries(variables).forEach(([key, value]) => {
      style.setProperty(`--xcom-${key}`, value);
    });
    
    // 테마 클래스 적용 (다른 스타일링 방식에 유용)
    document.documentElement.setAttribute("data-theme", theme);
  }
  
  /**
   * 다음 테마로 전환 (순환)
   * @returns {string} 새로 적용된 테마
   */
  static cycleTheme() {
    const themes = Object.values(this.THEMES);
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    
    return this.setTheme(themes[nextIndex]);
  }
  
  /**
   * 테마 변경 리스너 등록
   * @param {Function} listener - 테마 변경 시 호출될 콜백 함수
   */
  static addThemeChangeListener(listener) {
    if (typeof listener === "function" && 
        !this.themeChangeListeners.includes(listener)) {
      this.themeChangeListeners.push(listener);
    }
  }
  
  /**
   * 테마 변경 리스너 제거
   * @param {Function} listener - 제거할 리스너
   */
  static removeThemeChangeListener(listener) {
    const index = this.themeChangeListeners.indexOf(listener);
    if (index !== -1) {
      this.themeChangeListeners.splice(index, 1);
    }
  }
  
  /**
   * 테마 변경 리스너에 알림
   */
  static notifyThemeChangeListeners() {
    const theme = this.getEffectiveTheme();
    this.themeChangeListeners.forEach(listener => {
      try {
        listener(theme);
      } catch (e) {
        console.error("테마 변경 리스너 오류:", e);
      }
    });
  }
  
  /**
   * 테마 전환 버튼 생성
   * @returns {HTMLElement} 테마 전환 버튼
   */
  static createThemeToggle() {
    const { bgColor, textColor } = Utils.getUserUIColor();
    
    const button = document.createElement("button");
    button.className = "theme-toggle-button icon-button";
    button.setAttribute("aria-label", "테마 전환");
    button.title = "테마 전환 (라이트/다크)";
    
    // 현재 테마에 맞는 아이콘 설정
    this.updateThemeToggleIcon(button);
    
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.cycleTheme();
      this.updateThemeToggleIcon(button);
    });
    
    // 테마 변경 시 아이콘 업데이트
    this.addThemeChangeListener(() => {
      this.updateThemeToggleIcon(button);
    });
    
    return button;
  }
  
  /**
   * 테마 토글 버튼 아이콘 업데이트
   * @param {HTMLElement} button - 테마 토글 버튼
   */
  static updateThemeToggleIcon(button) {
    const theme = this.getEffectiveTheme();
    
    button.innerHTML = theme === this.THEMES.DARK
      ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
  }
}

// == theme/LayoutManager.js ==

/**
 * 레이아웃 관리 클래스
 * 반응형 레이아웃과 UI 배치를 관리합니다.
 */
class LayoutManager {
  static LOCAL_STORAGE_KEY = "xcom-gallery-layout";
  
  // 레이아웃 모드
  static LAYOUT_MODES = {
    COMPACT: "compact",
    COMFORTABLE: "comfortable",
    CUSTOM: "custom"
  };
  
  // 현재 레이아웃 모드
  static currentMode = null;
  
  // 레이아웃 변경 리스너
  static layoutChangeListeners = [];
  
  // 화면 크기 분기점
  static BREAKPOINTS = {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE: 1440
  };
  
  /**
   * 레이아웃 관리자 초기화
   * @returns {string} 적용된 레이아웃 모드
   */
  static initialize() {
    // 저장된 레이아웃 설정 불러오기
    const savedMode = StorageUtils.getLocalStorageItem(
      this.LOCAL_STORAGE_KEY, 
      this.LAYOUT_MODES.COMFORTABLE
    );
    
    // 화면 크기 변경 감지 리스너 설정
    this.setupResizeListener();
    
    // 레이아웃 적용
    return this.setLayoutMode(savedMode, false);
  }
  
  /**
   * 화면 크기 변경 감지 리스너 설정
   */
  static setupResizeListener() {
    // 리사이즈 이벤트 디바운싱
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.applyResponsiveLayout();
        this.notifyLayoutChangeListeners();
      }, 200);
    });
  }
  
  /**
   * 현재 화면 크기에 기반한 반응형 레이아웃 적용
   */
  static applyResponsiveLayout() {
    const width = window.innerWidth;
    
    // 사용자 정의 레이아웃인 경우 변경하지 않음
    if (this.currentMode === this.LAYOUT_MODES.CUSTOM) {
      return;
    }
    
    // 화면 크기에 따른 레이아웃 조정
    if (width <= this.BREAKPOINTS.MOBILE) {
      document.documentElement.setAttribute('data-layout', 'mobile');
      // 모바일 뷰에서는 항상 컴팩트 모드 강제
      this.applyCompactLayout();
    } else if (width <= this.BREAKPOINTS.TABLET) {
      document.documentElement.setAttribute('data-layout', 'tablet');
      // 태블릿은 현재 선택된 모드 적용
      this.applyCurrentLayoutMode();
    } else {
      document.documentElement.setAttribute('data-layout', 'desktop');
      // 데스크톱은 현재 선택된 모드 적용
      this.applyCurrentLayoutMode();
    }
  }
  
  /**
   * 레이아웃 모드 설정
   * @param {string} mode - 레이아웃 모드 (compact, comfortable, custom)
   * @param {boolean} save - 설정 저장 여부
   * @returns {string} 적용된 모드
   */
  static setLayoutMode(mode, save = true) {
    // 유효한 모드인지 확인
    if (!Object.values(this.LAYOUT_MODES).includes(mode)) {
      mode = this.LAYOUT_MODES.COMFORTABLE;
    }
    
    this.currentMode = mode;
    
    // 모드 적용
    this.applyCurrentLayoutMode();
    
    // 레이아웃 설정 저장
    if (save) {
      StorageUtils.setLocalStorageItem(this.LOCAL_STORAGE_KEY, mode);
    }
    
    // 변경 알림
    this.notifyLayoutChangeListeners();
    
    return mode;
  }
  
  /**
   * 현재 레이아웃 모드 적용
   */
  static applyCurrentLayoutMode() {
    switch (this.currentMode) {
      case this.LAYOUT_MODES.COMPACT:
        this.applyCompactLayout();
        break;
      case this.LAYOUT_MODES.COMFORTABLE:
        this.applyComfortableLayout();
        break;
      case this.LAYOUT_MODES.CUSTOM:
        // 사용자 정의 레이아웃은 변경하지 않음
        break;
      default:
        this.applyComfortableLayout();
    }
  }
  
  /**
   * 컴팩트 레이아웃 적용
   * 작은 화면이나 제한된 공간에 최적화
   */
  static applyCompactLayout() {
    document.documentElement.setAttribute('data-density', 'compact');
    
    // 옵션바와 썸네일바에 컴팩트 스타일 적용
    const optionsBar = document.getElementById('optionsBar');
    if (optionsBar) {
      optionsBar.classList.add('compact');
      
      // 그룹 내 요소 간격 조정
      const sections = optionsBar.querySelectorAll('div');
      sections.forEach(section => {
        section.style.gap = 'var(--xcom-space-xs)';
      });
    }
    
    const thumbnailBar = document.getElementById('thumbnailBar');
    if (thumbnailBar) {
      thumbnailBar.classList.add('compact');
      thumbnailBar.style.height = '70px';
    }
    
    // 썸네일 크기 조정
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
      thumb.style.height = '50px';
    });
  }
  
  /**
   * 편안한 레이아웃 적용
   * 충분한 여백과 시각적 여유 제공
   */
  static applyComfortableLayout() {
    document.documentElement.setAttribute('data-density', 'comfortable');
    
    // 옵션바와 썸네일바에 편안한 스타일 적용
    const optionsBar = document.getElementById('optionsBar');
    if (optionsBar) {
      optionsBar.classList.remove('compact');
      
      // 그룹 내 요소 간격 조정
      const sections = optionsBar.querySelectorAll('div');
      sections.forEach(section => {
        section.style.gap = 'var(--xcom-space-sm)';
      });
    }
    
    const thumbnailBar = document.getElementById('thumbnailBar');
    if (thumbnailBar) {
      thumbnailBar.classList.remove('compact');
      thumbnailBar.style.height = '80px';
    }
    
    // 썸네일 크기 조정
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
      thumb.style.height = '60px';
    });
  }
  
  /**
   * 현재 레이아웃 모드 가져오기
   * @returns {string} 현재 레이아웃 모드
   */
  static getCurrentMode() {
    return this.currentMode || this.LAYOUT_MODES.COMFORTABLE;
  }
  
  /**
   * 레이아웃 변경 리스너 등록
   * @param {Function} listener - 레이아웃 변경 시 호출될 콜백 함수
   */
  static addLayoutChangeListener(listener) {
    if (typeof listener === "function" && 
        !this.layoutChangeListeners.includes(listener)) {
      this.layoutChangeListeners.push(listener);
    }
  }
  
  /**
   * 레이아웃 변경 리스너 제거
   * @param {Function} listener - 제거할 리스너
   */
  static removeLayoutChangeListener(listener) {
    const index = this.layoutChangeListeners.indexOf(listener);
    if (index !== -1) {
      this.layoutChangeListeners.splice(index, 1);
    }
  }
  
  /**
   * 레이아웃 변경 리스너에 알림
   */
  static notifyLayoutChangeListeners() {
    const mode = this.getCurrentMode();
    this.layoutChangeListeners.forEach(listener => {
      try {
        listener(mode);
      } catch (e) {
        console.error("레이아웃 변경 리스너 오류:", e);
      }
    });
  }
  
  /**
   * 레이아웃 모드 토글 버튼 생성
   * @returns {HTMLElement} 레이아웃 모드 토글 버튼
   */
  static createLayoutToggle() {
    const { bgColor, textColor } = Utils.getUserUIColor();
    
    const button = document.createElement("button");
    button.className = "layout-toggle-button icon-button";
    button.setAttribute("aria-label", "레이아웃 모드 전환");
    button.title = "레이아웃 모드 전환 (컴팩트/편안함)";
    
    // 현재 모드에 맞는 아이콘 설정
    this.updateLayoutToggleIcon(button);
    
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 모드 토글
      const newMode = this.currentMode === this.LAYOUT_MODES.COMPACT
        ? this.LAYOUT_MODES.COMFORTABLE
        : this.LAYOUT_MODES.COMPACT;
      
      this.setLayoutMode(newMode);
      this.updateLayoutToggleIcon(button);
    });
    
    // 레이아웃 변경 시 아이콘 업데이트
    this.addLayoutChangeListener(() => {
      this.updateLayoutToggleIcon(button);
    });
    
    return button;
  }
  
  /**
   * 레이아웃 토글 버튼 아이콘 업데이트
   * @param {HTMLElement} button - 레이아웃 토글 버튼
   */
  static updateLayoutToggleIcon(button) {
    const mode = this.getCurrentMode();
    
    button.innerHTML = mode === this.LAYOUT_MODES.COMPACT
      ? '<i class="fa-solid fa-expand" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-compress" aria-hidden="true"></i>';
  }
}

// == main.js ==

(function() {
    'use strict';
    
    function init() {
        debugLog('초기화 시작');
        
        // 스타일시트 생성
        Utils.createStyleSheet(STYLE_ID, CSS);
        
        // 테마 관리자 초기화
        ThemeManager.initialize();
        
        // 레이아웃 관리자 초기화
        LayoutManager.initialize();
        
        // URL 초기 정리 및 변경 감지 설정
        URLManager.cleanPhotoPath();
        URLManager.setupURLChangeDetection();
        
        // 이벤트 리스너 설정
        EventListeners.setupImageClickHandler();
        EventListeners.setupTouchAndMouseHandlers();
        EventListeners.setupEventPreventionReinforcement();
        
        // 전역 UI 초기화 - 언어 선택기 추가
        EventListeners.setupGlobalUI();
        
        console.log("X.com Enhanced Image Gallery 로드 완료");
    }
    
    // 애플리케이션 초기화
    init();
})();

