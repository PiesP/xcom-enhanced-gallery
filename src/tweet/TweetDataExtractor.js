/**
 * 트윗 데이터 추출 클래스
 */
export class TweetDataExtractor {
    /**
     * 트윗 ID 추출
     * @param {HTMLElement} containerElement - 트윗 컨테이너 요소
     * @param {boolean} isMediaTab - 미디어 탭 여부
     * @returns {string|null} 트윗 ID 또는 null
     */
    static extractTweetId(containerElement, isMediaTab) {
        try {
            // 미디어란의 경우 다른 방법으로 트윗 ID 추출 시도
            if (isMediaTab) {
                // 링크 탐색
                const statusLink = containerElement.querySelector('a[href*="/status/"]');
                if (statusLink) {
                    const match = statusLink.href.match(/\/status\/(\d+)/);
                    if (match) return match[1];
                }
                
                // 데이터 속성 탐색
                const linkElement = containerElement.closest('[role="link"]');
                if (linkElement && linkElement.href) {
                    const match = linkElement.href.match(/\/status\/(\d+)/);
                    if (match) return match[1];
                }
                
                return null;
            }
            
            // 일반 타임라인에서는 기존 방식 사용
            const statusLinks = containerElement.querySelectorAll('a[href*="/status/"]');
            for (const link of statusLinks) {
                const match = link.href.match(/\/status\/(\d+)/);
                if (match) return match[1];
            }
            return null;
        } catch (e) {
            console.error("Error extracting tweet ID:", e);
            return null;
        }
    }

    /**
     * 트윗 사용자 추출
     * @param {HTMLElement} containerElement - 트윗 컨테이너 요소
     * @param {boolean} isMediaTab - 미디어 탭 여부
     * @returns {string|null} 사용자 이름 또는 null
     */
    static extractTweetUser(containerElement, isMediaTab) {
        try {
            // 미디어란의 경우 URL에서 사용자 정보 추출 시도
            if (isMediaTab) {
                // 현재 URL에서 타니다면 사용자 아이디 추출 시도
                const pathMatch = window.location.pathname.match(/^\/(\w+)/);
                if (pathMatch && pathMatch[1]) {
                    return pathMatch[1];
                }
                
                // 링크에서 추출 시도
                const userLink = containerElement.querySelector('a[href^="/"]');
                if (userLink) {
                    const username = userLink.getAttribute('href').split('/')[1];
                    if (username && !username.includes('#') && !username.includes('?')) {
                        return username;
                    }
                }
                
                return null;
            }
            
            // 일반 타임라인에서는 기존 방식 사용
            const userLink = containerElement.querySelector('a[href^="/"]');
            if (!userLink) return null;
            
            const username = userLink.getAttribute('href').split('/')[1];
            if (username && !username.includes('#') && !username.includes('?')) {
                return username;
            }
            return null;
        } catch (e) {
            console.error("Error extracting tweet user:", e);
            return null;
        }
    }
}