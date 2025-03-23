import { translate } from "./I18N/index.js";
import { ImageExtractor } from "./tweet/ImageExtractor.js";
import { TweetDataExtractor } from "./tweet/TweetDataExtractor.js";

/**
 * 트윗 정보 클래스
 */
export class TweetInfo {
    constructor() {
        this.user = '';
        this.id = '';
        this.imageUrls = [];
        this.isMediaTab = false;
    }

    /**
     * 트윗 요소에서 정보 추출
     * @param {HTMLElement} containerElement - 트윗 컨테이너 요소
     * @returns {boolean} 추출 성공 여부
     */
    extractFromTweet(containerElement) {
        try {
            // 미디어란인지 확인 (아티클이 아닌 경우)
            this.isMediaTab = !containerElement.tagName || containerElement.tagName.toLowerCase() !== 'article';
            
            // 이미지 URL 추출
            this.imageUrls = ImageExtractor.getAllImagesFromTweet(containerElement, this.isMediaTab);
            if (this.imageUrls.length === 0) return false;

            // 트윗 ID 및 사용자 추출
            this.id = TweetDataExtractor.extractTweetId(containerElement, this.isMediaTab) || translate('unknownID');
            this.user = TweetDataExtractor.extractTweetUser(containerElement, this.isMediaTab) || translate('unknownUser');

            return this.imageUrls.length > 0;
        } catch (e) {
            console.error("Error extracting tweet info:", e);
            return false;
        }
    }
}