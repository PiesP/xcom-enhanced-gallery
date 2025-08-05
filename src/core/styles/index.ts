/**
 * @fileoverview 코어 스타일 관리
 * @description 코어 레벨 스타일 시스템
 */

import { unifiedStyleService } from '@shared/services/unified-style-service';

export type GlassmorphismIntensity = 'subtle' | 'medium' | 'strong';

export class CoreStyleManager {
  private static instance: CoreStyleManager | null = null;

  public static getInstance(): CoreStyleManager {
    if (!CoreStyleManager.instance) {
      CoreStyleManager.instance = new CoreStyleManager();
    }
    return CoreStyleManager.instance;
  }

  public setGlassmorphism(intensity: GlassmorphismIntensity): void {
    const values = {
      subtle: '0.8',
      medium: '0.6',
      strong: '0.4',
    };
    unifiedStyleService.setCSSVariable('--xeg-glass-opacity', values[intensity]);
  }
}

export const coreStyleManager = CoreStyleManager.getInstance();
