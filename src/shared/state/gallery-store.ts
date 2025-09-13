import { getPreactSignals } from '../external/vendors';

export interface GalleryUIState {
  readonly toolbarVisible: boolean;
  readonly settingsOpen: boolean;
}

export interface GalleryItem {
  readonly id: string;
  readonly url: string;
  readonly type: 'image' | 'video' | (string & {});
}

export interface GalleryState {
  readonly items: readonly GalleryItem[];
  readonly currentIndex: number;
  readonly loading: boolean;
  readonly ui: GalleryUIState;
}

const { signal } = getPreactSignals();

const initialState: GalleryState = {
  items: [],
  currentIndex: 0,
  loading: false,
  ui: { toolbarVisible: false, settingsOpen: false },
};

const stateSignal = signal<GalleryState>(initialState);

export const galleryState = {
  get value(): GalleryState {
    return stateSignal.value;
  },
  set value(v: GalleryState) {
    stateSignal.value = v;
  },
  subscribe(listener: (v: GalleryState) => void): () => void {
    const { effect } = getPreactSignals();
    return effect(() => listener(stateSignal.value));
  },
};

export const galleryActions = {
  setItems(items: readonly GalleryItem[]): void {
    stateSignal.value = { ...stateSignal.value, items: [...items] };
  },
  setCurrentIndex(index: number): void {
    stateSignal.value = { ...stateSignal.value, currentIndex: index };
  },
  setLoading(loading: boolean): void {
    stateSignal.value = { ...stateSignal.value, loading };
  },
  setToolbarVisible(visible: boolean): void {
    stateSignal.value = {
      ...stateSignal.value,
      ui: { ...stateSignal.value.ui, toolbarVisible: visible },
    };
  },
  setSettingsOpen(open: boolean): void {
    stateSignal.value = {
      ...stateSignal.value,
      ui: { ...stateSignal.value.ui, settingsOpen: open },
    };
  },
};
