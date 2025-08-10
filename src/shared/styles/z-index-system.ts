/**
 * Z-Index 통합 시스템
 * @description ZIndexManager를 사용한 중앙화된 Z-Index 관리
 */

import { ZIndexManager } from '@shared/utils/z-index-service';

// 전역 Z-Index 매니저 인스턴스
const zIndexManager = ZIndexManager.getInstance();

/**
 * Z-Index 값 반환 함수
 *
 * @param layer 계층 이름
 * @param offset 오프셋 (선택사항)
 * @returns Z-Index 값
 */
export function getZIndex(layer: 'gallery' | 'toolbar' | 'modal' | 'toast', offset = 0): number {
  return zIndexManager.getZIndex(layer, offset);
}

/**
 * CSS 변수 스타일 생성
 *
 * @returns CSS 변수가 포함된 스타일 문자열
 */
export function generateZIndexCSS(): string {
  return `
:root {
  ${zIndexManager.generateCSSVariables()}
}

/* 갤러리 컨테이너 */
#xeg-gallery-root {
  z-index: var(--xeg-z-gallery);
}

/* 툴바 */
.xeg-gallery-toolbar,
[data-xeg-role='toolbar'] {
  z-index: var(--xeg-z-toolbar);
}

/* 모달 */
.xeg-modal,
[data-xeg-role='modal'] {
  z-index: var(--xeg-z-modal);
}

/* 토스트 */
.xeg-toast-container,
[data-xeg-role='toast'] {
  z-index: var(--xeg-z-toast);
}
`;
}

/**
 * 동적 스타일 주입
 * 앱 초기화 시 Z-Index CSS를 동적으로 주입합니다.
 */
export function injectZIndexStyles(): void {
  // 🔧 FIX: 테스트 환경에서 DOM API 접근 안전성 보장
  if (typeof document === 'undefined') {
    return;
  }

  const existingStyle = document.getElementById('xeg-zindex-styles');
  if (existingStyle) {
    // 일부 테스트/모킹 환경에서는 Element.remove가 없을 수 있음
    try {
      type Removable = Element & { remove?: () => void };
      const el = existingStyle as Removable;
      if (typeof el.remove === 'function') {
        el.remove();
      } else {
        existingStyle.parentNode?.removeChild(existingStyle);
      }
    } catch {
      existingStyle.parentNode?.removeChild(existingStyle);
    }
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'xeg-zindex-styles';

  // 일부 테스트/모킹 환경에서 tagName이 누락될 수 있으므로 안전하게 설정
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyStyle = styleElement as any;
    if (typeof anyStyle.tagName === 'undefined') {
      anyStyle.tagName = 'STYLE';
    }
  } catch {
    // ignore: 실제 DOM에서는 읽기 전용일 수 있음
  }

  try {
    styleElement.textContent = generateZIndexCSS();
    document.head?.appendChild(styleElement);
  } catch (error) {
    // 테스트 환경에서 DOM 접근 실패 시 조용히 무시
    console.warn('Z-Index 스타일 주입 실패 (테스트 환경):', error);
  }
}

/**
 * Z-Index 매니저 인스턴스 반환
 * 디버깅이나 고급 사용을 위해
 */
export function getZIndexManager(): ZIndexManager {
  return zIndexManager;
}
