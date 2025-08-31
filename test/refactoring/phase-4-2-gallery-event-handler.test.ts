/**
 * Phase 4.2: GalleryEventHandler 분리 테스트
 *
 * 목표: GalleryApp의 이벤트 처리 로직을 독립적인 GalleryEventHandler로 분리
 *
 * TDD 사이클:
 * 1. RED: 실패하는 테스트 작성
 * 2. GREEN: 최소 구현으로 테스트 통과
 * 3. REFACTOR: 리팩토링 및 개선
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mocks
const mockEventManager = {
  getInstance: vi.fn(() => ({
    initializeGallery: vi.fn(),
    cleanupGallery: vi.fn(),
  })),
};

const mockToastController = {
  show: vi.fn(),
};

const mockVideoControl = {
  restoreBackgroundVideos: vi.fn(),
};

const mockGalleryState = {
  value: {
    isOpen: false,
    mediaItems: [],
    currentIndex: 0,
  },
};

const mockGalleryActions = {
  openGallery: vi.fn(),
  closeGallery: vi.fn(),
};

// Mock implementations
vi.mock('@shared/services/EventManager', () => ({
  EventManager: mockEventManager,
}));

vi.mock('@features/gallery/state/gallerySignals', () => ({
  galleryState: mockGalleryState,
  openGallery: mockGalleryActions.openGallery,
  closeGallery: mockGalleryActions.closeGallery,
}));

describe('Phase 4.2: GalleryEventHandler 분리', () => {
  let GalleryEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 상태 설정
    mockGalleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('RED Phase: GalleryEventHandler 클래스 존재성', () => {
    it('should import GalleryEventHandler class', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;
        expect(GalleryEventHandler).toBeDefined();
      } catch {
        expect.fail('GalleryEventHandler 클래스가 존재하지 않습니다');
      }
    });
  });

  describe('GREEN Phase: 기본 구조', () => {
    it('should create GalleryEventHandler instance', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
          eventManager: mockEventManager.getInstance(),
          mediaService: {
            extractFromClickedElement: vi.fn(),
          },
        });

        expect(handler).toBeInstanceOf(GalleryEventHandler);
      } catch {
        expect.fail('GalleryEventHandler 인스턴스 생성 실패');
      }
    });

    it('should have required dependencies in constructor', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        expect(() => {
          new GalleryEventHandler({
            toastController: mockToastController,
            videoControl: mockVideoControl,
            galleryState: mockGalleryState,
          });
        }).not.toThrow();
      } catch {
        expect.fail('GalleryEventHandler 의존성 주입 실패');
      }
    });
  });

  describe('GREEN Phase: 이벤트 핸들러 설정', () => {
    it('should have setupEventHandlers method', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
        });

        expect(typeof handler.setupEventHandlers).toBe('function');
      } catch {
        expect.fail('setupEventHandlers 메서드가 존재하지 않습니다');
      }
    });

    it('should setup event handlers with gallery actions', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const mockGalleryActions = {
          openGallery: vi.fn(),
          closeGallery: vi.fn(),
        };

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
          eventManager: mockEventManager.getInstance(),
          mediaService: {
            extractFromClickedElement: vi.fn(),
          },
        });

        await handler.setupEventHandlers(mockGalleryActions);

        expect(mockEventManager.getInstance().initializeGallery).toHaveBeenCalled();
      } catch {
        expect.fail('이벤트 핸들러 설정 실패');
      }
    });
  });

  describe('GREEN Phase: 미디어 클릭 핸들링', () => {
    it('should handle media click events', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const mockMediaService = {
          extractFromClickedElement: vi.fn().mockResolvedValue({
            success: true,
            mediaItems: [{ id: 'test-1', filename: 'test.jpg' }],
            clickedIndex: 0,
            errors: [],
          }),
        };

        const mockGalleryActions = {
          openGallery: vi.fn(),
          closeGallery: vi.fn(),
        };

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
        });

        const mediaClickHandler = handler.createMediaClickHandler(
          mockMediaService,
          mockGalleryActions
        );

        expect(typeof mediaClickHandler).toBe('function');

        // 미디어 클릭 이벤트 시뮬레이션
        const mockMediaInfo = { id: 'test', filename: 'test.jpg' };
        const mockElement = {};
        const mockEvent = {};

        await mediaClickHandler(mockMediaInfo, mockElement, mockEvent);

        expect(mockMediaService.extractFromClickedElement).toHaveBeenCalledWith(mockElement);
        expect(mockGalleryActions.openGallery).toHaveBeenCalledWith(
          [{ id: 'test-1', filename: 'test.jpg' }],
          0
        );
      } catch {
        expect.fail('미디어 클릭 핸들러 생성/실행 실패');
      }
    });

    it('should handle media extraction failure', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const mockMediaService = {
          extractFromClickedElement: vi.fn().mockResolvedValue({
            success: false,
            mediaItems: [],
            clickedIndex: 0,
            errors: ['No media found'],
          }),
        };

        const mockGalleryActions = {
          openGallery: vi.fn(),
          closeGallery: vi.fn(),
        };

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
        });

        const mediaClickHandler = handler.createMediaClickHandler(
          mockMediaService,
          mockGalleryActions
        );

        const mockMediaInfo = { id: 'test', filename: 'test.jpg' };
        const mockElement = {};
        const mockEvent = {};

        await mediaClickHandler(mockMediaInfo, mockElement, mockEvent);

        expect(mockGalleryActions.openGallery).not.toHaveBeenCalled();
        expect(mockToastController.show).toHaveBeenCalledWith({
          title: '미디어 로드 실패',
          message: '이미지나 비디오를 찾을 수 없습니다.',
          type: 'error',
        });
      } catch {
        expect.fail('미디어 추출 실패 핸들링 실패');
      }
    });

    it('should handle media extraction error', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const mockError = new Error('Network error');
        const mockMediaService = {
          extractFromClickedElement: vi.fn().mockRejectedValue(mockError),
        };

        const mockGalleryActions = {
          openGallery: vi.fn(),
          closeGallery: vi.fn(),
        };

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
        });

        const mediaClickHandler = handler.createMediaClickHandler(
          mockMediaService,
          mockGalleryActions
        );

        const mockMediaInfo = { id: 'test', filename: 'test.jpg' };
        const mockElement = {};
        const mockEvent = {};

        await mediaClickHandler(mockMediaInfo, mockElement, mockEvent);

        expect(mockToastController.show).toHaveBeenCalledWith({
          title: '오류 발생',
          message: '미디어 추출 중 오류가 발생했습니다: Network error',
          type: 'error',
        });
      } catch {
        expect.fail('미디어 추출 에러 핸들링 실패');
      }
    });
  });

  describe('GREEN Phase: 갤러리 닫기 핸들링', () => {
    it('should handle gallery close events', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const mockGalleryActions = {
          openGallery: vi.fn(),
          closeGallery: vi.fn(),
        };

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
        });

        const galleryCloseHandler = handler.createGalleryCloseHandler(mockGalleryActions);

        expect(typeof galleryCloseHandler).toBe('function');

        galleryCloseHandler();

        expect(mockGalleryActions.closeGallery).toHaveBeenCalled();
        expect(mockVideoControl.restoreBackgroundVideos).toHaveBeenCalled();
      } catch {
        expect.fail('갤러리 닫기 핸들러 생성/실행 실패');
      }
    });
  });

  describe('GREEN Phase: 키보드 이벤트 핸들링', () => {
    it('should handle keyboard events', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const mockGalleryActions = {
          openGallery: vi.fn(),
          closeGallery: vi.fn(),
        };

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
        });

        const keyboardHandler = handler.createKeyboardHandler(mockGalleryActions);

        expect(typeof keyboardHandler).toBe('function');

        // Escape 키 이벤트 시뮬레이션 (갤러리가 열린 상태)
        mockGalleryState.value.isOpen = true;
        const escapeEvent = { key: 'Escape' };

        keyboardHandler(escapeEvent);

        expect(mockGalleryActions.closeGallery).toHaveBeenCalled();
      } catch {
        expect.fail('키보드 이벤트 핸들러 생성/실행 실패');
      }
    });

    it('should not close gallery on Escape when gallery is closed', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const mockGalleryActions = {
          openGallery: vi.fn(),
          closeGallery: vi.fn(),
        };

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
        });

        const keyboardHandler = handler.createKeyboardHandler(mockGalleryActions);

        // Escape 키 이벤트 시뮬레이션 (갤러리가 닫힌 상태)
        mockGalleryState.value.isOpen = false;
        const escapeEvent = { key: 'Escape' };

        keyboardHandler(escapeEvent);

        expect(mockGalleryActions.closeGallery).not.toHaveBeenCalled();
      } catch {
        expect.fail('키보드 이벤트 핸들러 (갤러리 닫힌 상태) 실행 실패');
      }
    });
  });

  describe('GREEN Phase: 정리 기능', () => {
    it('should have cleanup method', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
          eventManager: mockEventManager.getInstance(),
        });

        expect(typeof handler.cleanup).toBe('function');

        await handler.cleanup();

        expect(mockEventManager.getInstance().cleanupGallery).toHaveBeenCalled();
      } catch {
        expect.fail('cleanup 메서드 실행 실패');
      }
    });
  });

  describe('GREEN Phase: 타입 안전성', () => {
    it('should have proper TypeScript types', async () => {
      try {
        const module = await import('@features/gallery/GalleryEventHandler');
        GalleryEventHandler = module.GalleryEventHandler;

        // 타입 체크: constructor 매개변수
        const handler = new GalleryEventHandler({
          toastController: mockToastController,
          videoControl: mockVideoControl,
          galleryState: mockGalleryState,
        });

        // 타입 체크: 메서드 존재성
        expect(typeof handler.setupEventHandlers).toBe('function');
        expect(typeof handler.createMediaClickHandler).toBe('function');
        expect(typeof handler.createGalleryCloseHandler).toBe('function');
        expect(typeof handler.createKeyboardHandler).toBe('function');
        expect(typeof handler.cleanup).toBe('function');
      } catch {
        expect.fail('TypeScript 타입 검증 실패');
      }
    });
  });
});
