/**
 * @fileoverview UnifiedToolbar - Headless+Shell 패턴 통합 스텁
 * 테스트가 요구하는 엔트리 포인트를 제공하고, 점진 구현을 위한 최소 구조만 노출합니다.
 */
import type { JSX } from 'solid-js';
import { Toolbar } from './Toolbar';
import { languageService } from '@shared/services/LanguageService';

export interface ToolbarUnifiedProps {
  readonly children?: unknown;
}

function InternalToolbarUnified(_props: ToolbarUnifiedProps): JSX.Element {
  const noop = () => void 0;
  return Toolbar({
    currentIndex: 0,
    totalCount: 5,
    isDownloading: false,
    disabled: false,
    onPrevious: noop,
    onNext: noop,
    onDownloadCurrent: noop,
    onDownloadAll: noop,
    onClose: noop,
    onOpenSettings: noop,
    onFitOriginal: noop,
    onFitWidth: noop,
    onFitHeight: noop,
    onFitContainer: noop,
    'aria-label': languageService.getString('toolbar.galleryToolbar'),
  });
}

export function ToolbarShell(props: ToolbarUnifiedProps): JSX.Element {
  return InternalToolbarUnified(props);
}

export default InternalToolbarUnified;
