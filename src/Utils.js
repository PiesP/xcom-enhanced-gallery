/**
 * @file Utils.js
 * @description Unified utility class that provides a facade to multiple utility modules.
 * This class centralizes access to commonly used utility functions from various domains
 * like storage, DOM manipulation, URL handling, and function utilities.
 */

import { StorageUtils } from "./utils/StorageUtils.js";
import { DOMUtils } from "./utils/DOMUtils.js";
import { URLUtils } from "./utils/URLUtils.js";
import { FunctionUtils } from "./utils/FunctionUtils.js";

/**
 * @class Utils
 * @description Unified utility class that serves as a facade for specialized utility modules.
 * Provides a single entry point for commonly used utility functions across the application.
 */
export class Utils {
    /**
     * @method getLocalStorageItem
     * @static
     * @description Get item from localStorage with fallback to default value
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Retrieved value or default value
     */
    static getLocalStorageItem(key, defaultValue) {
        return StorageUtils.getLocalStorageItem(key, defaultValue);
    }

    /**
     * @method setLocalStorageItem
     * @static
     * @description Save item to localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    static setLocalStorageItem(key, value) {
        StorageUtils.setLocalStorageItem(key, value);
    }

    /**
     * @method createStyleSheet
     * @static
     * @description Create and inject a stylesheet into the document
     * @param {string} id - Unique identifier for the stylesheet
     * @param {string} cssContent - CSS content to inject
     */
    static createStyleSheet(id, cssContent) {
        DOMUtils.createStyleSheet(id, cssContent);
    }

    /**
     * @method getUserUIColor
     * @static
     * @description Get current UI colors based on user's theme
     * @returns {Object} Object containing bgColor and textColor
     */
    static getUserUIColor() {
        return DOMUtils.getUserUIColor();
    }

    /**
     * @method addAlpha
     * @static
     * @description Add alpha channel to a color
     * @param {string} color - CSS color value
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} Color with alpha channel
     */
    static addAlpha(color, alpha) {
        return DOMUtils.addAlpha(color, alpha);
    }

    /**
     * @method getFileExtension
     * @static
     * @description Extract file extension from URL
     * @param {string} url - URL to process
     * @returns {string} Extracted file extension
     */
    static getFileExtension(url) {
        return URLUtils.getFileExtension(url);
    }

    /**
     * @method debounce
     * @static
     * @description Create a debounced version of a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Whether to execute on leading edge
     * @returns {Function} Debounced function
     */
    static debounce(func, wait, immediate = false) {
        return FunctionUtils.debounce(func, wait, immediate);
    }
}