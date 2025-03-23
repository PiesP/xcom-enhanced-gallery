import { StorageUtils } from "./utils/StorageUtils.js";
import { DOMUtils } from "./utils/DOMUtils.js";
import { URLUtils } from "./utils/URLUtils.js";
import { FunctionUtils } from "./utils/FunctionUtils.js";

/**
 * 통합 유틸리티 클래스
 * 분할된 유틸리티 모듈을 하나의 인터페이스로 제공합니다.
 */
export class Utils {
    // StorageUtils
    static getLocalStorageItem(key, defaultValue) {
        return StorageUtils.getLocalStorageItem(key, defaultValue);
    }

    static setLocalStorageItem(key, value) {
        StorageUtils.setLocalStorageItem(key, value);
    }

    // DOMUtils
    static createStyleSheet(id, cssContent) {
        DOMUtils.createStyleSheet(id, cssContent);
    }

    static getUserUIColor() {
        return DOMUtils.getUserUIColor();
    }

    static addAlpha(color, alpha) {
        return DOMUtils.addAlpha(color, alpha);
    }

    // URLUtils
    static getFileExtension(url) {
        return URLUtils.getFileExtension(url);
    }

    // FunctionUtils
    static debounce(func, wait, immediate = false) {
        return FunctionUtils.debounce(func, wait, immediate);
    }
}