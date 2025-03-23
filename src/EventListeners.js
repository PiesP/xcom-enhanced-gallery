import { ImageViewer } from "./ImageViewer.js";
import { URLManager } from "./URLManager.js";
import { CONFIG } from "./config.js";
import { debugLog } from "./debug.js";

/**
 * 이벤트 리스너 관리 클래스
 */
export class EventListeners {
    /**
     * 이미지 클릭 이벤트 핸들러 설정
     */
    static setupImageClickHandler() {
        document.addEventListener("click", EventListeners.imageClickHandler, { 
            capture: true, 
            passive: false 
        });
        
        debugLog('이미지 클릭 이벤트 핸들러 설정 완료');
    }
    
    /**
     * 이미지 클릭 이벤트 핸들러
     * @param {Event} event - 클릭 이벤트
     */
    static imageClickHandler(event) {
        // 이미지 요소가 있는지 확인
        const imageElement = event.target.closest('img[src*="pbs.twimg.com/media/"]');
        if (!imageElement) return;
        
        const isInMediaTab = URLManager.isMediaTab();
        debugLog(`이미지 클릭 감지 - 미디어란: ${isInMediaTab}`);
        
        // 미디어란이고 미디어란 지원이 비활성화된 경우 기본 동작 허용
        if (isInMediaTab && !CONFIG.enableMediaTab) {
            debugLog('미디어란 지원이 비활성화되어 있습니다. 기본 동작 허용');
            return;
        }
        
        // 미디어란인 경우 상위 요소 탐색 방식 변경
        let containerElement;
        if (isInMediaTab) {
            // 미디어란에서는 다른 컨테이너 사용
            // 여러 가지 선택자를 시도하여 바른 컨테이너를 찾음
            containerElement = event.target.closest('[data-testid="cellInnerDiv"]') || 
                               event.target.closest('[role="link"]') ||
                               event.target.closest('div[tabindex="0"]');

            // 컨테이너를 찾지 못한 경우, 클릭한 이미지를 포함하는 가장 가까운 대용 컨테이너 사용
            if (!containerElement) {
                const parentNode = imageElement.parentNode;
                if (parentNode && parentNode.parentNode) {
                    containerElement = parentNode.parentNode;
                } else {
                    containerElement = parentNode || imageElement;
                }
            }
            
            debugLog('미디어란 컨테이너 요소:', containerElement);
        } else {
            // 일반 타임라인에서는 article 요소 사용
            containerElement = event.target.closest("article");
            debugLog('일반 컨테이너 요소:', containerElement);
        }
        
        if (!containerElement) {
            debugLog('컨테이너 요소를 찾을 수 없습니다');
            return;
        }
        
        // 이벤트 방지
        event.preventDefault();
        event.stopPropagation();
        
        // 이미지 뷰어 초기화 - 클릭된 이미지 정보 전달
        const viewer = new ImageViewer();
        viewer.init(containerElement, imageElement.src);
    }
    
    /**
     * 터치 및 마우스 이벤트 핸들러 설정
     */
    static setupTouchAndMouseHandlers() {
        // 마우스 다운 및 터치 시작 이벤트 캡처
        document.addEventListener("pointerdown", (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            
            const imageElement = event.target.closest('img[src*="pbs.twimg.com/media/"]');
            if (imageElement) {
                // 미디어란에서도 이미지 클릭 방지
                if (URLManager.isMediaTab() && CONFIG.enableMediaTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    debugLog('미디어란에서 이미지 클릭 방지 성공');
                } else {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }, { capture: true, passive: false });
        
        // 터치 시작 이벤트도 캡처 (모바일 지원)
        document.addEventListener("touchstart", (event) => {
            const touch = event.touches[0];
            if (!touch) return;
            
            // 터치 위치에서 요소 찾기
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.tagName === 'IMG' && element.src && element.src.includes('pbs.twimg.com/media/')) {
                if (URLManager.isMediaTab() && CONFIG.enableMediaTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }
            }
        }, { capture: true, passive: false });
        
        debugLog('터치 및 마우스 이벤트 핸들러 설정 완료');
    }
    
    /**
     * 트위터의 이미지 확대 기능 방지 - 강화 버전
     */
    static setupEventPreventionReinforcement() {
        const reinforcementListener = (event) => {
            if ('button' in event && event.button !== 0) return;
            
            // 뷰어 내부 요소는 처리하지 않음
            if (event.target.closest('#xcom-image-viewer')) {
                return;
            }
            
            // 이미지 뷰어 내부 요소인지 확인
            if (event.target.classList && 
                (event.target.classList.contains('xcom-viewer-img') || 
                 event.target.classList.contains('xcom-viewer-container') || 
                 event.target.classList.contains('xcom-thumbnail'))) {
                return;
            }
            
            // 이미지 요소 찾기 - 간접적인 이미지 클릭도 캡처
            const imgElement = event.target.tagName === 'IMG' ? 
                              event.target : 
                              event.target.querySelector('img[src*="pbs.twimg.com/media/"]');
            
            if (imgElement && imgElement.src && imgElement.src.includes('pbs.twimg.com/media/')) {
                const isInMediaTab = URLManager.isMediaTab();
                debugLog(`강화 이미지 착취 - 미디어란: ${isInMediaTab}`, imgElement);
                
                // 미디어란이고 미디어란 지원이 활성화된 경우
                if (isInMediaTab && CONFIG.enableMediaTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    
                    // 이미지 클릭 핸들러 직접 호출
                    setTimeout(() => {
                        EventListeners.imageClickHandler({
                            target: imgElement,
                            preventDefault: () => {},
                            stopPropagation: () => {}
                        });
                    }, 0);
                } else {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        };
        
        // 다양한 이벤트에 리스너 추가
        document.body.addEventListener('click', reinforcementListener, {
            capture: true,
            passive: false
        });
        
        document.body.addEventListener('mousedown', reinforcementListener, {
            capture: true,
            passive: false
        });
        
        document.body.addEventListener('touchstart', reinforcementListener, {
            capture: true,
            passive: false
        });
        
        debugLog('이벤트 방지 강화 설정 완료');
    }
}