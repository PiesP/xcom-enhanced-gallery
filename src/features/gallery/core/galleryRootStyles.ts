/**
 * @fileoverview Gallery Root Overlay Style Utilities
 * @description CH13: 닫힘 후 overlay 잔존 문제 해결을 위한 활성/비활성 전환 유틸
 */
import { logger } from '@shared/logging/logger';

const ACTIVE_OVERLAY_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  minHeight: '100vh',
  boxSizing: 'border-box',
  padding: '2rem',
  background: 'rgba(0, 0, 0, 0.9)',
  zIndex: '9999',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflowY: 'scroll',
  pointerEvents: 'auto',
};

export function activateGalleryRoot(root: HTMLElement): void {
  try {
    Object.assign(root.style, ACTIVE_OVERLAY_STYLE);
    root.dataset.xegActive = 'true';
  } catch (error) {
    logger.warn('[GalleryRootStyles] activate 실패:', error);
  }
}

export function deactivateGalleryRoot(root: HTMLElement): void {
  try {
    root.style.pointerEvents = 'none';
    root.style.background = 'transparent';
    root.style.padding = '0';
    root.dataset.xegActive = 'false';
  } catch (error) {
    logger.warn('[GalleryRootStyles] deactivate 실패:', error);
  }
}

export function isGalleryRootActive(root: HTMLElement | null): boolean {
  if (!root) return false;
  return root.dataset.xegActive === 'true';
}
