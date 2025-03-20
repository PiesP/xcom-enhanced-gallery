export class Utils {
    static getLocalStorageItem(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    static setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`localStorage save failed: ${e.message}`);
        }
    }

    static createStyleSheet(id, cssContent) {
        if (!document.getElementById(id)) {
            const styleSheet = document.createElement('style');
            styleSheet.id = id;
            styleSheet.textContent = cssContent;
            document.head.appendChild(styleSheet);
        }
    }

    static getFileExtension(url) {
        try {
            const urlParams = new URL(url).searchParams;
            const format = urlParams.get('format');
            return format ? format : 'jpg';
        } catch (e) {
            return 'jpg';
        }
    }

    static getUserUIColor() {
        try {
            const computedStyle = getComputedStyle(document.body);
            return {
                bgColor: computedStyle.backgroundColor || 'black',
                textColor: computedStyle.color || 'white'
            };
        } catch (e) {
            return { bgColor: 'black', textColor: 'white' };
        }
    }

    static addAlpha(color, alpha) {
        try {
            if (color.startsWith("rgb(")) {
                return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
            }
            return color;
        } catch (e) {
            return `rgba(0, 0, 0, ${alpha})`;
        }
    }

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
