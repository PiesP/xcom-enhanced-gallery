import { Utils } from "../Utils.js";
import { debugLog } from "../debug.js";

/**
 * 뷰어 상태 관리 클래스
 */
export class ViewerState {
    constructor() {
        this.currentIndex = 0;
        this.initialImageIndex = 0;
        this.totalImages = 0;
        this._isSelecting = false;
        this._lastActionTime = 0;
        this.isManualNavigating = false;
        this.navigationTimeout = null;
    }
    
    /**
     * 상태 초기화
     * @param {number} initialIndex - 초기 이미지 인덱스
     * @param {number} totalCount - 전체 이미지 수
     */
    init(initialIndex, totalCount) {
        this.currentIndex = initialIndex;
        this.initialImageIndex = initialIndex;
        this.totalImages = totalCount;
        debugLog(`뷰어 상태 초기화: currentIndex=${initialIndex}, totalImages=${totalCount}`);
    }
    
    /**
     * 현재 인덱스 반환
     * @returns {number} 현재 이미지 인덱스
     */
    getCurrentIndex() {
        return this.currentIndex;
    }
    
    /**
     * 이미지 선택 가능 상태 확인
     * @returns {boolean} 이미지 선택 가능 여부
     */
    canSelectImage() {
        return !this._isSelecting;
    }
    
    /**
     * 이미지 선택 진행 상태 설정
     * @param {boolean} isSelecting - 이미지 선택 진행 중 여부
     */
    setSelectingState(isSelecting) {
        this._isSelecting = isSelecting;
    }
    
    /**
     * 선택 이벤트 시작
     */
    startSelecting() {
        this._isSelecting = true;
    }
    
    /**
     * 선택 이벤트 종료
     * @param {number} delay - 선택 종료 후 대기 시간 (ms)
     */
    endSelecting(delay = 200) {
        setTimeout(() => {
            this._isSelecting = false;
        }, delay);
    }
    
    /**
     * 현재 인덱스 업데이트
     * @param {number} index - 새 인덱스
     * @returns {boolean} 인덱스가 변경되었는지 여부
     */
    updateIndex(index) {
        // 범위 검사
        if (index < 0 || index >= this.totalImages) {
            debugLog(`잘못된 인덱스 업데이트 시도: ${index}, 유효 범위: 0-${this.totalImages - 1}`);
            return false;
        }
        
        const changed = index !== this.currentIndex;
        this.currentIndex = index;
        
        if (changed) {
            this._lastActionTime = Date.now();
            debugLog(`인덱스 업데이트: ${index}`);
        }
        
        return changed;
    }
    
    /**
     * 이전 이미지로 이동
     * @returns {number} 새 인덱스
     */
    navigatePrev() {
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) newIndex = this.totalImages - 1;
        
        this.currentIndex = newIndex;
        this.setupNavigationTimeout();
        
        return newIndex;
    }
    
    /**
     * 다음 이미지로 이동
     * @returns {number} 새 인덱스
     */
    navigateNext() {
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        let newIndex = this.currentIndex + 1;
        if (newIndex >= this.totalImages) newIndex = 0;
        
        this.currentIndex = newIndex;
        this.setupNavigationTimeout();
        
        return newIndex;
    }
    
    /**
     * 첫 번째 이미지로 이동
     * @returns {number} 첫 번째 이미지 인덱스(0)
     */
    goToFirst() {
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        this.currentIndex = 0;
        this.setupNavigationTimeout();
        
        return this.currentIndex;
    }
    
    /**
     * 마지막 이미지로 이동
     * @returns {number} 마지막 이미지 인덱스
     */
    goToLast() {
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        this.currentIndex = this.totalImages - 1;
        this.setupNavigationTimeout();
        
        return this.currentIndex;
    }
    
    /**
     * 특정 이미지 선택
     * @param {number} index - 선택할 이미지 인덱스
     * @returns {number} 선택된 이미지 인덱스
     */
    selectImage(index) {
        // 범위 체크
        if (index < 0 || index >= this.totalImages) {
            debugLog(`잘못된 인덱스 선택 시도: ${index}`);
            return this.currentIndex;
        }
        
        this.isManualNavigating = true;
        this.clearNavigationTimeout();
        
        this.currentIndex = index;
        this.setupNavigationTimeout();
        
        return index;
    }
    
    /**
     * 내비게이션 타임아웃 설정
     */
    setupNavigationTimeout() {
        this.navigationTimeout = setTimeout(() => {
            this.isManualNavigating = false;
        }, 800);
    }
    
    /**
     * 내비게이션 타임아웃 정리
     */
    clearNavigationTimeout() {
        if (this.navigationTimeout) {
            clearTimeout(this.navigationTimeout);
            this.navigationTimeout = null;
        }
    }
    
    /**
     * 뷰어 상태 정리
     */
    cleanup() {
        this.clearNavigationTimeout();
        this.isManualNavigating = false;
        this._isSelecting = false;
    }
}