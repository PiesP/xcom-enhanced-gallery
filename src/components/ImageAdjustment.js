import { Utils } from "../Utils.js";

/**
 * 이미지 크기 조정 클래스
 */
export class ImageAdjustment {
    constructor(imageContainer) {
        this.imageContainer = imageContainer;
        this.currentAdjustMode = Utils.getLocalStorageItem('adjustMode', 'window');
    }
    
    /**
     * 현재 조정 모드 반환
     * @returns {string} 현재 조정 모드
     */
    getCurrentMode() {
        return this.currentAdjustMode;
    }
    
    /**
     * 모든 이미지 조정
     * @param {string} mode - 조정 모드 ('width', 'height', 'window', 'original')
     * @param {Function} focusCallback - 포커스 콜백 함수 (선택 사항)
     */
    adjustImages(mode, focusCallback = null) {
        this.currentAdjustMode = mode;
        Utils.setLocalStorageItem('adjustMode', mode);
        
        const images = this.imageContainer.querySelectorAll('.viewer-image');
        images.forEach(img => this.adjustImageElement(img));
        
        if (focusCallback) {
            setTimeout(() => focusCallback(true), 50);
        }
    }
    
    /**
     * 개별 이미지 요소 조정
     * @param {HTMLElement} img - 이미지 요소
     */
    adjustImageElement(img) {
        if (!img.complete || !img.naturalWidth) {
            img.addEventListener('load', () => this.updateImageStyles(img, this.currentAdjustMode), { once: true });
            return;
        }
        
        this.updateImageStyles(img, this.currentAdjustMode);
    }
    
    /**
     * 이미지 스타일 업데이트
     * @param {HTMLElement} img - 이미지 요소
     * @param {string} mode - 조정 모드
     */
    updateImageStyles(img, mode) {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight - 160;

        switch(mode) {
            case 'width':
                img.style.width = `${Math.min(winWidth, imgWidth)}px`;
                img.style.height = 'auto';
                break;
            case 'height':
                img.style.height = `${Math.min(winHeight, imgHeight)}px`;
                img.style.width = 'auto';
                break;
            case 'window':
                const scale = Math.min(1, winWidth / imgWidth, winHeight / imgHeight);
                img.style.width = `${imgWidth * scale}px`;
                img.style.height = `${imgHeight * scale}px`;
                break;
            case 'original':
                img.style.width = `${imgWidth}px`;
                img.style.height = `${imgHeight}px`;
                break;
        }

        img.style.objectFit = "initial";
        img.style.margin = "0 auto";
        img.style.position = "static";
        img.style.transform = "none";

        if (mode === 'original') {
            img.style.maxWidth = "none";
        } else {
            img.style.maxWidth = "100%";
        }
    }
}