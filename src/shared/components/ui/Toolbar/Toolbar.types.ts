import type { Accessor } from 'solid-js';
import type { ToolbarHandlers } from '@shared/components/ui/Toolbar/handler-types';
import type { ImageFitMode } from '@shared/types/settings.types';

export type { FitModeHandlers } from '@shared/components/ui/Toolbar/handler-types';
export type { ImageFitMode };

export interface ToolbarProps {
  readonly currentIndex: Accessor<number>;
  readonly focusedIndex?: Accessor<number | null>;
  readonly totalCount: Accessor<number>;
  readonly handlers: ToolbarHandlers;
  readonly currentFitMode?: Accessor<ImageFitMode | undefined>;
  readonly isDownloading?: Accessor<boolean>;
  readonly disabled?: Accessor<boolean>;
  readonly className?: string | undefined;
  readonly tweetText?: Accessor<string | null>;
  readonly tweetTextHTML?: Accessor<string | null>;
  readonly tweetUrl?: Accessor<string | null>;
}
