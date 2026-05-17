import type { ToolbarHandlers } from '@shared/components/ui/Toolbar/handler-types';
import type { ImageFitMode } from '@shared/types/ui.types';
import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';

export type { FitModeHandlers } from '@shared/components/ui/Toolbar/handler-types';
export type { ImageFitMode };

export interface ToolbarProps {
  readonly currentIndex: MaybeAccessor<number>;
  readonly focusedIndex?: MaybeAccessor<number | null> | undefined;
  readonly totalCount: MaybeAccessor<number>;
  readonly handlers: ToolbarHandlers;
  readonly currentFitMode?: MaybeAccessor<ImageFitMode | undefined> | undefined;
  readonly isDownloading?: MaybeAccessor<boolean | undefined> | undefined;
  readonly disabled?: MaybeAccessor<boolean | undefined> | undefined;
  readonly className?: string | undefined;
  readonly tweetText?: MaybeAccessor<string | null | undefined> | undefined;
  readonly tweetTextHTML?: MaybeAccessor<string | null | undefined> | undefined;
  readonly tweetUrl?: MaybeAccessor<string | null | undefined> | undefined;
}
