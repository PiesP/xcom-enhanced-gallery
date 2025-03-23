/**
 * 함수 관련 유틸리티
 */
export class FunctionUtils {
    /**
     * 디바운스 함수
     * @param {Function} func - 디바운스할 함수
     * @param {number} wait - 대기 시간(ms)
     * @param {boolean} immediate - 첫 호출 시 즉시 실행 여부
     * @returns {Function} 디바운스된 함수
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function(...args) {
            const context = this;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
}