/**
 * Scroll Restoration Presets
 * route-scroll-restorer 및 테스트에서 재사용 가능한 구성 프리셋
 */
import { setScrollRestorationConfig } from './scroll-restoration-config';
import { logger } from '@shared/logging';

const LOG = { preset: '[scroll/preset]' };

export function applyQuickFixPreset(): void {
  logger.info(`${LOG.preset} QuickFix preset 적용`);
  setScrollRestorationConfig({
    disableMultiPassScrollCorrection: false,
    strategyOrder: ['anchor', 'absolute'],
    enableLegacyAnchorKey: true,
  });
}

export function applyAdvancedDriftPreset(): void {
  logger.info(`${LOG.preset} Advanced Drift preset 적용`);
  setScrollRestorationConfig({
    enableSignalBasedGalleryScroll: true,
    disableMultiPassScrollCorrection: false,
    strategyOrder: ['anchor', 'absolute'],
    enableLegacyAnchorKey: true,
  });
}

export function applyAllScrollPresetsForDev(): void {
  applyQuickFixPreset();
  applyAdvancedDriftPreset();
}
