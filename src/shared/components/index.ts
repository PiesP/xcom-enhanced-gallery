/**
 * Shared Components Barrel Export
 *
 * 모든 공통 컴포넌트를 중앙집중식으로 export합니다.
 * 이를 통해 다음과 같이 간편하게 import할 수 있습니다:
 *
 * @example
 * ```typescript
 * import { Button, Toast, Toolbar } from '@shared/components';
 * // 또는 카테고리별로
 * import { Button } from '@shared/components/ui';
 * import { withGalleryMarker } from '@shared/components/hoc';
 * ```
 */

// UI Components
export * from './ui';

// Higher-Order Components
export * from './hoc';
