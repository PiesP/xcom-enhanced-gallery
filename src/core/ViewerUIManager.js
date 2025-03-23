import { translate } from "../I18N/index.js";

/**
 * 뷰어 UI 관리를 담당하는 클래스
 */
export class ViewerUIManager {
    /**
     * 모든 UI 요소 업데이트
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static updateAllUIElements(core) {
        const currentIndex = core.state.getCurrentIndex();
        
        // 드롭다운 메뉴 업데이트
        const imageSelect = document.getElementById('image-select');
        if (imageSelect) {
            imageSelect.value = currentIndex;
        }
        
        // 썸네일 바 업데이트
        core.thumbnailManager.setCurrentIndex(currentIndex);
        core.thumbnailManager.updateThumbnailFocus();
        
        // 현재 이미지 인디케이터 업데이트
        if (core.currentImageIndicator) {
            core.currentImageIndicator.textContent = translate('viewer.indicators.currentImage', { 
                current: currentIndex + 1, 
                total: core.tweetInfo.imageUrls.length 
            });
        }
        
        // 네비게이션 인덱스 업데이트
        if (core.navigation) {
            core.navigation.currentIndex = currentIndex;
        }
    }
    
    /**
     * 이미지 크기 조정
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     * @param {string} mode - 조정 모드
     */
    static adjustImages(core, mode) {
        core.adjustment.adjustImages(mode, () => {
            core.focus.focusCurrentImage(
                core.state.getCurrentIndex(), 
                true, 
                (idx) => core.imageLoader.forceLoadImage(
                    core.tweetInfo.imageUrls[idx], 
                    idx, 
                    {
                        selectImage: (i) => core.selectImage(i),
                        focusImage: (i) => core.focus.focusCurrentImage(i, true)
                    }
                )
            );
        });
    }
    
    /**
     * 현재 이미지 다운로드
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static downloadCurrentImage(core) {
        core.download.downloadCurrentImage(core.tweetInfo, core.state.getCurrentIndex());
    }
    
    /**
     * 모든 이미지 다운로드
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static downloadAllImages(core) {
        core.download.downloadAllImages(core.tweetInfo);
    }
}