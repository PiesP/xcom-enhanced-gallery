import { Utils } from "./Utils.js";
import { TweetInfo } from "./TweetInfo.js";
import { translate } from "./I18N.js";
import { STYLE_ID, CSS } from "./CSS.js";
import { ViewerDOM } from "./components/ViewerDOM.js";
import { ViewerNavigation } from "./components/ViewerNavigation.js";
import { ViewerDownload } from "./components/ViewerDownload.js";
import { ViewerEvents } from "./components/ViewerEvents.js";

export class ImageViewer {
    constructor() {
        this.currentIndex = 0;
        this.initialImageIndex = 0;  // 클릭한 처음 이미지의 인덱스
        this.tweetInfo = new TweetInfo();
        this.viewer = null;
        this.optionsBar = null;
        this.thumbnailBar = null;
        this.imageContainer = null;
        this.currentImageIndicator = null;
        this.currentAdjustMode = Utils.getLocalStorageItem('adjustMode', 'window');
        this.savedScrollPos = 0;
        this.lazyLoadedImages = new Set();
        this.debugMode = true;
        
        // 컴포넌트 생성
        this.dom = null;
        this.navigation = null;
        this.download = null;
        this.events = null;
        
        this.observers = [];
        this.keyboardHandler = null;
        this.wheelHandler = null;
        
        // 추가 상태 변수
        this._isScrolling = false;           // 스크롤 진행 중 플래그
        this._isSelecting = false;           // 이미지 선택 진행 중 플래그
        this._scrollAnimationFrame = null;   // requestAnimationFrame 참조 저장
        this._lastActionTime = 0;            // 마지막 작업 시간 추적
        
        // 디바운스 처리된 메서드들을 미리 생성
        this._debouncedFocusImage = Utils.debounce((index) => {
            this.focusCurrentImage(true);
        }, 100);
    }

    init(tweetElement, clickedImageSrc = null) {
        if (!this.tweetInfo.extractFromTweet(tweetElement)) return;
        
        this.destroy();
        this.savedScrollPos = window.pageYOffset || document.documentElement.scrollTop;
        document.body.style.overflow = 'hidden';
        
        Utils.createStyleSheet(STYLE_ID, CSS);
        
        // 클릭한 이미지의 인덱스 찾기
        if (clickedImageSrc) {
            const originalSrc = clickedImageSrc.replace(/&name=\w+/, '&name=orig');
            const clickedIndex = this.tweetInfo.imageUrls.findIndex(url => url === originalSrc);
            if (clickedIndex !== -1) {
                this.currentIndex = clickedIndex;
                this.initialImageIndex = clickedIndex;
                console.log(`클릭한 이미지 인덱스: ${clickedIndex}`);
            }
        }
        
        this.createViewer();
        this.setupComponents();
        this.setupEventHandlers();
        this.loadImages();
        
        document.body.appendChild(this.viewer);
        this.focusCurrentImage(false);
    }
    
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
    
    setupComponents() {
        this.navigation = new ViewerNavigation(this.viewer);
        this.download = new ViewerDownload(this.viewer);
        this.events = new ViewerEvents(this.viewer);
        
        // 핸들러 생성
        const handlers = {
            prevImage: () => this.prevImage(),
            nextImage: () => this.nextImage(),
            selectImage: (index, smooth = true) => this.selectImage(index, smooth),
            focusImage: (index) => this.focusCurrentImage(true),
            adjustImages: (mode) => this.adjustImages(mode),
            downloadCurrentImage: () => this.downloadCurrentImage(),
            downloadAllImages: () => this.downloadAllImages(),
            close: () => this.destroy(),
            goToFirst: () => this.goToFirst(),
            goToLast: () => this.goToLast()
        };
        
        // UI 컴포넌트 생성
        this.optionsBar = this.dom.createOptionsBar(this.tweetInfo, this.currentIndex, this.currentAdjustMode, handlers);
        this.imageContainer = this.dom.createImageContainer();
        this.thumbnailBar = this.dom.createThumbnailBar(this.tweetInfo, this.currentIndex, handlers);
        this.currentImageIndicator = this.dom.createCurrentImageIndicator(this.currentIndex, this.tweetInfo.imageUrls.length);
        
        // 컴포넌트를 뷰어에 추가
        this.viewer.appendChild(this.optionsBar);
        this.viewer.appendChild(this.imageContainer);
        this.viewer.appendChild(this.thumbnailBar);
        this.viewer.appendChild(this.currentImageIndicator);
        
        // 처음 클릭한 이미지가 현재 이미지와 다르면 바로 이동 (약간의 딜레이 후)
        setTimeout(() => {
            this.navigation.currentIndex = this.currentIndex; // 네비게이션 인덱스 동기화
        }, 100);
    }
    
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
            isManualNavigating: () => this.navigation.isManualNavigating,
            getCurrentIndex: () => this.currentIndex,
            updateCurrentIndex: (index) => this.updateCurrentIndex(index)
        };
        
        const observer = this.events.setupIntersectionObserver(this.imageContainer, intersectionCallbacks);
        if (observer) {
            this.observers.push(observer);
        }
        
        // viewer-close 이벤트 리스너 추가
        this.viewer.addEventListener('viewer-close', () => this.destroy());
    }
    
    loadImages() {
        // 모든 이미지를 위한 플레이스홀더 생성
        this.tweetInfo.imageUrls.forEach((url, index) => {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.dataset.index = index;
            placeholder.dataset.src = url;
            placeholder.style.cssText = `
                width: 100%;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 5px 0;
            `;

            const loadingSpinner = document.createElement('div');
            loadingSpinner.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x"></i>';
            placeholder.appendChild(loadingSpinner);

            this.imageContainer.appendChild(placeholder);
        });
        
        // 이미지 지연 로딩 설정
        this.setupLazyLoading();
    }
    
    setupLazyLoading() {
        const loadVisibleImages = () => {
            if (!this.imageContainer) return;
            
            const containerRect = this.imageContainer.getBoundingClientRect();
            const containerTop = containerRect.top - containerRect.height;
            const containerBottom = containerRect.bottom + containerRect.height;
            
            const placeholders = this.imageContainer.querySelectorAll('.image-placeholder');
            placeholders.forEach(placeholder => {
                const index = parseInt(placeholder.dataset.index);
                const rect = placeholder.getBoundingClientRect();
                
                if ((rect.bottom >= containerTop && rect.top <= containerBottom) ||
                    index === this.currentIndex) {
                    this.loadImage(placeholder.dataset.src, index);
                }
            });
        };
        
        const scrollHandler = Utils.debounce(loadVisibleImages, 200);
        this.viewer.addEventListener('scroll', scrollHandler);
        
        loadVisibleImages();
    }
    
    loadImage(url, index) {
        if (this.lazyLoadedImages.has(index)) return;
        
        const placeholder = this.imageContainer.querySelector(`.image-placeholder[data-index="${index}"]`);
        if (!placeholder) return;
        
        const handlers = {
            selectImage: (index) => this.selectImage(index),
            focusImage: (index) => this.focusCurrentImage(true)
        };
        
        const { imgContainer, img } = this.dom.createImageElement(url, index, this.currentIndex, handlers);
        
        // 이미지 로딩 후 조정 설정
        img.onload = () => {
            this.adjustImageElement(img);
            
            if (parseInt(index) === this.currentIndex) {
                setTimeout(() => this.focusCurrentImage(false), 50);
            }
        };
        
        // 이미지 로드 에러 처리
        img.onerror = () => {
            img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjODg4Ij5JbWFnZSBMb2FkIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
        };
        
        // 플레이스홀더 교체
        placeholder.parentNode.replaceChild(imgContainer, placeholder);
        this.lazyLoadedImages.add(index);
    }
    
    focusCurrentImage(smooth = false) {
        try {
            console.log(`focusCurrentImage 호출됨: currentIndex=${this.currentIndex}, smooth=${smooth}`);
            
            if (!this.imageContainer) {
                console.warn('이미지 컨테이너가 없습니다');
                return;
            }
            
            // 기존 이미지에서 강조 효과 제거
            const allContainers = this.imageContainer.querySelectorAll('.image-container');
            allContainers.forEach(container => {
                const containerIndex = parseInt(container.dataset.index || '-1');
                if (containerIndex !== this.currentIndex) {
                    container.style.boxShadow = 'none';
                    container.style.transform = 'scale(1)';
                }
            });
            
            // 주요 변경: querySelectorAll 사용 후 첫 번째 요소만 선택
            const targetElements = this.imageContainer.querySelectorAll(`.image-container[data-index="${this.currentIndex}"]`);
            const targetElement = targetElements.length > 0 ? targetElements[0] : null;
            console.log('대상 요소:', targetElement ? '찾음' : '없음');
            
            if (!targetElement) {
                // 현재 이미지 요소가 없으면 해당 이미지 로드
                console.log(`이미지 로드 시도: index=${this.currentIndex}`);
                this.loadImage(this.tweetInfo.imageUrls[this.currentIndex], this.currentIndex);
                
                // 로드 후 재시도 (300ms 후 한번 더)
                setTimeout(() => {
                    const newTargets = this.imageContainer.querySelectorAll(`.image-container[data-index="${this.currentIndex}"]`);
                    const newTarget = newTargets.length > 0 ? newTargets[0] : null;
                    console.log('재시도 후 대상 요소:', newTarget ? '찾음' : '없음');
                    
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
    
    scrollToImageElement(element, smooth = true) {
        if (!element || !this.viewer) {
            console.warn('scrollToImageElement: 원소나 뷰어가 없습니다');
            return;
        }
        
        // 연속 스크롤 중인지 확인 (추가)
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
            
            console.log('스크롤 정보:', {
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

            // 부드러운 스크롤 직접 구현 (개선)
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
    
    prevImage() {
        const newIndex = this.navigation.navigateImage(-1, this.tweetInfo.imageUrls.length);
        this.updateViewerForIndex(newIndex);
    }
    
    nextImage() {
        const newIndex = this.navigation.navigateImage(1, this.tweetInfo.imageUrls.length);
        this.updateViewerForIndex(newIndex);
    }
    
    selectImage(index, smooth = true) {
        console.log(`selectImage 호출됨: index=${index}, smooth=${smooth}`);
        
        // 범위 확인
        if (index < 0 || index >= this.tweetInfo.imageUrls.length) {
            console.warn(`잘못된 인덱스: ${index}, 최대 값: ${this.tweetInfo.imageUrls.length - 1}`);
            return;
        }
        
        // 이미 진행 중인 선택 작업이 있는지 확인 (추가)
        if (this._isSelecting) {
            console.log('이미지 선택 작업이 이미 진행 중입니다. 중복 요청 무시.');
            return;
        }
        
        // 선택 작업 시작 플래그 설정
        this._isSelecting = true;
        
        try {
            // 이전 인덱스와 다른 경우에만 네비게이션 로직 적용
            if (index !== this.currentIndex) {
                // 진행 중인 타임아웃 정리
                if (this.navigation.navigationTimeout) {
                    clearTimeout(this.navigation.navigationTimeout);
                    this.navigation.navigationTimeout = null;
                }
                
                this.navigation.isManualNavigating = true;
                
                // 이전 이미지 효과 제거
                const prevContainers = this.imageContainer.querySelectorAll(`.image-container[data-index="${this.currentIndex}"]`);
                prevContainers.forEach(container => {
                    container.style.boxShadow = 'none';
                    container.style.transform = 'scale(1)';
                });
                
                // 현재 인덱스 변경
                this.currentIndex = index;
                this.navigation.currentIndex = index; // 네비게이션 인덱스도 업데이트
                
                // UI 업데이트 - 모든 UI 요소 동기화
                this._updateAllUIElements();
                
                // 내비게이션 모드 타임아웃 설정
                this.navigation.navigationTimeout = setTimeout(() => {
                    this.navigation.isManualNavigating = false;
                }, 800); // 타임아웃 시간 줄임
            }
            
            // 포커스 설정 - 인덱스 변경여부와 관계없이 항상 실행
            this.focusCurrentImage(smooth);
            
            // 이미지가 제대로 로드되었는지 확인
            const targetImage = this.imageContainer.querySelector(`.image-container[data-index="${index}"] img`);
            if (targetImage && (!targetImage.complete || !targetImage.naturalWidth)) {
                // 이미지가 아직 로드 중인 경우
                console.log(`이미지 ${index}가 아직 로드 중입니다. 로드 완료 후 포커스합니다.`);
                targetImage.addEventListener('load', () => {
                    setTimeout(() => this.focusCurrentImage(smooth), 50);
                }, { once: true });
            }
        } catch (e) {
            console.error('이미지 선택 오류:', e);
        } finally {
            // 짧은 딜레이 후 선택 작업 완료 플래그 해제 (연속 클릭 방지 시간)
            setTimeout(() => {
                this._isSelecting = false;
            }, 200);
        }
    }
    
    // UI 요소 동기화를 위한 헬퍼 메서드 (추가)
    _updateAllUIElements() {
        // 드롭다운 메뉴 업데이트
        const imageSelect = document.getElementById('image-select');
        if (imageSelect) {
            imageSelect.value = this.currentIndex;
        }
        
        // 썸네일 바 업데이트
        this.navigation.updateThumbnailFocus(this.thumbnailBar);
        
        // 현재 이미지 인디케이터 업데이트
        if (this.currentImageIndicator) {
            this.currentImageIndicator.textContent = translate('currentImageIndicator', this.currentIndex + 1, this.tweetInfo.imageUrls.length);
        }
    }
    
    goToFirst() {
        this.selectImage(0);
    }
    
    goToLast() {
        this.selectImage(this.tweetInfo.imageUrls.length - 1);
    }
    
    updateCurrentIndex(index) {
        if (index === this.currentIndex) return;
        
        this.currentIndex = index;
        
        // UI 업데이트
        const imageSelect = document.getElementById('image-select');
        if (imageSelect) {
            imageSelect.value = this.currentIndex;
        }
        
        this.navigation.updateThumbnailFocus(this.thumbnailBar);
        
        if (this.currentImageIndicator) {
            this.currentImageIndicator.textContent = translate('currentImageIndicator', this.currentIndex + 1, this.tweetInfo.imageUrls.length);
        }
    }
    
    updateViewerForIndex(index) {
        this.currentIndex = index;
        
        // 개선된 UI 업데이트 - 추출된 메서드 사용
        this._updateAllUIElements();
        this.focusCurrentImage(true);
    }
    
    adjustImages(mode) {
        this.currentAdjustMode = mode;
        Utils.setLocalStorageItem('adjustMode', mode);
        
        const images = this.imageContainer.querySelectorAll('.viewer-image');
        images.forEach(img => this.adjustImageElement(img));
        
        setTimeout(() => this.focusCurrentImage(true), 50);
    }
    
    adjustImageElement(img) {
        if (!img.complete || !img.naturalWidth) {
            img.addEventListener('load', () => this.dom.updateImageStyles(img, this.currentAdjustMode), { once: true });
            return;
        }
        
        this.dom.updateImageStyles(img, this.currentAdjustMode);
    }
    
    downloadCurrentImage() {
        this.download.downloadCurrentImage(this.tweetInfo, this.currentIndex);
    }
    
    downloadAllImages() {
        this.download.downloadAllImages(this.tweetInfo);
    }
    
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
        
        // 진행 중인 애니메이션 취소 (추가)
        if (this._scrollAnimationFrame) {
            cancelAnimationFrame(this._scrollAnimationFrame);
            this._scrollAnimationFrame = null;
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
        this.lazyLoadedImages = new Set();
        this.observers = [];
        this._isScrolling = false;
        this._isSelecting = false;
        
        // 스크롤 위치 복원
        document.body.style.overflow = '';
        window.scrollTo(0, this.savedScrollPos);
    }
}