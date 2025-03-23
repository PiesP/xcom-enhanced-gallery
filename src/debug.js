import { CONFIG } from './config.js';

/**
 * 디버그 로그 출력 함수
 * @param {string} message - 로그 메시지
 * @param {any} data - 추가 데이터 (선택 사항)
 */
export function debugLog(message, data = null) {
    if (CONFIG.debugMode) {
        if (data) {
            console.log(`[XcomGallery] ${message}`, data);
        } else {
            console.log(`[XcomGallery] ${message}`);
        }
    }
}