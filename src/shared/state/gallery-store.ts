import { createGlobalSignal } from './createGlobalSignal';

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

const initialState: GalleryState = {
  items: [],
  currentIndex: 0,
  loading: false,
  ui: { toolbarVisible: false, settingsOpen: false },
};

const signal = createGlobalSignal<GalleryState>(initialState);

export const galleryState = {
  get value(): GalleryState {
    return signal.value;
  },
  set value(v: GalleryState) {
    signal.value = v;
  },
  subscribe(listener: (v: GalleryState) => void): () => void {
    return signal.subscribe(listener);
  },
  update(updater: (previous: GalleryState) => GalleryState): void {
    signal.update(updater);
  },
  accessor: signal.accessor,
  peek(): GalleryState {
    return signal.peek();
  },
};

export const galleryActions = {
  setItems(items: readonly GalleryItem[]): void {
    galleryState.value = { ...galleryState.value, items: [...items] };
  },
  setCurrentIndex(index: number): void {
    galleryState.value = { ...galleryState.value, currentIndex: index };
  },
  setLoading(loading: boolean): void {
    galleryState.value = { ...galleryState.value, loading };
  },
  setToolbarVisible(visible: boolean): void {
    const current = galleryState.value;
    galleryState.value = {
      ...current,
      ui: { ...current.ui, toolbarVisible: visible },
    };
  },
  setSettingsOpen(open: boolean): void {
    const current = galleryState.value;
    galleryState.value = {
      ...current,
      ui: { ...current.ui, settingsOpen: open },
    };
  },
};
