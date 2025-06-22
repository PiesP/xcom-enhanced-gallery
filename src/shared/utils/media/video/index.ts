/**
 * @fileoverview Video utilities index
 * @version 1.0.0
 */

export { VideoController, type VideoControllerConfig } from './VideoController';
export { VideoExtractor, type VideoMediaInfo } from './VideoExtractor';
export { VideoManager, type VideoManagerConfig } from './VideoManager';
export { VideoStateTracker, type VideoEvent } from './VideoStateTracker';

// 기본 인스턴스 export (호환성을 위해)
import { VideoManager } from './VideoManager';
export const videoManager = VideoManager.getInstance();
