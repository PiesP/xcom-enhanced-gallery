/**
 * URL 관련 유틸리티 함수
 */
export class URLUtils {
    /**
     * URL에서 파일 확장자 추출
     * @param {string} url - 이미지 URL
     * @returns {string} 파일 확장자
     */
    static getFileExtension(url) {
        try {
            const urlParams = new URL(url).searchParams;
            const format = urlParams.get('format');
            return format ? format : 'jpg';
        } catch (e) {
            return 'jpg';
        }
    }
}