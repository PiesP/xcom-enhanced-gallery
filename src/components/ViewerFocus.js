import { debugLog } from "../debug.js";

/**
 * 이미지 포커스 및 스크롤 관리 클래스
 */
export class ViewerFocus {
    constructor(viewer, imageContainer) {
        this.viewer = viewer;
        this.imageContainer = imageContainer;
        this._isScrolling = false;
        this._scrollAnimationFrame = null;
    }
    
    /**
     * 현재 이미지에 포커스
     * @param {number} currentIndex - 현재 이미지 인덱스
     * @param {boolean} smooth - 부드러운 스크롤 여부
     * @param {Function} loadImageCallback - 이미지 로드 콜백 함수
     */
    focusCurrentImage(currentIndex, smooth = false, loadImageCallback = null) {
        try {
            debugLog(`focusCurrentImage 호출됨: currentIndex=${currentIndex}, smooth=${smooth}`);
            
            if (!this.imageContainer) {
                debugLog('이미지 컨테이너가 없습니다');
                return;
            }
            
            // 기존 이미지에서 강조 효과 제거
            const allContainers = this.imageContainer.querySelectorAll('.image-container');
            allContainers.forEach(container => {
                const containerIndex = parseInt(container.dataset.index || '-1');
                if (containerIndex !== currentIndex) {
                    container.style.boxShadow = 'none';
                    container.style.transform = 'scale(1)';
                }
            });
            
            // 현재 이미지 요소 찾기
            const targetElements = this.imageContainer.querySelectorAll(`.image-container[data-index="${currentIndex}"]`);
            const targetElement = targetElements.length > 0 ? targetElements[0] : null;
            debugLog('대상 요소:', targetElement ? '찾음' : '없음');
            
            if (!targetElement) {
                // 현재 이미지 요소가 없으면 해당 이미지 로드
                debugLog(`이미지 로드 시도: index=${currentIndex}`);
                
                if (loadImageCallback) {
                    loadImageCallback(currentIndex);
                }
                
                // 로드 후 재시도 (300ms 후 한번 더)
                setTimeout(() => {
                    const newTargets = this.imageContainer.querySelectorAll(`.image-container[data-index="${currentIndex}"]`);
                    const newTarget = newTargets.length > 0 ? newTargets[0] : null;
                    debugLog('재시도 후 대상 요소:', newTarget ? '찾음' : '없음');
                    
                    if (newTarget) {
                        this.scrollToImageElement(newTarget, smooth);
                        this.highlightCurrentImage(newTarget);
                    }
                }, 300);
                
                return;
            }
            
            // 화면 중앙 스크롤
            this.scrollToImageElement(targetElement, smooth);
            
            // 현재 이미지 강조 표시
            this.highlightCurrentImage(targetElement);
            
        } catch (e) {
            console.error("focusCurrentImage 오류:", e);
        }
    }
    
    /**
     * 현재 이미지 강조 표시
     * @param {HTMLElement} container - 이미지 컨테이너 요소
     */
    highlightCurrentImage(container) {
        if (!container) return;
        
        // 현재 이미지 강조 효과
        container.style.boxShadow = '0 0 15px rgba(29, 161, 242, 0.7)';
        container.style.transform = 'scale(1.02)';
        
        // 애니메이션 효과 - 보다 자연스럽게
        setTimeout(() => {
            container.style.boxShadow = '0 0 10px rgba(29, 161, 242, 0.4)';
            container.style.transform = 'scale(1.01)';
        }, 300);
    }
    
    /**
     * 지정된 이미지 요소로 스크롤
     * @param {HTMLElement} element - 이미지 요소
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    scrollToImageElement(element, smooth = true) {
        if (!element || !this.viewer) {
            debugLog('scrollToImageElement: 원소나 뷰어가 없습니다');
            return;
        }
        
        // 연속 스크롤 중인지 확인
        if (this._isScrolling) {
            // 진행 중인 스크롤 애니메이션 취소
            if (this._scrollAnimationFrame) {
                cancelAnimationFrame(this._scrollAnimationFrame);
                this._scrollAnimationFrame = null;
            }
        }
        
        this._isScrolling = true;
        
        try {
            // 뷰어 크기 및 스크롤 위치 계산
            const viewerRect = this.viewer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            // 화면 중앙에 이미지가 오도록 위치 계산
            const targetPosition = elementRect.top + this.viewer.scrollTop - viewerRect.top;
            const offset = (viewerRect.height - elementRect.height) / 2;
            const scrollTarget = Math.max(0, targetPosition - offset);
            
            debugLog('스크롤 정보:', {
                viewerHeight: viewerRect.height,
                elementHeight: elementRect.height,
                elementTop: elementRect.top,
                viewerTop: viewerRect.top,
                viewerScrollTop: this.viewer.scrollTop,
                targetPosition,
                offset,
                scrollTarget
            });
            
            if (!smooth) {
                // 즉시 스크롤
                this.viewer.scrollTo({
                    top: scrollTarget,
                    behavior: 'auto'
                });
                this._isScrolling = false;
                return;
            }

            // 부드러운 스크롤 직접 구현
            const startPosition = this.viewer.scrollTop;
            const distance = scrollTarget - startPosition;
            const duration = 400; // 스크롤 애니메이션 시간 (ms)
            let startTime;
            
            // 스크롤 애니메이션 함수
            const animateScroll = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsedTime = timestamp - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                // easeInOutCubic 완화 함수 적용
                const easedProgress = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                const currentPosition = startPosition + distance * easedProgress;
                this.viewer.scrollTop = currentPosition;
                
                if (progress < 1) {
                    // 애니메이션 계속
                    this._scrollAnimationFrame = requestAnimationFrame(animateScroll);
                } else {
                    // 애니메이션 완료
                    this._isScrolling = false;
                    this._scrollAnimationFrame = null;
                }
            };
            
            // 애니메이션 시작
            this._scrollAnimationFrame = requestAnimationFrame(animateScroll);
            
        } catch (e) {
            console.error('scrollToImageElement 오류:', e);
            this._isScrolling = false;
            
            // 오류 발생 시 단순한 스크롤로 폴백
            try {
                element.scrollIntoView({
                    behavior: smooth ? 'smooth' : 'auto',
                    block: 'center'
                });
            } catch (e2) {
                console.error('scrollIntoView 도 실패:', e2);
            }
        }
    }
    
    /**
     * 뷰어 정리
     */
    cleanup() {
        // 진행 중인 애니메이션 취소
        if (this._scrollAnimationFrame) {
            cancelAnimationFrame(this._scrollAnimationFrame);
            this._scrollAnimationFrame = null;
        }
        
        this._isScrolling = false;
        this.viewer = null;
        this.imageContainer = null;
    }
}