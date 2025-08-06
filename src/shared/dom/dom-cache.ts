/**
 * @fileoverview DOM 캐시 관리
 */

import { querySelector, querySelectorAll, cleanup, unifiedDOMService } from './unified-dom-service';

export class DOMCache {
  static querySelector = querySelector;
  static querySelectorAll = querySelectorAll;
  static clearCache = cleanup;
  static getCacheSize = () => unifiedDOMService.getPerformanceStats();
}

export const globalDOMCache = new DOMCache();
