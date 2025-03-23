/**
 * 뷰어 정리 담당 클래스
 */
export class ViewerCleanup {
    /**
     * 뷰어 정리 및 종료
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static destroy(core) {
        if (!core.viewer) return;
        
        // 이벤트 정리
        if (core.events) {
            core.events.cleanupEventListeners();
        }
        
        // 키보드 이벤트 정리
        if (core.keyboardHandler) {
            document.removeEventListener('keydown', core.keyboardHandler);
        }
        
        // 마우스 휠 이벤트 정리
        if (core.wheelHandler && core.viewer) {
            core.viewer.removeEventListener('wheel', core.wheelHandler);
        }
        
        // 옵저버 정리
        core.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        
        // 포커스 정리
        if (core.focus) {
            core.focus.cleanup();
        }
        
        // 상태 정리
        if (core.state) {
            core.state.cleanup();
        }
        
        // DOM 정리
        if (core.viewer && core.viewer.parentNode) {
            core.viewer.parentNode.removeChild(core.viewer);
        }
        
        // 상태 초기화
        core.viewer = null;
        core.optionsBar = null;
        core.thumbnailBar = null;
        core.imageContainer = null;
        core.currentImageIndicator = null;
        core.observers = [];
        
        // 스크롤 위치 복원
        document.body.style.overflow = '';
        window.scrollTo(0, core.savedScrollPos);
    }
}