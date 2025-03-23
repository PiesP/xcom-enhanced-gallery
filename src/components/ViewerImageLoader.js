import { Utils } from "../Utils.js";
import { debugLog } from "../debug.js";

/**
 * 이미지 로딩 관리 클래스
 */
export class ViewerImageLoader {
    constructor(imageContainer) {
        this.imageContainer = imageContainer;
        this.lazyLoadedImages = new Set();
        this.currentIndex = 0;
        this.dom = null;
    }
    
    /**
     * DOM 컴포넌트 설정
     * @param {ViewerDOM} dom - DOM 컴포넌트
     */
    setDOMComponent(dom) {
        this.dom = dom;
    }
    
    /**
     * 현재 인덱스 설정
     * @param {number} index - 현재 이미지 인덱스
     */
    setCurrentIndex(index) {
        this.currentIndex = index;
    }
    
    /**
     * 모든 이미지에 대한 플레이스홀더 생성
     * @param {Array} imageUrls - 이미지 URL 배열
     */
    createPlaceholders(imageUrls) {
        imageUrls.forEach((url, index) => {
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
    }
    
    /**
     * 지연 로딩 설정
     */
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
        this.imageContainer.parentElement.addEventListener('scroll', scrollHandler);
        
        loadVisibleImages();
    }
    
    /**
     * 이미지 로드
     * @param {string} url - 이미지 URL
     * @param {number} index - 이미지 인덱스
     * @param {Object} handlers - 이벤트 핸들러 객체
     */
    loadImage(url, index, handlers = {}) {
        if (this.lazyLoadedImages.has(index)) return;
        
        const placeholder = this.imageContainer.querySelector(`.image-placeholder[data-index="${index}"]`);
        if (!placeholder) return;
        
        if (!this.dom) {
            debugLog('DOM 컴포넌트가 설정되지 않았습니다.');
            return;
        }
        
        const { imgContainer, img } = this.dom.createImageElement(url, index, this.currentIndex, handlers);
        
        // 이미지 로딩 후 조정 설정
        img.onload = () => {
            this.dom.updateImageStyles(img, 'window'); // 기본값 window로 설정
            
            if (parseInt(index) === this.currentIndex) {
                setTimeout(() => {
                    if (handlers.focusImage) {
                        handlers.focusImage(index);
                    }
                }, 50);
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
    
    /**
     * 지정된 이미지 로드 강제 실행
     * @param {string} url - 이미지 URL
     * @param {number} index - 이미지 인덱스
     * @param {Object} handlers - 이벤트 핸들러 객체
     */
    forceLoadImage(url, index, handlers = {}) {
        if (this.lazyLoadedImages.has(index)) {
            if (handlers.focusImage) {
                handlers.focusImage(index);
            }
            return;
        }
        
        this.loadImage(url, index, handlers);
    }
    
    /**
     * 모든 이미지 로드
     * @param {Array} imageUrls - 이미지 URL 배열
     * @param {Object} handlers - 이벤트 핸들러 객체
     */
    loadImages(imageUrls, handlers = {}) {
        // 모든 이미지를 위한 플레이스홀더 생성
        this.createPlaceholders(imageUrls);
        
        // 이미지 지연 로딩 설정
        this.setupLazyLoading();
        
        // 현재 인덱스의 이미지는 강제 로드
        if (imageUrls.length > 0 && this.currentIndex >= 0 && this.currentIndex < imageUrls.length) {
            this.forceLoadImage(imageUrls[this.currentIndex], this.currentIndex, handlers);
        }
    }
    
    /**
     * 이미지 스타일 업데이트
     * @param {string} mode - 조정 모드 ('width', 'height', 'window', 'original')
     */
    adjustAllImages(mode) {
        const images = this.imageContainer.querySelectorAll('.viewer-image');
        images.forEach(img => this.adjustImageElement(img, mode));
    }
    
    /**
     * 개별 이미지 스타일 조정
     * @param {HTMLElement} img - 이미지 요소
     * @param {string} mode - 조정 모드
     */
    adjustImageElement(img, mode) {
        if (!img.complete || !img.naturalWidth) {
            img.addEventListener('load', () => {
                if (this.dom) {
                    this.dom.updateImageStyles(img, mode);
                }
            }, { once: true });
            return;
        }
        
        if (this.dom) {
            this.dom.updateImageStyles(img, mode);
        }
    }
}