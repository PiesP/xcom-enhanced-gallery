import { translate } from "./I18N/index.js";

export class TweetInfo {
    constructor() {
        this.user = '';
        this.id = '';
        this.imageUrls = [];
        this.isMediaTab = false;
    }

    extractFromTweet(containerElement) {
        try {
            // 미디어란인지 확인 (아티클이 아닌 경우)
            this.isMediaTab = !containerElement.tagName || containerElement.tagName.toLowerCase() !== 'article';
            
            this.imageUrls = this.getAllImagesFromTweet(containerElement);
            if (this.imageUrls.length === 0) return false;

            this.id = this.extractTweetIdFromElement(containerElement) || translate('unknownID');
            this.user = this.extractTweetUser(containerElement) || translate('unknownUser');

            return this.imageUrls.length > 0;
        } catch (e) {
            console.error("Error extracting tweet info:", e);
            return false;
        }
    }

    getAllImagesFromTweet(containerElement) {
        try {
            // 일반 타임라인과 미디어란 모두에서 이미지 찾기
            let images = [...containerElement.querySelectorAll('img[src*="pbs.twimg.com/media/"]')]
                .map(img => img.src.replace(/&name=\w+/, '&name=orig'));
            
            // 미디어란에서는 추가적인 방법으로 이미지 찾기 시도
            if (this.isMediaTab && images.length === 0) {
                // 클릭한 이미지가 있는지 확인
                const clickedImage = containerElement.tagName === 'IMG' ? 
                                    containerElement : 
                                    containerElement.querySelector('img');
                
                if (clickedImage && clickedImage.src && clickedImage.src.includes('pbs.twimg.com/media/')) {
                    // 클릭한 이미지를 추가
                    images.push(clickedImage.src.replace(/&name=\w+/, '&name=orig'));
                    
                    // 메디어란에서는 동일한 이미지를 가진 다른 트윗들이 있을 수 있음
                    // 클릭한 이미지만 처리하는 것이 안전
                }
            }
            
            // 이미지 중복 제거
            return [...new Set(images)];
        } catch (e) {
            console.error("Error getting images from tweet:", e);
            return [];
        }
    }

    extractTweetIdFromElement(containerElement) {
        try {
            // 미디어란의 경우 다른 방법으로 트윗 ID 추출 시도
            if (this.isMediaTab) {
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

    extractTweetUser(containerElement) {
        try {
            // 미디어란의 경우 URL에서 사용자 정보 추출 시도
            if (this.isMediaTab) {
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