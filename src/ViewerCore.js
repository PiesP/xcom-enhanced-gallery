import { Utils } from "./Utils.js";
import { TweetInfo } from "./TweetInfo.js";
import { translate } from "./I18N/index.js";
import { ViewerDOM } from "./components/ViewerDOM.js";
import { ViewerNavigation } from "./components/ViewerNavigation.js";
import { ViewerDownload } from "./components/ViewerDownload.js";
import { ViewerEvents } from "./components/ViewerEvents.js";
import { ViewerImageLoader } from "./components/ViewerImageLoader.js";
import { ViewerFocus } from "./components/ViewerFocus.js";
import { ImageAdjustment } from "./components/ImageAdjustment.js";
import { ThumbnailManager } from "./components/ThumbnailManager.js";
import { ViewerState } from "./components/ViewerState.js";
import { debugLog } from "./debug.js";

// 새로 분할된 핵심 모듈 가져오기
import { ViewerComponentInitializer } from "./core/ViewerComponentInitializer.js";
import { ViewerNavigationManager } from "./core/ViewerNavigationManager.js";
import { ViewerUIManager } from "./core/ViewerUIManager.js";
import { ViewerCleanup } from "./core/ViewerCleanup.js";

/**
 * 이미지 뷰어 핵심 클래스
 */
export class ViewerCore {
    constructor() {
        // 기본 상태
        this.tweetInfo = new TweetInfo();
        this.savedScrollPos = 0;
        
        // DOM 요소
        this.viewer = null;
        this.optionsBar = null;
        this.thumbnailBar = null;
        this.imageContainer = null;
        this.currentImageIndicator = null;
        
        // 컴포넌트 및 유틸리티
        this.dom = null;
        this.navigation = null;
        this.download = null;
        this.events = null;
        this.imageLoader = null;
        this.focus = null;
        this.adjustment = null;
        this.thumbnailManager = null;
        this.state = null;
        
        // 이벤트 핸들러
        this.keyboardHandler = null;
        this.wheelHandler = null;
        
        // 옵저버 및 기타
        this.observers = [];
        
        // 의존성 참조 - 분리된 모듈에서 접근할 수 있도록
        this.deps = {
            ViewerNavigation,
            ViewerDownload,
            ViewerEvents,
            ViewerImageLoader,
            ViewerFocus,
            ImageAdjustment,
            ThumbnailManager
        };
    }
    
    /**
     * 뷰어 초기화
     * @param {HTMLElement} tweetElement - 트윗 요소
     * @param {string} clickedImageSrc - 클릭한 이미지 URL (선택 사항)
     */
    init(tweetElement, clickedImageSrc = null) {
        if (!this.tweetInfo.extractFromTweet(tweetElement)) return;
        
        // 기존 뷰어 정리
        this.destroy();
        
        // 스크롤 위치 저장 및 스크롤 방지
        this.savedScrollPos = window.pageYOffset || document.documentElement.scrollTop;
        document.body.style.overflow = 'hidden';
        
        // 클릭한 이미지의 인덱스 찾기
        let initialIndex = 0;
        if (clickedImageSrc) {
            const originalSrc = clickedImageSrc.replace(/&name=\w+/, '&name=orig');
            const clickedIndex = this.tweetInfo.imageUrls.findIndex(url => url === originalSrc);
            if (clickedIndex !== -1) {
                initialIndex = clickedIndex;
                debugLog(`클릭한 이미지 인덱스: ${clickedIndex}`);
            }
        }
        
        // 상태 초기화
        this.state = new ViewerState();
        this.state.init(initialIndex, this.tweetInfo.imageUrls.length);
        
        this.createViewer();
        ViewerComponentInitializer.setupComponents(this);
        ViewerComponentInitializer.setupEventHandlers(this);
        
        // 이미지 로딩 시작
        const handlers = {
            selectImage: (index, smooth = true) => this.selectImage(index, smooth),
            focusImage: (index) => this.focus.focusCurrentImage(index, true, () => 
                this.imageLoader.forceLoadImage(this.tweetInfo.imageUrls[index], index, handlers)
            )
        };
        
        this.imageLoader.loadImages(this.tweetInfo.imageUrls, handlers);
        
        document.body.appendChild(this.viewer);
        this.focus.focusCurrentImage(this.state.getCurrentIndex(), false, (index) => 
            this.imageLoader.forceLoadImage(this.tweetInfo.imageUrls[index], index, handlers)
        );
    }
    
    /**
     * 뷰어 생성
     */
    createViewer() {
        this.dom = new ViewerDOM();
        this.viewer = this.dom.createViewer();
        
        // 닫기 기능 강화
        this.viewer.addEventListener('click', (e) => {
            if (e.target === this.viewer) {
                e.preventDefault();
                e.stopPropagation();
                this.destroy();
            }
        });
    }
    
    /**
     * 이전 이미지로 이동
     */
    prevImage() {
        ViewerNavigationManager.prevImage(this);
    }
    
    /**
     * 다음 이미지로 이동
     */
    nextImage() {
        ViewerNavigationManager.nextImage(this);
    }
    
    /**
     * 특정 이미지 선택
     * @param {number} index - 선택할 이미지 인덱스
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    selectImage(index, smooth = true) {
        ViewerNavigationManager.selectImage(this, index, smooth);
    }
    
    /**
     * 첫 번째 이미지로 이동
     */
    goToFirst() {
        ViewerNavigationManager.goToFirst(this);
    }
    
    /**
     * 마지막 이미지로 이동
     */
    goToLast() {
        ViewerNavigationManager.goToLast(this);
    }
    
    /**
     * 현재 인덱스 업데이트
     * @param {number} index - 새 인덱스
     */
    updateCurrentIndex(index) {
        ViewerNavigationManager.updateCurrentIndex(this, index);
    }
    
    /**
     * 모든 UI 요소 업데이트
     */
    updateAllUIElements() {
        ViewerUIManager.updateAllUIElements(this);
    }
    
    /**
     * 새 인덱스로 뷰어 업데이트
     * @param {number} index - 새 인덱스
     */
    updateViewerForIndex(index) {
        ViewerNavigationManager.updateViewerForIndex(this, index);
    }
    
    /**
     * 이미지 크기 조정
     * @param {string} mode - 조정 모드
     */
    adjustImages(mode) {
        ViewerUIManager.adjustImages(this, mode);
    }
    
    /**
     * 현재 이미지 다운로드
     */
    downloadCurrentImage() {
        ViewerUIManager.downloadCurrentImage(this);
    }
    
    /**
     * 모든 이미지 다운로드
     */
    downloadAllImages() {
        ViewerUIManager.downloadAllImages(this);
    }
    
    /**
     * 뷰어 정리 및 종료
     */
    destroy() {
        ViewerCleanup.destroy(this);
    }
}