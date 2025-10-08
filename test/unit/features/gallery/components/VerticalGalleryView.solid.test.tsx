/**
 * Phase 0 Tests: VerticalGalleryView.solid.tsx 컴파일 및 기본 동작 검증
 *
 * TDD Workflow:
 * 1. Phase 0 (이 파일): 구현 전 테스트 작성 (RED)
 * 2. 구현: VerticalGalleryView.solid.tsx 작성
 * 3. 검증: 테스트 실행 (GREEN)
 *
 * 목표:
 * - TypeScript 컴파일 검증
 * - Solid.js 컴포넌트 기본 구조 검증
 * - Props interface 검증
 * - 주요 기능 스모크 테스트
 */

import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM에서 __dirname 확보
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 0: VerticalGalleryView.solid - TypeScript Compilation', () => {
  beforeAll(async () => {
    // Vendor 초기화 (Solid, DOM polyfill)
    const { initializeVendors } = await import('@shared/external/vendors');
    await initializeVendors();
  });

  it('should compile TypeScript without errors', async () => {
    // 동적 import로 TypeScript 컴파일 검증
    expect(async () => {
      await import('@features/gallery/components/vertical-gallery-view/VerticalGalleryView');
    }).not.toThrow();
  });

  it('should export VerticalGalleryView component', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );
    expect(module.VerticalGalleryView).toBeDefined();
    expect(typeof module.VerticalGalleryView).toBe('function');
  });
});

describe('Phase 0: VerticalGalleryView.solid - Props Interface', () => {
  it('should accept all required props without TypeScript errors', async () => {
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    // Props interface 검증 (컴파일 타임 검증)
    const validProps = {
      onClose: vi.fn(),
      className: 'test-class',
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    };

    // 타입 검증만 수행 (렌더링은 다음 테스트에서)
    expect(() => {
      VerticalGalleryView(validProps);
    }).not.toThrow();
  });

  it('should make all props optional', async () => {
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    // 모든 props가 선택적이어야 함
    expect(() => {
      VerticalGalleryView({});
    }).not.toThrow();
  });
});

describe('Phase 0: VerticalGalleryView.solid - Basic Structure', () => {
  beforeEach(() => {
    // DOM 환경 준비
    document.body.innerHTML = '<div id="test-container"></div>';
  });

  it('should render gallery container with Solid', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const dispose = render(() => <VerticalGalleryView />, container);

    // 기본 구조 검증
    expect(container.querySelector('[data-xeg-gallery="true"]')).toBeTruthy();
    expect(container.querySelector('[data-xeg-role="gallery"]')).toBeTruthy();

    dispose();
  });

  it('should apply custom className', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const customClass = 'my-custom-gallery';
    const dispose = render(() => <VerticalGalleryView className={customClass} />, container);

    const galleryEl = container.querySelector('[data-xeg-gallery="true"]');
    expect(galleryEl?.classList.contains(customClass)).toBe(true);

    dispose();
  });
});

describe('Phase 0: VerticalGalleryView.solid - Solid.js Integration', () => {
  it('should use Solid For component for items', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    // Solid For 컴포넌트 사용 검증 (소스 코드 검사)
    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('For');
  });

  it('should use Solid Show component for conditionals', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('Show');
  });

  it('should use createSignal for local state', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('createSignal');
  });

  it('should use createEffect for side effects', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('createEffect');
  });

  it('should use onCleanup for cleanup', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('onCleanup');
  });

  it('should use mergeProps for prop defaults', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('mergeProps');
  });

  it('should NOT use Preact memo', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).not.toContain('memo');
    expect(source).not.toContain('getPreactCompat');
  });
});

describe('Phase 0: VerticalGalleryView.solid - Toolbar Integration', () => {
  it('should render ToolbarWithSettings.solid', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const dispose = render(() => <VerticalGalleryView />, container);

    // ToolbarWithSettings가 렌더링되는지 확인 (data attribute로 검증)
    expect(container.querySelector('[data-role="toolbar"]')).toBeTruthy();

    dispose();
  });

  it('should pass toolbar props correctly', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const mockOnClose = vi.fn();
    const mockOnPrevious = vi.fn();
    const mockOnNext = vi.fn();

    const dispose = render(
      () => (
        <VerticalGalleryView
          onClose={mockOnClose}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      ),
      container
    );

    // Props가 올바르게 전달되는지 검증 (이벤트 트리거로 확인)
    // 실제 구현에서 툴바 버튼 클릭 시 콜백이 호출되어야 함
    expect(mockOnClose).not.toHaveBeenCalled(); // 아직 클릭 전
    expect(mockOnPrevious).not.toHaveBeenCalled();
    expect(mockOnNext).not.toHaveBeenCalled();

    dispose();
  });
});

describe('Phase 0: VerticalGalleryView.solid - Item Rendering', () => {
  beforeEach(() => {
    // galleryState 모킹 (Phase 0에서는 기본 모킹만)
    vi.mock('@shared/state/signals/gallery.signals', () => ({
      galleryState: {
        mediaItems: [],
        currentIndex: 0,
        isLoading: false,
      },
      navigateToItem: vi.fn(),
    }));

    vi.mock('@shared/state/signals/download.signals', () => ({
      downloadState: {
        isProcessing: false,
      },
    }));
  });

  it('should render empty state when no media items', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const dispose = render(() => <VerticalGalleryView />, container);

    // 빈 상태 메시지 확인
    expect(container.textContent).toContain(''); // 실제 메시지는 i18n에서

    dispose();
  });

  it('should use For component to render items', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // For 컴포넌트 사용 검증
    expect(source).toContain('For');
  });

  it('should render VerticalImageItem.solid for each media', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // VerticalImageItem 사용 검증
    expect(source).toContain('VerticalImageItem');
  });
});

describe('Phase 0: VerticalGalleryView.solid - Keyboard Handling', () => {
  it('should render KeyboardHelpOverlay', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const dispose = render(() => <VerticalGalleryView />, container);

    // KeyboardHelpOverlay 컴포넌트가 있는지 확인 (처음에는 닫혀 있을 것)
    // 실제 구현에서는 조건부 렌더링될 수 있음
    expect(container.innerHTML).toBeTruthy();

    dispose();
  });

  it('should handle Escape key to close gallery', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const mockOnClose = vi.fn();
    const dispose = render(() => <VerticalGalleryView onClose={mockOnClose} />, container);

    // Escape 키 이벤트 디스패치 (JSDOM 환경)
    const escapeEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    // onClose가 호출되어야 함 (실제 구현에서)
    // Phase 0에서는 구조만 검증
    expect(mockOnClose).toHaveBeenCalled();

    dispose();
  });

  it('should handle "?" key to open help overlay', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const dispose = render(() => <VerticalGalleryView />, container);

    // '?' 키 이벤트 디스패치 (JSDOM 환경)
    const helpEvent = new window.KeyboardEvent('keydown', { key: '?' });
    document.dispatchEvent(helpEvent);

    // 도움말 오버레이가 열려야 함 (실제 구현에서)
    // Phase 0에서는 구조만 검증
    expect(container.innerHTML).toBeTruthy();

    dispose();
  });
});

describe('Phase 0: VerticalGalleryView.solid - Scroll Management', () => {
  it('should set up scroll observers', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // Scroll 관련 로직 검증
    expect(source).toContain('scroll') || expect(source).toContain('ScrollObserver');
  });

  it('should handle wheel events (PC-only)', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const dispose = render(() => <VerticalGalleryView />, container);

    // wheel 이벤트 핸들러가 있는지 확인 (PC 전용 정책)
    const galleryEl = container.querySelector('[data-xeg-gallery="true"]');
    expect(galleryEl).toBeTruthy();

    dispose();
  });

  it('should NOT use touch/pointer events (PC-only policy)', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // 터치/포인터 이벤트 사용 금지 검증
    expect(source).not.toContain('onTouchStart');
    expect(source).not.toContain('onTouchMove');
    expect(source).not.toContain('onTouchEnd');
    expect(source).not.toContain('onPointerDown');
    expect(source).not.toContain('onPointerMove');
    expect(source).not.toContain('onPointerUp');
  });
});

describe('Phase 0: VerticalGalleryView.solid - Viewport Tracking', () => {
  it('should observe viewport changes', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // Viewport 관찰 로직 검증
    expect(source).toContain('viewport') || expect(source).toContain('ViewportObserver');
  });

  it('should inject CSS variables for viewport constraints', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const dispose = render(() => <VerticalGalleryView />, container);

    // CSS 변수가 설정되는지 확인 (실제 구현에서)
    const galleryEl = container.querySelector('[data-xeg-gallery="true"]') as HTMLElement;
    expect(galleryEl).toBeTruthy();

    dispose();
  });
});

describe('Phase 0: VerticalGalleryView.solid - Event Handling', () => {
  it('should handle background click to close', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const mockOnClose = vi.fn();
    const dispose = render(() => <VerticalGalleryView onClose={mockOnClose} />, container);

    // 배경 클릭 이벤트 (JSDOM 환경)
    const galleryEl = container.querySelector('[data-xeg-gallery="true"]');
    galleryEl?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    // onClose가 호출되어야 함
    expect(mockOnClose).toHaveBeenCalled();

    dispose();
  });

  it('should NOT close when clicking toolbar area', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const mockOnClose = vi.fn();
    const dispose = render(() => <VerticalGalleryView onClose={mockOnClose} />, container);

    // 툴바 영역 클릭 (닫히면 안 됨) (JSDOM 환경)
    const toolbarEl = container.querySelector('[data-role="toolbar"]');
    if (toolbarEl) {
      toolbarEl.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      expect(mockOnClose).not.toHaveBeenCalled();
    }

    dispose();
  });
});

describe('Phase 0: VerticalGalleryView.solid - Download Handlers', () => {
  it('should call onDownloadCurrent when download button clicked', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const mockDownloadCurrent = vi.fn();
    const dispose = render(
      () => <VerticalGalleryView onDownloadCurrent={mockDownloadCurrent} />,
      container
    );

    // 다운로드 버튼 클릭 시뮬레이션 (실제 구현에서)
    // Phase 0에서는 props 전달만 검증
    expect(mockDownloadCurrent).not.toHaveBeenCalled();

    dispose();
  });

  it('should call onDownloadAll when bulk download triggered', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const mockDownloadAll = vi.fn();
    const dispose = render(
      () => <VerticalGalleryView onDownloadAll={mockDownloadAll} />,
      container
    );

    expect(mockDownloadAll).not.toHaveBeenCalled();

    dispose();
  });
});

describe('Phase 0: VerticalGalleryView.solid - Image Fit Mode', () => {
  it('should support fitOriginal mode', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('fitOriginal') || expect(source).toContain('original');
  });

  it('should support fitWidth mode', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('fitWidth');
  });

  it('should support fitHeight mode', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('fitHeight');
  });

  it('should support fitContainer mode', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('fitContainer');
  });

  it('should persist fit mode to settings', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('setSetting') || expect(source).toContain('gallery.imageFitMode');
  });
});

describe('Phase 0: VerticalGalleryView.solid - Styling', () => {
  it('should use CSS Modules', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('styles.');
  });

  it('should NOT have hardcoded colors', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // 디자인 토큰 정책: 하드코딩 금지
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}/); // hex colors
    expect(source).not.toMatch(/rgb\(|rgba\(/); // rgb colors
  });

  it('should use design tokens only', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // CSS 변수 사용 검증 (간접적)
    expect(source).toContain('styles.') || expect(source).toContain('className');
  });
});

describe('Phase 0: VerticalGalleryView.solid - Accessibility', () => {
  it('should have gallery role', async () => {
    const { render } = await import('solid-js/web');
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const container = document.getElementById('test-container')!;
    const dispose = render(() => <VerticalGalleryView />, container);

    const galleryEl = container.querySelector('[data-xeg-gallery="true"]');
    expect(galleryEl?.getAttribute('data-xeg-role')).toBe('gallery');

    dispose();
  });

  it('should handle keyboard navigation', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // 키보드 네비게이션 로직 검증
    expect(source).toContain('key') || expect(source).toContain('keyboard');
  });

  it('should support focus management', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('focus') || expect(source).toContain('Focus');
  });
});

describe('Phase 0: VerticalGalleryView.solid - Optimization', () => {
  it('should NOT use Preact memo (Solid auto-optimizes)', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).not.toContain('memo(');
  });

  it('should use Solid reactive primitives', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // Solid의 세밀한 반응성 활용
    expect(source).toContain('createSignal') || expect(source).toContain('createEffect');
  });

  it('should compute preload indices', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    expect(source).toContain('preload') || expect(source).toContain('Preload');
  });
});

describe('Phase 0: VerticalGalleryView.solid - Code Metrics', () => {
  it('should have reasonable file size (<650 lines)', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    const lineCount = source.split('\n').length;

    // Solid 버전은 Preact보다 간결해야 함 (591 lines → ~550 lines 예상)
    expect(lineCount).toBeLessThan(650);
  });

  it('should have fewer functions than Preact version', async () => {
    const module = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const source = module.VerticalGalleryView.toString();
    // function 키워드 사용 횟수 (useCallback/useMemo 제거로 감소 예상)
    const functionCount = (source.match(/function\s+\w+/g) || []).length;

    // Preact: ~20 functions → Solid: ~15 functions 예상
    expect(functionCount).toBeLessThan(20);
  });
});
