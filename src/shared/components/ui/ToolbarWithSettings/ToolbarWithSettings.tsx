/**
 * @fileoverview ToolbarWithSettings 컴포넌트 (SolidJS Stage D migration)
 * @description 툴바와 설정 모달을 통합한 Solid 구현
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { Toolbar, type ToolbarProps } from '../Toolbar/Toolbar';
import { SettingsModal } from '../SettingsModal/SettingsModal';

export interface ToolbarSettingsRendererOptions {
  readonly container: HTMLElement;
  readonly onClose: () => void;
  readonly position: 'center' | 'toolbar-below' | 'bottom-sheet' | 'top-right';
  readonly testId: string;
}

export interface ToolbarSettingsRendererInstance {
  open(): void;
  close(): void;
  dispose(): void;
}

export type ToolbarSettingsRendererFactory = (
  options: ToolbarSettingsRendererOptions
) => ToolbarSettingsRendererInstance;

export interface ToolbarWithSettingsProps extends Omit<ToolbarProps, 'onOpenSettings'> {
  /** 설정 모달 위치 (기본: toolbar-below) */
  settingsPosition?: 'center' | 'toolbar-below' | 'bottom-sheet' | 'top-right';
  /** 설정 모달 테스트 ID */
  settingsTestId?: string;
  /** 외부 설정 패널 렌더러 팩토리 (Solid 경로 등 주입용) */
  settingsRendererFactory?: ToolbarSettingsRendererFactory | undefined;
}

export const ToolbarWithSettings = (providedProps: ToolbarWithSettingsProps): JSX.Element => {
  const solid = getSolidCore();
  const props = solid.mergeProps(
    {
      settingsPosition: 'toolbar-below' as const,
      settingsTestId: 'toolbar-settings-modal',
    },
    providedProps
  );

  const [local, toolbarProps] = solid.splitProps(props, [
    'settingsPosition',
    'settingsTestId',
    'settingsRendererFactory',
  ]);

  const [isSettingsOpen, setIsSettingsOpen] = solid.createSignal(false);
  const [externalContainer, setExternalContainer] = solid.createSignal<HTMLDivElement | null>(null);
  const [rendererInstance, setRendererInstance] =
    solid.createSignal<ToolbarSettingsRendererInstance | null>(null);

  const normalizedSettingsPosition = solid.createMemo(() =>
    local.settingsPosition === 'top-right' ? 'top-right' : 'toolbar-below'
  );

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  /**
   * 툴바의 닫기 버튼 핸들러
   * - 설정 모달이 열려있으면 먼저 설정 모달을 닫음
   * - 설정 모달이 닫혀있으면 갤러리를 닫음
   */
  const handleToolbarClose = () => {
    if (isSettingsOpen()) {
      // 설정 모달이 열려있으면 먼저 모달 닫기
      setIsSettingsOpen(false);
    } else {
      // 설정 모달이 닫혀있으면 갤러리 닫기
      toolbarProps.onClose?.();
    }
  };

  const attachExternalContainer = (element: HTMLDivElement | null) => {
    setExternalContainer(current => (current === element ? current : element));
  };

  solid.createEffect(() => {
    const open = isSettingsOpen();
    const instance = rendererInstance();
    if (!instance) {
      return;
    }
    if (open) {
      instance.open();
    } else {
      instance.close();
    }
  });

  solid.createEffect(() => {
    const factory = local.settingsRendererFactory;
    const container = externalContainer();

    if (!factory) {
      const existing = solid.untrack(() => rendererInstance());
      if (existing) {
        try {
          existing.close();
        } catch {
          /* noop */
        }
        existing.dispose();
        setRendererInstance(null);
      }
      if (container) {
        try {
          container.replaceChildren();
        } catch {
          /* noop */
        }
      }
      return;
    }

    if (!container) {
      return;
    }

    const instance = factory({
      container,
      onClose: handleCloseSettings,
      position: local.settingsPosition,
      testId: local.settingsTestId,
    });

    setRendererInstance(instance);

    if (isSettingsOpen()) {
      instance.open();
    }

    solid.onCleanup(() => {
      instance.dispose();
      if (solid.untrack(() => rendererInstance()) === instance) {
        setRendererInstance(null);
      }
      try {
        container.replaceChildren();
      } catch {
        /* noop */
      }
    });
  });

  solid.onCleanup(() => {
    const instance = solid.untrack(() => rendererInstance());
    if (instance) {
      try {
        instance.close();
      } catch {
        /* noop */
      }
      instance.dispose();
      setRendererInstance(null);
    }
    const container = solid.untrack(() => externalContainer());
    if (container) {
      try {
        container.replaceChildren();
      } catch {
        /* noop */
      }
    }
  });

  return (
    <>
      <Toolbar {...toolbarProps} onOpenSettings={handleOpenSettings} onClose={handleToolbarClose} />
      {local.settingsRendererFactory ? (
        <div ref={attachExternalContainer} data-xeg-toolbar-settings-host='' />
      ) : isSettingsOpen() ? (
        <SettingsModal
          isOpen={isSettingsOpen()}
          onClose={handleCloseSettings}
          position={normalizedSettingsPosition()}
          data-testid={local.settingsTestId}
        />
      ) : null}
    </>
  );
};

export default ToolbarWithSettings;
