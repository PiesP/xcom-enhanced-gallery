/**
 * DOM 관련 유틸리티 함수
 */
export class DOMUtils {
    /**
     * 스타일시트 생성
     * @param {string} id - 스타일시트 ID
     * @param {string} cssContent - CSS 내용
     */
    static createStyleSheet(id, cssContent) {
        if (!document.getElementById(id)) {
            const styleSheet = document.createElement('style');
            styleSheet.id = id;
            styleSheet.textContent = cssContent;
            document.head.appendChild(styleSheet);
        }
    }

    /**
     * 사용자 UI 색상 가져오기
     * @returns {Object} bgColor와 textColor를 포함한 객체
     */
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

    /**
     * 색상에 알파 값 추가
     * @param {string} color - 색상 문자열
     * @param {number} alpha - 알파 값(0~1)
     * @returns {string} 알파 값이 추가된 색상 문자열
     */
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
}