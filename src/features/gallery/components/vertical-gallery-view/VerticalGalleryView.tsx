/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview Vertical Gallery View Component
 * @version 6.0 - 통합 툴바 상태 관리 시스템 적용
 *
 * 주요 개선사항:
 * - 통합 툴바 상태 관리 (Signals 기반)
 * - 타이머 통합 관리로 충돌 방지
 * - 중복 로직 제거 및 코드 간소화
 * - 일관된 사용자 경험 제공
 */
/**
 * Copyright (c) 2025 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview Legacy vertical gallery view placeholder.
 * @description During the Solid migration the original Preact implementation was removed.
 *              This stub intentionally prevents accidental usage while keeping historical
 *              module structure for tooling/tests that enforce migration policies.
 */

import { logger } from '@shared/logging/logger';

export interface VerticalGalleryViewProps {
  readonly onClose?: () => void;
  readonly className?: string;
  readonly onPrevious?: () => void;
  readonly onNext?: () => void;
  readonly onDownloadCurrent?: () => void;
  readonly onDownloadAll?: () => void;
  readonly windowingEnabled?: boolean;
  readonly windowSize?: number;
}

const migrationMessage =
  '[VerticalGalleryView] Legacy component has been removed. Use the Solid gallery shell instead.';

export function VerticalGalleryView(_props: VerticalGalleryViewProps): never {
  logger.error(migrationMessage);
  throw new Error(migrationMessage);
}

Object.defineProperty(VerticalGalleryView, 'displayName', {
  value: 'LegacyVerticalGalleryViewRemoved',
  configurable: true,
  writable: false,
});

export default VerticalGalleryView;
