import { debugLog } from "../debug.js";

/**
 * 뷰어 내비게이션을 담당하는 클래스
 */
export class ViewerNavigationManager {
    /**
     * 이전 이미지로 이동
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static prevImage(core) {
        const newIndex = core.state.navigatePrev();
        ViewerNavigationManager.updateViewerForIndex(core, newIndex);
    }
    
    /**
     * 다음 이미지로 이동
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static nextImage(core) {
        const newIndex = core.state.navigateNext();
        ViewerNavigationManager.updateViewerForIndex(core, newIndex);
    }
    
    /**
     * 특정 이미지 선택
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     * @param {number} index - 선택할 이미지 인덱스
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    static selectImage(core, index, smooth = true) {
        debugLog(`selectImage 호출됨: index=${index}, smooth=${smooth}`);
        
        // 범위 확인
        if (index < 0 || index >= core.tweetInfo.imageUrls.length) {
            debugLog(`잘못된 인덱스: ${index}, 최대 값: ${core.tweetInfo.imageUrls.length - 1}`);
            return;
        }
        
        // 이미 진행 중인 선택 작업이 있는지 확인
        if (!core.state.canSelectImage()) {
            debugLog('이미지 선택 작업이 이미 진행 중입니다. 중복 요청 무시.');
            return;
        }
        
        // 선택 작업 시작
        core.state.startSelecting();
        
        try {
            // 이전 인덱스와 다른 경우에만 네비게이션 로직 적용
            if (index !== core.state.getCurrentIndex()) {
                core.state.selectImage(index);
                
                // UI 업데이트
                core.updateAllUIElements();
            }
            
            // 포커스 설정 - 인덱스 변경여부와 관계없이 항상 실행
            core.focus.focusCurrentImage(
                index, 
                smooth, 
                (idx) => core.imageLoader.forceLoadImage(
                    core.tweetInfo.imageUrls[idx], 
                    idx, 
                    {
                        selectImage: (i) => core.selectImage(i),
                        focusImage: (i) => core.focus.focusCurrentImage(i, true)
                    }
                )
            );
            
            // 이미지가 제대로 로드되었는지 확인
            const targetImage = core.imageContainer.querySelector(`.image-container[data-index="${index}"] img`);
            if (targetImage && (!targetImage.complete || !targetImage.naturalWidth)) {
                // 이미지가 아직 로드 중인 경우
                debugLog(`이미지 ${index}가 아직 로드 중입니다. 로드 완료 후 포커스합니다.`);
                targetImage.addEventListener('load', () => {
                    setTimeout(() => {
                        core.focus.focusCurrentImage(index, smooth);
                    }, 50);
                }, { once: true });
            }
        } catch (e) {
            console.error('이미지 선택 오류:', e);
        } finally {
            // 선택 작업 완료 플래그 해제
            core.state.endSelecting(200);
        }
    }
    
    /**
     * 첫 번째 이미지로 이동
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static goToFirst(core) {
        const newIndex = core.state.goToFirst();
        ViewerNavigationManager.selectImage(core, newIndex);
    }
    
    /**
     * 마지막 이미지로 이동
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     */
    static goToLast(core) {
        const newIndex = core.state.goToLast();
        ViewerNavigationManager.selectImage(core, newIndex);
    }
    
    /**
     * 현재 인덱스 업데이트
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     * @param {number} index - 새 인덱스
     */
    static updateCurrentIndex(core, index) {
        if (!core.state.updateIndex(index)) return;
        
        // UI 업데이트
        core.updateAllUIElements();
    }
    
    /**
     * 새 인덱스로 뷰어 업데이트
     * @param {ViewerCore} core - 뷰어 코어 인스턴스
     * @param {number} index - 새 인덱스
     */
    static updateViewerForIndex(core, index) {
        // 상태 업데이트
        core.state.updateIndex(index);
        
        // UI 업데이트
        core.updateAllUIElements();
        
        // 이미지 포커스
        core.focus.focusCurrentImage(
            index, 
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
    }
}