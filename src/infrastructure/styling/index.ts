/**
 * @fileoverview Infrastructure Styling Module
 * @version 1.0.0
 */

export { CSSManager, type CSSManagerConfig } from './CSSManager';
export {
  OptimizationEngine,
  type CSSOptimizationConfig,
  type OptimizationResult,
} from './OptimizationEngine';

// 기본 인스턴스 export
import { CSSManager } from './CSSManager';
export const cssManager = CSSManager.getInstance();
