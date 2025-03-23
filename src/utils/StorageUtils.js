/**
 * 로컬 스토리지 관련 유틸리티 함수
 */
export class StorageUtils {
    /**
     * 로컬 스토리지에서 항목 가져오기
     * @param {string} key - 로컬 스토리지 키
     * @param {any} defaultValue - 기본값
     * @returns {any} 저장된 값 또는 기본값
     */
    static getLocalStorageItem(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * 로컬 스토리지에 항목 저장
     * @param {string} key - 로컬 스토리지 키
     * @param {any} value - 저장할 값
     */
    static setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`localStorage save failed: ${e.message}`);
        }
    }
}