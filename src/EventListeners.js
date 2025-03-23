import { ImageViewer } from "./ImageViewer.js";
import { URLManager } from "./URLManager.js";
import { CONFIG } from "./config.js";
import { debugLog } from "./debug.js";
import { LanguageSelector } from "./components/LanguageSelector.js";
import { Utils } from "./Utils.js";
import { ThemeManager } from "./theme/ThemeManager.js";
import { LayoutManager } from "./theme/LayoutManager.js";

/**
 * 이벤트 리스너 관리 클래스
 */
export class EventListeners {
    /**
     * 레이아웃 연결 요소
     */
    static layoutConnectors = {
        // 언어 선택기 연결 요소
        languageSelectorContainer: null,
        // 테마 토글 버튼
        themeToggleBtn: null,
        // 레이아웃 토글 버튼
        layoutToggleBtn: null,
        // 전역 제어 패널
        controlPanel: null
    };
    
    /**
     * 전체 UI 초기화 - 추가 UI 기능
     */
    static setupGlobalUI() {
        // 전역 제어 패널 생성
        EventListeners.setupControlPanel();
        
        // 단축키 설정
        EventListeners.setupGlobalKeyboardShortcuts();
        
        debugLog('전역 UI 초기화 완료');
    }
    
    /**
     * 전역 제어 패널 설정
     */
    static setupControlPanel() {
        // 기존 패널 제거
        if (EventListeners.layoutConnectors.controlPanel) {
            try {
                EventListeners.layoutConnectors.controlPanel.remove();
            } catch (e) {
                console.error('제어 패널 요소 삭제 오류:', e);
            }
        }
        
        const { bgColor, textColor } = Utils.getUserUIColor();
        
        // 제어 패널 컨테이너 생성
        const panel = document.createElement('div');
        panel.className = 'xcom-control-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 20px;
            z-index: 9000;
            display: flex;
            align-items: center;
            background: var(--xcom-bg-secondary, ${Utils.addAlpha(bgColor, 0.85)});
            color: var(--xcom-text-primary, ${textColor});
            padding: 4px 8px;
            border-radius: var(--xcom-radius-md, 8px);
            box-shadow: var(--xcom-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
            border: 1px solid var(--xcom-border-light, #e1e8ed);
            gap: 8px;
        `;
        
        // 테마 토글 버튼 생성
        const themeToggleBtn = ThemeManager.createThemeToggle();
        EventListeners.layoutConnectors.themeToggleBtn = themeToggleBtn;
        
        // 레이아웃 토글 버튼 생성
        const layoutToggleBtn = LayoutManager.createLayoutToggle();
        EventListeners.layoutConnectors.layoutToggleBtn = layoutToggleBtn;
        
        // 언어 선택기 생성
        const languageSelector = LanguageSelector.createLanguageDropdown((newLocale) => {
            window.location.reload();
        });
        EventListeners.layoutConnectors.languageSelectorContainer = languageSelector;
        
        // 로고/타이틀 생성
        const logo = document.createElement('div');
        logo.className = 'xcom-logo';
        logo.innerHTML = '<i class="fa-solid fa-image" aria-hidden="true"></i>';
        logo.style.cssText = `
            font-size: 18px;
            color: var(--xcom-accent-primary, #1da1f2);
            margin-right: 4px;
        `;
        
        // 패널에 요소 추가
        panel.appendChild(logo);
        panel.appendChild(themeToggleBtn);
        panel.appendChild(layoutToggleBtn);
        panel.appendChild(languageSelector);
        
        // 문서에 패널 추가
        document.body.appendChild(panel);
        
        // 패널 참조 저장
        EventListeners.layoutConnectors.controlPanel = panel;
        
        // 글로벌 스타일 추가 (필요한 경우)
        if (!document.getElementById('xcom-global-styles')) {
            const style = document.createElement('style');
            style.id = 'xcom-global-styles';
            style.textContent = `
                .xcom-control-panel {
                    transition: opacity 0.3s ease;
                }
                .xcom-control-panel:hover {
                    opacity: 1;
                }
                .xcom-control-panel.minimized {
                    opacity: 0.3;
                }
                @media (max-width: 768px) {
                    .xcom-control-panel {
                        top: auto;
                        bottom: 10px;
                        right: 10px;
                        padding: 4px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 5초 후 투명도 줄이기
        setTimeout(() => {
            panel.classList.add('minimized');
        }, 5000);
        
        // 마우스 오버 시 투명도 복원
        panel.addEventListener('mouseenter', () => {
            panel.classList.remove('minimized');
        });
        
        // 마우스 아웃 시 투명도 줄이기
        panel.addEventListener('mouseleave', () => {
            setTimeout(() => {
                panel.classList.add('minimized');
            }, 1000);
        });
        
        debugLog('전역 제어 패널 설정 완료');
    }
    
    /**
     * 전역 키보드 단축키 설정
     */
    static setupGlobalKeyboardShortcuts() {
        // 기존 리스너 제거 (중복 방지)
        if (EventListeners._globalKeyHandler) {
            document.removeEventListener('keydown', EventListeners._globalKeyHandler);
        }
        
        // 새 키보드 이벤트 리스너
        EventListeners._globalKeyHandler = (event) => {
            // 입력 요소에서는 단축키 비활성화
            if (event.target.matches('input, textarea, select, [contenteditable="true"]')) {
                return;
            }
            
            // Alt + T: 테마 전환
            if (event.altKey && event.key === 't') {
                event.preventDefault();
                ThemeManager.cycleTheme();
            }
            
            // Alt + L: 레이아웃 전환
            if (event.altKey && event.key === 'l') {
                event.preventDefault();
                const newMode = LayoutManager.getCurrentMode() === LayoutManager.LAYOUT_MODES.COMPACT
                    ? LayoutManager.LAYOUT_MODES.COMFORTABLE
                    : LayoutManager.LAYOUT_MODES.COMPACT;
                LayoutManager.setLayoutMode(newMode);
            }
        };
        
        // 이벤트 리스너 등록
        document.addEventListener('keydown', EventListeners._globalKeyHandler);
        
        debugLog('전역 키보드 단축키 설정 완료');
    }
    
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
            
            // 제어 패널 내부 요소인지 확인
            if (event.target.closest('.xcom-control-panel')) {
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