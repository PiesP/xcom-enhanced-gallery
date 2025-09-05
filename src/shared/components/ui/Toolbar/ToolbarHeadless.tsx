/**
 * @fileoverview Toolbar Headless Container (Phase P1)
 * @description 로직과 상태를 관리하는 headless 툴바 컨테이너
 */

import { getPreactHooks } from '@shared/external/vendors';
import type { ComponentChildren } from '@shared/external/vendors';
import {
  toolbarState,
  updateToolbarMode,
  setHighContrast,
} from '@shared/state/signals/toolbar.signals';
import { defaultToolbarConfig, type ToolbarConfig } from './toolbarConfig';

export interface ToolbarItem {
  id: string;
  type: string;
  icon: string;
  label: string;
  group: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  active?: boolean;
  loading?: boolean;
  onAction?: (event?: Event) => void | Promise<void>;
}

export interface ToolbarHeadlessState {
  items: ToolbarItem[];
  currentMode: 'gallery' | 'settings' | 'download';
  needsHighContrast: boolean;
  isDownloading: boolean;
  currentIndex: number;
  totalCount: number;
  currentFitMode: string;
}

export interface ToolbarHeadlessProps {
  config?: ToolbarConfig;
  currentIndex: number;
  totalCount: number;
  isDownloading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
  onOpenSettings?: (event?: Event) => void | Promise<void>;
  onFitOriginal?: (event?: Event) => void | Promise<void>;
  onFitWidth?: (event?: Event) => void | Promise<void>;
  onFitHeight?: (event?: Event) => void | Promise<void>;
  onFitContainer?: (event?: Event) => void | Promise<void>;
  children: (state: ToolbarHeadlessState, actions: ToolbarHeadlessActions) => ComponentChildren;
}

export interface ToolbarHeadlessActions {
  setMode: (mode: 'gallery' | 'settings' | 'download') => void;
  setHighContrast: (enabled: boolean) => void;
  setFitMode: (mode: string) => void;
  setDownloading: (loading: boolean) => void;
  updateItems: (items: ToolbarItem[]) => void;
}

/**
 * 설정을 정규화된 아이템 목록으로 변환
 */
function normalizeConfigToItems(
  config: ToolbarConfig,
  props: {
    currentIndex: number;
    totalCount: number;
    isDownloading?: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onDownloadCurrent: () => void;
    onDownloadAll: () => void;
    onClose: () => void;
    onOpenSettings?: ((event?: Event) => void | Promise<void>) | undefined;
    onFitOriginal?: ((event?: Event) => void | Promise<void>) | undefined;
    onFitWidth?: ((event?: Event) => void | Promise<void>) | undefined;
    onFitHeight?: ((event?: Event) => void | Promise<void>) | undefined;
    onFitContainer?: ((event?: Event) => void | Promise<void>) | undefined;
  }
): ToolbarItem[] {
  const items: ToolbarItem[] = [];

  config.actionGroups.forEach(group => {
    group.actions.forEach(action => {
      const item: ToolbarItem = {
        id: action.type,
        type: action.type,
        icon: action.icon,
        label: action.label,
        group: group.id,
        variant: action.variant || 'secondary',
        size: action.size || 'md',
        disabled: false,
        active: false,
        loading: false,
      };

      // 액션 핸들러 매핑
      switch (action.type) {
        case 'previous':
          item.onAction = props.onPrevious;
          item.disabled = props.currentIndex <= 0;
          break;
        case 'next':
          item.onAction = props.onNext;
          item.disabled = props.currentIndex >= props.totalCount - 1;
          break;
        case 'downloadCurrent':
          item.onAction = props.onDownloadCurrent;
          item.loading = props.isDownloading || false;
          item.variant = 'primary';
          break;
        case 'downloadAll':
          item.onAction = props.onDownloadAll;
          item.loading = props.isDownloading || false;
          break;
        case 'settings':
          if (props.onOpenSettings) {
            item.onAction = props.onOpenSettings;
          }
          item.disabled = !props.onOpenSettings;
          break;
        case 'close':
          item.onAction = props.onClose;
          break;
        case 'fitOriginal':
          if (props.onFitOriginal) {
            item.onAction = props.onFitOriginal;
          }
          item.disabled = !props.onFitOriginal;
          break;
        case 'fitWidth':
          if (props.onFitWidth) {
            item.onAction = props.onFitWidth;
          }
          item.disabled = !props.onFitWidth;
          break;
        case 'fitHeight':
          if (props.onFitHeight) {
            item.onAction = props.onFitHeight;
          }
          item.disabled = !props.onFitHeight;
          break;
        case 'fitContainer':
          if (props.onFitContainer) {
            item.onAction = props.onFitContainer;
          }
          item.disabled = !props.onFitContainer;
          break;
      }

      items.push(item);
    });
  });

  return items;
}

/**
 * Headless Toolbar Container
 */
export function ToolbarHeadless({
  config = defaultToolbarConfig,
  currentIndex,
  totalCount,
  isDownloading = false,
  onPrevious,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
  onClose,
  onOpenSettings,
  onFitOriginal,
  onFitWidth,
  onFitHeight,
  onFitContainer,
  children,
}: ToolbarHeadlessProps) {
  const { useState, useEffect, useMemo, useCallback } = getPreactHooks();

  // Local state
  const [currentFitMode, setCurrentFitMode] = useState('original');
  const [localDownloading, setLocalDownloading] = useState(isDownloading);

  // Subscribe to global toolbar state
  const [globalState, setGlobalState] = useState(toolbarState.value);

  useEffect(() => {
    const unsubscribe = toolbarState.subscribe(setGlobalState);
    return unsubscribe;
  }, []);

  // Sync external downloading state
  useEffect(() => {
    setLocalDownloading(isDownloading);
  }, [isDownloading]);

  // Generate normalized items
  const items = useMemo(() => {
    const baseItems = normalizeConfigToItems(config, {
      currentIndex,
      totalCount,
      isDownloading: localDownloading,
      onPrevious,
      onNext,
      onDownloadCurrent,
      onDownloadAll,
      onClose,
      onOpenSettings,
      onFitOriginal,
      onFitWidth,
      onFitHeight,
      onFitContainer,
    });

    // Update fit mode states
    return baseItems.map(item => {
      if (item.group === 'fitModes') {
        return {
          ...item,
          active: item.type === currentFitMode,
        };
      }
      return item;
    });
  }, [
    config,
    currentIndex,
    totalCount,
    localDownloading,
    currentFitMode,
    onPrevious,
    onNext,
    onDownloadCurrent,
    onDownloadAll,
    onClose,
    onOpenSettings,
    onFitOriginal,
    onFitWidth,
    onFitHeight,
    onFitContainer,
  ]);

  // Build consolidated state
  const state: ToolbarHeadlessState = useMemo(
    () => ({
      items,
      currentMode: globalState.currentMode,
      needsHighContrast: globalState.needsHighContrast,
      isDownloading: localDownloading,
      currentIndex,
      totalCount,
      currentFitMode,
    }),
    [items, globalState, localDownloading, currentIndex, totalCount, currentFitMode]
  );

  // Actions
  const actions: ToolbarHeadlessActions = useMemo(
    () => ({
      setMode: useCallback((mode: 'gallery' | 'settings' | 'download') => {
        updateToolbarMode(mode);
      }, []),

      setHighContrast: useCallback((enabled: boolean) => {
        setHighContrast(enabled);
      }, []),

      setFitMode: useCallback((mode: string) => {
        setCurrentFitMode(mode);
      }, []),

      setDownloading: useCallback((loading: boolean) => {
        setLocalDownloading(loading);
      }, []),

      updateItems: useCallback((_newItems: ToolbarItem[]) => {
        // This could be implemented for dynamic item updates if needed
        console.warn('updateItems not implemented yet');
      }, []),
    }),
    []
  );

  return children(state, actions);
}

export default ToolbarHeadless;
