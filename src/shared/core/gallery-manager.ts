/**
 * @fileoverview Gallery Manager - DEPRECATED
 * @description 이 파일은 삭제 예정입니다. GalleryService를 사용하세요.
 * @version 2.0.0 - DEPRECATED
 * @deprecated Use GalleryService instead
 */

// DEPRECATED: 이 파일의 모든 기능은 GalleryService로 이전되었습니다.
// 새 코드에서는 GalleryService를 사용하세요.

// Re-export all from GalleryService for backward compatibility
export * from '@shared/services/gallery/GalleryService';

// Legacy alias for backward compatibility
import { GalleryService } from '@shared/services/gallery/GalleryService';

/**
 * @deprecated Use GalleryService instead
 */
export const GalleryManager = GalleryService;

/**
 * @deprecated Use GalleryService.getInstance() instead
 */
export const galleryManager = GalleryService.getInstance();
