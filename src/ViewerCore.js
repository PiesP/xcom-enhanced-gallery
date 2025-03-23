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
        this.setupComponents();
        this.setupEventHandlers();
        
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
     * 컴포넌트 설정
     */
    setupComponents() {
        this.navigation = new ViewerNavigation(this.viewer);
        this.navigation.currentIndex = this.state.getCurrentIndex();
        
        this.download = new ViewerDownload(this.viewer);
        this.events = new ViewerEvents(this.viewer);
        
        // 핸들러 생성
        const handlers = {
            prevImage: () => this.prevImage(),
            nextImage: () => this.nextImage(),
            selectImage: (index, smooth = true) => this.selectImage(index, smooth),
            focusImage: (index) => this.focus.focusCurrentImage(
                index, 
                true, 
                (idx) => this.imageLoader.forceLoadImage(this.tweetInfo.imageUrls[idx], idx, handlers)
            ),
            adjustImages: (mode) => this.adjustImages(mode),
            downloadCurrentImage: () => this.downloadCurrentImage(),
            downloadAllImages: () => this.downloadAllImages(),
            close: () => this.destroy(),
            goToFirst: () => this.goToFirst(),
            goToLast: () => this.goToLast()
        };
        
        // 이미지 컨테이너 생성
        this.imageContainer = this.dom.createImageContainer();
        
        // 이미지 로더 설정
        this.imageLoader = new ViewerImageLoader(this.imageContainer);
        this.imageLoader.setDOMComponent(this.dom);
        this.imageLoader.setCurrentIndex(this.state.getCurrentIndex());
        
        // 포커스 관리자 설정
        this.focus = new ViewerFocus(this.viewer, this.imageContainer);
        
        // 이미지 조정 관리자 설정
        this.adjustment = new ImageAdjustment(this.imageContainer);
        
        // UI 컴포넌트 생성
        this.optionsBar = this.dom.createOptionsBar(
            this.tweetInfo, 
            this.state.getCurrentIndex(), 
            this.adjustment.getCurrentMode(), 
            handlers
        );
        
        this.thumbnailBar = this.dom.createThumbnailBar(
            this.tweetInfo, 
            this.state.getCurrentIndex(), 
            handlers
        );
        
        // 썸네일 관리자 설정
        this.thumbnailManager = new ThumbnailManager(this.thumbnailBar);
        this.thumbnailManager.setCurrentIndex(this.state.getCurrentIndex());
        this.thumbnailManager.setupThumbnailClickHandlers((index, smooth) => this.selectImage(index, smooth));
        
        // 현재 이미지 인디케이터 생성
        this.currentImageIndicator = this.dom.createCurrentImageIndicator(
            this.state.getCurrentIndex(), 
            this.tweetInfo.imageUrls.length
        );
        
        // 컴포넌트를 뷰어에 추가
        this.viewer.appendChild(this.optionsBar);
        this.viewer.appendChild(this.imageContainer);
        this.viewer.appendChild(this.thumbnailBar);
        this.viewer.appendChild(this.currentImageIndicator);
    }
    
    /**
     * 이벤트 핸들러 설정
     */
    setupEventHandlers() {
        // 키보드 및 마우스 네비게이션 설정
        const handlers = {
            prevImage: () => this.prevImage(),
            nextImage: () => this.nextImage(),
            close: () => this.destroy(),
            goToFirst: () => this.goToFirst(),
            goToLast: () => this.goToLast()
        };
        
        this.keyboardHandler = this.navigation.setupKeyboardNavigation(handlers);
        this.wheelHandler = this.navigation.setupMouseWheelNavigation(handlers);
        
        // UI 자동 숨김 설정
        this.events.setupUIAutoHide(this.optionsBar, this.thumbnailBar);
        
        // 배경 클릭 핸들러 설정
        this.events.setupBackgroundClickHandler(() => this.destroy());
        
        // 이미지 교차 관찰 설정
        const intersectionCallbacks = {
            isManualNavigating: () => this.state.isManualNavigating,
            getCurrentIndex: () => this.state.getCurrentIndex(),
            updateCurrentIndex: (index) => this.updateCurrentIndex(index)
        };
        
        const observer = this.events.setupIntersectionObserver(this.imageContainer, intersectionCallbacks);
        if (observer) {
            this.observers.push(observer);
        }
        
        // viewer-close 이벤트 리스너 추가
        this.viewer.addEventListener('viewer-close', () => this.destroy());
    }
    
    /**
     * 이전 이미지로 이동
     */
    prevImage() {
        const newIndex = this.state.navigatePrev();
        this.updateViewerForIndex(newIndex);
    }
    
    /**
     * 다음 이미지로 이동
     */
    nextImage() {
        const newIndex = this.state.navigateNext();
        this.updateViewerForIndex(newIndex);
    }
    
    /**
     * 특정 이미지 선택
     * @param {number} index - 선택할 이미지 인덱스
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    selectImage(index, smooth = true) {
        debugLog(`selectImage 호출됨: index=${index}, smooth=${smooth}`);
        
        // 범위 확인
        if (index < 0 || index >= this.tweetInfo.imageUrls.length) {
            debugLog(`잘못된 인덱스: ${index}, 최대 값: ${this.tweetInfo.imageUrls.length - 1}`);
            return;
        }
        
        // 이미 진행 중인 선택 작업이 있는지 확인
        if (!this.state.canSelectImage()) {
            debugLog('이미지 선택 작업이 이미 진행 중입니다. 중복 요청 무시.');
            return;
        }
        
        // 선택 작업 시작
        this.state.startSelecting();
        
        try {
            // 이전 인덱스와 다른 경우에만 네비게이션 로직 적용
            if (index !== this.state.getCurrentIndex()) {
                this.state.selectImage(index);
                
                // UI 업데이트
                this.updateAllUIElements();
            }
            
            // 포커스 설정 - 인덱스 변경여부와 관계없이 항상 실행
            this.focus.focusCurrentImage(
                index, 
                smooth, 
                (idx) => this.imageLoader.forceLoadImage(
                    this.tweetInfo.imageUrls[idx], 
                    idx, 
                    {
                        selectImage: (i) => this.selectImage(i),
                        focusImage: (i) => this.focus.focusCurrentImage(i, true)
                    }
                )
            );
            
            // 이미지가 제대로 로드되었는지 확인
            const targetImage = this.imageContainer.querySelector(`.image-container[data-index="${index}"] img`);
            if (targetImage && (!targetImage.complete || !targetImage.naturalWidth)) {
                // 이미지가 아직 로드 중인 경우
                debugLog(`이미지 ${index}가 아직 로드 중입니다. 로드 완료 후 포커스합니다.`);
                targetImage.addEventListener('load', () => {
                    setTimeout(() => {
                        this.focus.focusCurrentImage(index, smooth);
                    }, 50);
                }, { once: true });
            }
        } catch (e) {
            console.error('이미지 선택 오류:', e);
        } finally {
            // 선택 작업 완료 플래그 해제
            this.state.endSelecting(200);
        }
    }
    
    /**
     * 첫 번째 이미지로 이동
     */
    goToFirst() {
        const newIndex = this.state.goToFirst();
        this.selectImage(newIndex);
    }
    
    /**
     * 마지막 이미지로 이동
     */
    goToLast() {
        const newIndex = this.state.goToLast();
        this.selectImage(newIndex);
    }
    
    /**
     * 현재 인덱스 업데이트
     * @param {number} index - 새 인덱스
     */
    updateCurrentIndex(index) {
        if (!this.state.updateIndex(index)) return;
        
        // UI 업데이트
        this.updateAllUIElements();
    }
    
    /**
     * 모든 UI 요소 업데이트
     */
    updateAllUIElements() {
        const currentIndex = this.state.getCurrentIndex();
        
        // 드롭다운 메뉴 업데이트
        const imageSelect = document.getElementById('image-select');
        if (imageSelect) {
            imageSelect.value = currentIndex;
        }
        
        // 썸네일 바 업데이트
        this.thumbnailManager.setCurrentIndex(currentIndex);
        this.thumbnailManager.updateThumbnailFocus();
        
        // 현재 이미지 인디케이터 업데이트
        if (this.currentImageIndicator) {
            this.currentImageIndicator.textContent = translate('viewer.indicators.currentImage', { 
                current: currentIndex + 1, 
                total: this.tweetInfo.imageUrls.length 
            });
        }
        
        // 네비게이션 인덱스 업데이트
        if (this.navigation) {
            this.navigation.currentIndex = currentIndex;
        }
    }
    
    /**
     * 새 인덱스로 뷰어 업데이트
     * @param {number} index - 새 인덱스
     */
    updateViewerForIndex(index) {
        // 상태 업데이트
        this.state.updateIndex(index);
        
        // UI 업데이트
        this.updateAllUIElements();
        
        // 이미지 포커스
        this.focus.focusCurrentImage(
            index, 
            true, 
            (idx) => this.imageLoader.forceLoadImage(
                this.tweetInfo.imageUrls[idx], 
                idx, 
                {
                    selectImage: (i) => this.selectImage(i),
                    focusImage: (i) => this.focus.focusCurrentImage(i, true)
                }
            )
        );
    }
    
    /**
     * 이미지 크기 조정
     * @param {string} mode - 조정 모드
     */
    adjustImages(mode) {
        this.adjustment.adjustImages(mode, () => {
            this.focus.focusCurrentImage(
                this.state.getCurrentIndex(), 
                true, 
                (idx) => this.imageLoader.forceLoadImage(
                    this.tweetInfo.imageUrls[idx], 
                    idx, 
                    {
                        selectImage: (i) => this.selectImage(i),
                        focusImage: (i) => this.focus.focusCurrentImage(i, true)
                    }
                )
            );
        });
    }
    
    /**
     * 현재 이미지 다운로드
     */
    downloadCurrentImage() {
        this.download.downloadCurrentImage(this.tweetInfo, this.state.getCurrentIndex());
    }
    
    /**
     * 모든 이미지 다운로드
     */
    downloadAllImages() {
        this.download.downloadAllImages(this.tweetInfo);
    }
    
    /**
     * 뷰어 정리 및 종료
     */
    destroy() {
        if (!this.viewer) return;
        
        // 이벤트 정리
        if (this.events) {
            this.events.cleanupEventListeners();
        }
        
        // 키보드 이벤트 정리
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        
        // 마우스 휠 이벤트 정리
        if (this.wheelHandler && this.viewer) {
            this.viewer.removeEventListener('wheel', this.wheelHandler);
        }
        
        // 옵저버 정리
        this.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        
        // 포커스 정리
        if (this.focus) {
            this.focus.cleanup();
        }
        
        // 상태 정리
        if (this.state) {
            this.state.cleanup();
        }
        
        // DOM 정리
        if (this.viewer && this.viewer.parentNode) {
            this.viewer.parentNode.removeChild(this.viewer);
        }
        
        // 상태 초기화
        this.viewer = null;
        this.optionsBar = null;
        this.thumbnailBar = null;
        this.imageContainer = null;
        this.currentImageIndicator = null;
        this.observers = [];
        
        // 스크롤 위치 복원
        document.body.style.overflow = '';
        window.scrollTo(0, this.savedScrollPos);
    }
}