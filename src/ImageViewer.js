import { ViewerCore } from "./ViewerCore.js";

/**
 * 이미지 뷰어 진입점 클래스
 * 호환성을 위해 ViewerCore를 감싸는 래퍼 클래스로 유지
 */
export class ImageViewer {
    constructor() {
        this.core = new ViewerCore();
    }

    /**
     * 뷰어 초기화
     * @param {HTMLElement} tweetElement - 트윗 요소
     * @param {string} clickedImageSrc - 클릭한 이미지 URL
     */
    init(tweetElement, clickedImageSrc = null) {
        this.core.init(tweetElement, clickedImageSrc);
    }
    
    /**
     * 뷰어 정리 및 종료
     */
    destroy() {
        this.core.destroy();
    }
}