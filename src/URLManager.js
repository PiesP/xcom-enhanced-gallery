import { debugLog } from './debug.js';

/**
 * URL 관리 클래스
 */
export class URLManager {
    /**
     * 미디어란 URL인지 확인
     * @returns {boolean} 미디어란 여부
     */
    static isMediaTab() {
        return window.location.pathname.match(/\/[^\/]+\/media/);
    }
    
    /**
     * URL에서 /photo/ 경로 제거
     */
    static cleanPhotoPath() {
        if (window.location.href.includes('/photo/')) {
            const newUrl = window.location.href.replace(/\/photo\/\d+$/, '');
            history.replaceState(null, '', newUrl);
        }
    }
    
    /**
     * URL 변경 감지 설정
     */
    static setupURLChangeDetection() {
        try {
            const titleElement = document.querySelector('title');
            if (titleElement) {
                const urlObserver = new MutationObserver(() => {
                    URLManager.cleanPhotoPath();
                });
                
                urlObserver.observe(titleElement, {
                    subtree: true,
                    characterData: true,
                    childList: true
                });
                
                debugLog('URL 변경 감지 설정 완료 (title 요소 방식)');
            } else {
                // title 요소를 찾을 수 없는 경우 정기적으로 확인
                let lastUrl = window.location.href;
                setInterval(() => {
                    if (lastUrl !== window.location.href) {
                        lastUrl = window.location.href;
                        URLManager.cleanPhotoPath();
                    }
                }, 500);
                
                debugLog('URL 변경 감지 설정 완료 (폴링 방식)');
            }
        } catch (e) {
            console.error("URL 감시 설정 중 오류 발생:", e);
        }
    }
}