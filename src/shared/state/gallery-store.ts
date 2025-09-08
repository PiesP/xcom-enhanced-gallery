/**
 * @fileoverview 중앙집중식 갤러리 상태 관리
 * @description signals 기반 갤러리 상태 스토어 및 액션
 */

import { signal } from '@preact/signals';

// ===== 타입 정의 =====

export interface MediaItem {
  readonly id: string;
  readonly url: string;
  readonly type: 'image' | 'video';
  readonly metadata?: Readonly<{
    width?: number;
    height?: number;
    size?: number;
    alt?: string;
  }>;
}

export interface UIState {
  readonly toolbarVisible: boolean;
  readonly settingsOpen: boolean;
  readonly fullscreenMode?: boolean;
  readonly currentView?: 'grid' | 'single' | 'vertical';
}

export interface GalleryState {
  readonly items: readonly MediaItem[];
  readonly currentIndex: number;
  readonly loading: boolean;
  readonly ui: UIState;
  readonly error?: string;
}

// ===== 초기 상태 =====

const initialState: GalleryState = {
  items: [],
  currentIndex: 0,
  loading: false,
  ui: {
    toolbarVisible: false,
    settingsOpen: false,
    fullscreenMode: false,
    currentView: 'vertical',
  },
};

// ===== 상태 Signal =====

export const galleryState = signal<GalleryState>(initialState);

// ===== 액션 함수들 =====

export const galleryActions = {
  /**
   * 미디어 아이템 목록 설정
   */
  setItems: (items: readonly MediaItem[]) => {
    galleryState.value = {
      ...galleryState.value,
      items,
      currentIndex:
        items.length > 0 ? Math.min(galleryState.value.currentIndex, items.length - 1) : 0,
    };
  },

  /**
   * 현재 인덱스 설정
   */
  setCurrentIndex: (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, galleryState.value.items.length - 1));
    galleryState.value = {
      ...galleryState.value,
      currentIndex: safeIndex,
    };
  },

  /**
   * 다음 아이템으로 이동
   */
  nextItem: () => {
    const currentIndex = galleryState.value.currentIndex;
    const maxIndex = galleryState.value.items.length - 1;
    if (currentIndex < maxIndex) {
      galleryActions.setCurrentIndex(currentIndex + 1);
    }
  },

  /**
   * 이전 아이템으로 이동
   */
  previousItem: () => {
    const currentIndex = galleryState.value.currentIndex;
    if (currentIndex > 0) {
      galleryActions.setCurrentIndex(currentIndex - 1);
    }
  },

  /**
   * 로딩 상태 설정
   */
  setLoading: (loading: boolean) => {
    galleryState.value = {
      ...galleryState.value,
      loading,
    };
  },

  /**
   * 툴바 표시 상태 설정
   */
  setToolbarVisible: (visible: boolean) => {
    galleryState.value = {
      ...galleryState.value,
      ui: {
        ...galleryState.value.ui,
        toolbarVisible: visible,
      },
    };
  },

  /**
   * 설정 모달 열림 상태 설정
   */
  setSettingsOpen: (open: boolean) => {
    galleryState.value = {
      ...galleryState.value,
      ui: {
        ...galleryState.value.ui,
        settingsOpen: open,
      },
    };
  },

  /**
   * 전체화면 모드 설정
   */
  setFullscreenMode: (fullscreen: boolean) => {
    galleryState.value = {
      ...galleryState.value,
      ui: {
        ...galleryState.value.ui,
        fullscreenMode: fullscreen,
      },
    };
  },

  /**
   * 현재 뷰 모드 설정
   */
  setCurrentView: (view: 'grid' | 'single' | 'vertical') => {
    galleryState.value = {
      ...galleryState.value,
      ui: {
        ...galleryState.value.ui,
        currentView: view,
      },
    };
  },

  /**
   * 에러 상태 설정
   */
  setError: (error?: string) => {
    if (error === undefined) {
      const { error: _, ...stateWithoutError } = galleryState.value;
      galleryState.value = stateWithoutError as GalleryState;
    } else {
      galleryState.value = {
        ...galleryState.value,
        error,
      };
    }
  },

  /**
   * 상태 초기화
   */
  reset: () => {
    galleryState.value = initialState;
  },
};

// ===== 선택자 (Selectors) =====

export const gallerySelectors = {
  /**
   * 현재 선택된 미디어 아이템
   */
  getCurrentItem: (): MediaItem | undefined => {
    const state = galleryState.value;
    return state.items[state.currentIndex];
  },

  /**
   * 미디어 아이템 총 개수
   */
  getItemCount: (): number => {
    return galleryState.value.items.length;
  },

  /**
   * 현재 인덱스가 첫 번째인지 확인
   */
  isFirst: (): boolean => {
    return galleryState.value.currentIndex === 0;
  },

  /**
   * 현재 인덱스가 마지막인지 확인
   */
  isLast: (): boolean => {
    const state = galleryState.value;
    return state.currentIndex === state.items.length - 1;
  },

  /**
   * 갤러리가 비어있는지 확인
   */
  isEmpty: (): boolean => {
    return galleryState.value.items.length === 0;
  },

  /**
   * 현재 진행률 (0-1)
   */
  getProgress: (): number => {
    const state = galleryState.value;
    if (state.items.length <= 1) return 1;
    return (state.currentIndex + 1) / state.items.length;
  },
};

// ===== 훅 (Hooks) =====

export const useGalleryState = () => {
  return {
    state: galleryState,
    actions: galleryActions,
    selectors: gallerySelectors,
  };
};

// ===== 개발 도구 =====

if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서 state를 전역으로 노출
  (globalThis as Record<string, unknown>).galleryStore = {
    state: galleryState,
    actions: galleryActions,
    selectors: gallerySelectors,
  };
}
