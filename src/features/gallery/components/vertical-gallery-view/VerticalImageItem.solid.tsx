/**
 * @fileoverview Solid implementation of the vertical gallery media item.
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { ComponentStandards } from '@shared/components/ui/StandardProps';
import type { ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';
import type { VerticalImageItemProps } from './VerticalImageItem.types';
import styles from './VerticalImageItem.module.css';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

const cleanFilename = (input?: string): string => {
  if (!input) {
    return 'Untitled';
  }
  const trimmed = input.split(/[\\/]/).pop() ?? input;
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
};

const isVideoMedia = (media: MediaInfo): boolean => {
  const normalizedUrl = media.url.toLowerCase();
  if (VIDEO_EXTENSIONS.some(extension => normalizedUrl.endsWith(extension))) {
    return true;
  }
  if (media.filename && VIDEO_EXTENSIONS.some(ext => media.filename.toLowerCase().endsWith(ext))) {
    return true;
  }
  return media.type === 'video';
};

const getContainerFitClass = (mode?: ImageFitMode): string | undefined => {
  switch (mode) {
    case 'original':
      return styles.fitOriginal;
    case 'fitWidth':
      return styles.fitWidth;
    case 'fitHeight':
      return styles.fitHeight;
    case 'fitContainer':
      return styles.fitContainer;
    default:
      return undefined;
  }
};

const getMediaFitClass = getContainerFitClass;

const SolidVerticalImageItem = (props: VerticalImageItemProps): JSX.Element => {
  const solid = getSolidCore();
  const { Show } = solid;
  const [isLoaded, setIsLoaded] = solid.createSignal(false);
  const [hasError, setHasError] = solid.createSignal(false);

  const mediaIsVideo = solid.createMemo(() => isVideoMedia(props.media));
  const filename = solid.createMemo(() => cleanFilename(props.media.filename));

  let imageRef: HTMLImageElement | undefined;
  let videoRef: HTMLVideoElement | undefined;

  const resetState = () => {
    setIsLoaded(false);
    setHasError(false);
  };

  solid.createEffect(() => {
    props.media.url;
    resetState();
  });

  const notifyLoaded = () => {
    if (isLoaded()) {
      return;
    }
    setIsLoaded(true);
    setHasError(false);
    props.onMediaLoad?.(props.media.url, props.index);
  };

  solid.createEffect(() => {
    if (mediaIsVideo()) {
      if (videoRef && videoRef.readyState >= 1) {
        notifyLoaded();
      }
      return;
    }

    if (imageRef?.complete) {
      notifyLoaded();
    }
  });

  const handleMediaError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  /**
   * 이벤트 전파 규칙 (Epic UX-GALLERY-FEEDBACK-001 Phase 3):
   * 1. 컨테이너 클릭 → 아이템 선택 (props.onClick)
   * 2. 컨텍스트 메뉴 → 다운로드/정보 보기 액션 제공 (props.onImageContextMenu)
   */
  const handleContainerClick = () => {
    props.onClick?.();
  };

  /**
   * 컨텍스트 메뉴 핸들러
   * 컨테이너/이미지/비디오 우클릭 시 컨텍스트 메뉴를 표시하고,
   * 미디어 정보를 부모 컴포넌트로 전달합니다.
   *
   * Phase 3: 다운로드 버튼 제거 후 컨텍스트 메뉴를 통한 다운로드 액션 제공
   */
  const handleContextMenu = (event: MouseEvent) => {
    props.onImageContextMenu?.(event, props.media);
  };

  const ariaProps = solid.createMemo(() => {
    const ariaOptions: Partial<Record<string, string | number>> = {
      'aria-label': props['aria-label'] ?? `Media ${props.index + 1}: ${filename()}`,
      role: props.role ?? 'button',
    };

    if (props['aria-describedby']) {
      ariaOptions['aria-describedby'] = props['aria-describedby'];
    }

    if (typeof props.tabIndex === 'number') {
      ariaOptions.tabIndex = props.tabIndex;
    } else {
      ariaOptions.tabIndex = 0;
    }

    return ComponentStandards.createAriaProps(ariaOptions);
  });

  const testProps = solid.createMemo(() =>
    ComponentStandards.createTestProps(props['data-testid'])
  );

  const containerClass = solid.createMemo(() =>
    ComponentStandards.createClassName(
      styles.container,
      props.isActive ? styles.active : undefined,
      props.isFocused ? styles.focused : undefined,
      getContainerFitClass(props.fitMode),
      isLoaded() ? 'loaded' : 'loading',
      hasError() ? 'error' : undefined,
      props.className
    )
  );

  const imageClass = solid.createMemo(() =>
    ComponentStandards.createClassName(
      styles.image,
      getMediaFitClass(props.fitMode),
      isLoaded() ? 'loaded' : 'loading'
    )
  );

  const videoClass = solid.createMemo(() =>
    ComponentStandards.createClassName(
      styles.video,
      getMediaFitClass(props.fitMode),
      isLoaded() ? 'loaded' : 'loading'
    )
  );

  const handleFocus = (event: FocusEvent) => {
    props.onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent) => {
    props.onBlur?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    props.onKeyDown?.(event);
  };

  return (
    <div
      class={containerClass()}
      onClick={handleContainerClick}
      onContextMenu={handleContextMenu}
      data-index={props.index}
      data-xeg-gallery='true'
      data-xeg-gallery-type='item'
      data-xeg-gallery-version='3.0'
      data-xeg-component='vertical-image-item'
      data-xeg-role={props['data-xeg-role'] ?? 'gallery-item'}
      data-force-visible={props.forceVisible ? 'true' : undefined}
      data-fit-mode={props.fitMode ?? 'unset'}
      onFocus={handleFocus as JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>}
      onBlur={handleBlur as JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>}
      onKeyDown={handleKeyDown as JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent>}
      {...ariaProps()}
      {...testProps()}
    >
      <div class={styles.imageWrapper}>
        <Show when={!isLoaded() && !hasError()}>
          <div class={styles.placeholder} role='presentation'>
            <span class={styles.loadingSpinner} aria-hidden='true' />
          </div>
        </Show>

        <Show
          when={mediaIsVideo()}
          fallback={
            <img
              ref={node => {
                imageRef = node ?? undefined;
              }}
              class={imageClass()}
              src={props.media.url}
              alt={filename()}
              loading='lazy'
              decoding='async'
              data-fit-mode={props.fitMode ?? 'unset'}
              onLoad={notifyLoaded}
              onError={handleMediaError}
            />
          }
        >
          <video
            ref={node => {
              videoRef = node ?? undefined;
            }}
            class={videoClass()}
            src={props.media.url}
            controls
            data-fit-mode={props.fitMode ?? 'unset'}
            onLoadedData={notifyLoaded}
            onError={handleMediaError}
          />
        </Show>

        <Show when={hasError()}>
          <div class={styles.error} role='status'>
            <span class={styles.errorIcon} aria-hidden='true'>
              ⚠️
            </span>
            <span class={styles.errorText}>Failed to load media</span>
          </div>
        </Show>
      </div>

      <div class={styles.overlay} aria-hidden='true'>
        <span class={styles.indexBadge}>{props.index + 1}</span>
      </div>
    </div>
  );
};

Object.defineProperty(SolidVerticalImageItem, 'displayName', {
  value: 'SolidVerticalImageItem',
  writable: false,
  configurable: true,
});

export { SolidVerticalImageItem };
export default SolidVerticalImageItem;
