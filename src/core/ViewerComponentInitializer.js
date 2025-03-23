import { debugLog } from "../debug.js";

/**
 * 뷰어 컴포넌트 초기화를 담당하는 클래스
 */
export class ViewerComponentInitializer {
    /**
     * 뷰어 컴포넌트 설정
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static setupComponents(core) {
        core.navigation = new core.deps.ViewerNavigation(core.viewer);
        core.navigation.currentIndex = core.state.getCurrentIndex();
        
        core.download = new core.deps.ViewerDownload(core.viewer);
        core.events = new core.deps.ViewerEvents(core.viewer);
        
        // 핸들러 생성
        const handlers = {
            prevImage: () => core.prevImage(),
            nextImage: () => core.nextImage(),
            selectImage: (index, smooth = true) => core.selectImage(index, smooth),
            focusImage: (index) => core.focus.focusCurrentImage(
                index, 
                true, 
                (idx) => core.imageLoader.forceLoadImage(
                    core.tweetInfo.imageUrls[idx], 
                    idx, 
                    handlers
                )
            ),
            adjustImages: (mode) => core.adjustImages(mode),
            downloadCurrentImage: () => core.downloadCurrentImage(),
            downloadAllImages: () => core.downloadAllImages(),
            close: () => core.destroy(),
            goToFirst: () => core.goToFirst(),
            goToLast: () => core.goToLast()
        };
        
        // 이미지 컨테이너 생성
        core.imageContainer = core.dom.createImageContainer();
        
        // 이미지 로더 설정
        core.imageLoader = new core.deps.ViewerImageLoader(core.imageContainer);
        core.imageLoader.setDOMComponent(core.dom);
        core.imageLoader.setCurrentIndex(core.state.getCurrentIndex());
        
        // 포커스 관리자 설정
        core.focus = new core.deps.ViewerFocus(core.viewer, core.imageContainer);
        
        // 이미지 조정 관리자 설정
        core.adjustment = new core.deps.ImageAdjustment(core.imageContainer);
        
        // UI 컴포넌트 생성
        core.optionsBar = core.dom.createOptionsBar(
            core.tweetInfo, 
            core.state.getCurrentIndex(), 
            core.adjustment.getCurrentMode(), 
            handlers
        );
        
        core.thumbnailBar = core.dom.createThumbnailBar(
            core.tweetInfo, 
            core.state.getCurrentIndex(), 
            handlers
        );
        
        // 썸네일 관리자 설정
        core.thumbnailManager = new core.deps.ThumbnailManager(core.thumbnailBar);
        core.thumbnailManager.setCurrentIndex(core.state.getCurrentIndex());
        core.thumbnailManager.setupThumbnailClickHandlers((index, smooth) => core.selectImage(index, smooth));
        
        // 현재 이미지 인디케이터 생성
        core.currentImageIndicator = core.dom.createCurrentImageIndicator(
            core.state.getCurrentIndex(), 
            core.tweetInfo.imageUrls.length
        );
        
        // 컴포넌트를 뷰어에 추가
        core.viewer.appendChild(core.optionsBar);
        core.viewer.appendChild(core.imageContainer);
        core.viewer.appendChild(core.thumbnailBar);
        core.viewer.appendChild(core.currentImageIndicator);
    }
    
    /**
     * 이벤트 핸들러 설정
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static setupEventHandlers(core) {
        // 키보드 및 마우스 네비게이션 설정
        const handlers = {
            prevImage: () => core.prevImage(),
            nextImage: () => core.nextImage(),
            close: () => core.destroy(),
            goToFirst: () => core.goToFirst(),
            goToLast: () => core.goToLast()
        };
        
        core.keyboardHandler = core.navigation.setupKeyboardNavigation(handlers);
        core.wheelHandler = core.navigation.setupMouseWheelNavigation(handlers);
        
        // UI 자동 숨김 설정
        core.events.setupUIAutoHide(core.optionsBar, core.thumbnailBar);
        
        // 배경 클릭 핸들러 설정
        core.events.setupBackgroundClickHandler(() => core.destroy());
        
        // 이미지 교차 관찰 설정
        const intersectionCallbacks = {
            isManualNavigating: () => core.state.isManualNavigating,
            getCurrentIndex: () => core.state.getCurrentIndex(),
            updateCurrentIndex: (index) => core.updateCurrentIndex(index)
        };
        
        const observer = core.events.setupIntersectionObserver(core.imageContainer, intersectionCallbacks);
        if (observer) {
            core.observers.push(observer);
        }
        
        // viewer-close 이벤트 리스너 추가
        core.viewer.addEventListener('viewer-close', () => core.destroy());
    }
}