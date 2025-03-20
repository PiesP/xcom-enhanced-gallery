// ==UserScript==
// @name         X.com Enhanced Image Gallery
// @namespace    https://github.com/PiesP/xcom-enhanced-gallery
// @version      0.9.4
// @description  Enhanced image viewer for X.com that displays original-sized images in a vertical gallery with adjustable view modes and batch download options.
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/js/all.min.js
// ==/UserScript==

// == I18N.js ==
const I18N = {
    ko: {
        prevImage: '이전 이미지',
        nextImage: '다음 이미지',
        fitWidth: '너비 맞춤',
        fitHeight: '높이 맞춤',
        fitWindow: '창 맞춤',
        originalSize: '원본 크기',
        saveCurrentImage: '현재 이미지 저장',
        saveAllImages: '모든 이미지 저장',
        close: '닫기 (Esc키로도 닫힘)',
        downloadFailed: '이미지 다운로드 실패',
        unknownUser: '알 수 없는 사용자',
        unknownID: '알 수 없는 ID',
        currentImageIndicator: '현재 이미지: %1 / %2',
        positionAdaptive: '위치 자동 조정',
        positionTop: '이미지 상단 정렬',
        positionCenter: '이미지 중앙 정렬'
    },
    en: {
        prevImage: 'Previous Image',
        nextImage: 'Next Image',
        fitWidth: 'Fit to Width',
        fitHeight: 'Fit to Height',
        fitWindow: 'Fit to Window',
        originalSize: 'Original Size',
        saveCurrentImage: 'Save Current Image',
        saveAllImages: 'Save All Images',
        close: 'Close (or press Esc)',
        downloadFailed: 'Image download failed',
        unknownUser: 'Unknown User',
        unknownID: 'Unknown ID',
        currentImageIndicator: 'Current image: %1 of %2',
        positionAdaptive: 'Adaptive Image Position',
        positionTop: 'Align Image to Top',
        positionCenter: 'Center Image in View'
    }
};

const userLang = (navigator.language || navigator.userLanguage).split('-')[0];
const lang = I18N[userLang] ? userLang : 'ko';

function translate(key, ...args) {
    let text = I18N[lang][key] || I18N.ko[key] || key;
    args.forEach((arg, index) => {
        text = text.replace(`%${index + 1}`, arg);
    });
    return text;
}


// == Utils.js ==
class Utils {
    static getLocalStorageItem(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    static setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`localStorage save failed: ${e.message}`);
        }
    }

    static createStyleSheet(id, cssContent) {
        if (!document.getElementById(id)) {
            const styleSheet = document.createElement('style');
            styleSheet.id = id;
            styleSheet.textContent = cssContent;
            document.head.appendChild(styleSheet);
        }
    }

    static getFileExtension(url) {
        try {
            const urlParams = new URL(url).searchParams;
            const format = urlParams.get('format');
            return format ? format : 'jpg';
        } catch (e) {
            return 'jpg';
        }
    }

    static getUserUIColor() {
        try {
            const computedStyle = getComputedStyle(document.body);
            return {
                bgColor: computedStyle.backgroundColor || 'black',
                textColor: computedStyle.color || 'white'
            };
        } catch (e) {
            return { bgColor: 'black', textColor: 'white' };
        }
    }

    static addAlpha(color, alpha) {
        try {
            if (color.startsWith("rgb(")) {
                return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
            }
            return color;
        } catch (e) {
            return `rgba(0, 0, 0, ${alpha})`;
        }
    }

    static debounce(func, wait, immediate = false) {
        let timeout;
        return function(...args) {
            const context = this;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
}


// == CSS.js ==
const STYLE_ID = 'xcom-image-viewer-styles';

const CSS = `
    #xcom-image-viewer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        overflow-y: auto;
        z-index: 10000;
        overscroll-behavior: contain;
        touch-action: pan-y pinch-zoom;
        cursor: pointer;
    }

    #optionsBar {
        width: 100%;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10004;
        transition: transform 0.3s ease;
        transform: translateY(0);
    }

    #thumbnailBar {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        transition: transform 0.3s ease;
        transform: translateY(0);
        z-index: 10004;
        padding: 0 10px;
        overflow-x: auto;
    }

    .icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        border: none;
        cursor: pointer;
        font-size: 16px;
        border-radius: 4px;
    }

    .icon-button:hover {
        opacity: 0.8;
    }

    .icon-button:focus {
        outline: 2px solid #1da1f2;
    }

    .viewer-image {
        display: block;
        width: auto;
        height: auto;
        max-width: 100%;
        object-fit: contain;
        transition: all 0.3s ease;
        transform-origin: top center;
        margin: 0;
        cursor: pointer;
        user-select: none;
        pointer-events: auto;
        -webkit-user-drag: none;
    }

    .image-container {
        position: relative;
        margin: 5px 0;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
        pointer-events: auto;
        z-index: 10001;
    }

    .image-container-wrapper {
        pointer-events: none;
    }

    .thumbnail {
        height: 60px;
        max-height: 60px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 3px solid transparent;
        pointer-events: auto;
    }

    .thumbnail:hover {
        transform: scale(1.05);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
    }

    .thumbnail.active {
        border-color: #1da1f2;
        transform: scale(1.1);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
    }

    .image-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #1da1f2;
        box-shadow: 0 0 5px white;
        pointer-events: none;
        z-index: 10003;
    }

    #current-image-indicator {
        position: fixed;
        top: 10px;
        right: 100px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 10004;
        pointer-events: none;
    }

    @media (max-width: 768px) {
        .icon-button {
            padding: 8px;
        }

        #optionsBar {
            flex-wrap: wrap;
            justify-content: space-around;
        }

        .thumbnail {
            height: 50px;
        }
    }
`;

// == ViewerDOM.js ==

class ViewerDOM {
    constructor(viewer) {
        this.viewer = viewer;
    }

    createViewer() {
        const viewer = document.createElement('div');
        viewer.id = 'xcom-image-viewer';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-label', 'Image Viewer');

        const backgroundOverlay = document.createElement('div');
        backgroundOverlay.className = 'background-overlay';
        backgroundOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            cursor: default;
        `;
        
        // 배경 오버레이 클릭 시 닫기
        backgroundOverlay.addEventListener('click', (event) => {
            if (event.target === backgroundOverlay) {
                const closeEvent = new CustomEvent('viewer-close');
                viewer.dispatchEvent(closeEvent);
                event.stopPropagation();
                event.preventDefault();
            }
        });

        viewer.appendChild(backgroundOverlay);
        return viewer;
    }

    createOptionsBar(tweetInfo, currentIndex, currentAdjustMode, handlers) {
        const { bgColor, textColor } = Utils.getUserUIColor();

        const optionsBar = document.createElement('div');
        optionsBar.id = 'optionsBar';
        optionsBar.style.background = Utils.addAlpha(bgColor, 0.8);
        optionsBar.style.color = textColor;
        optionsBar.setAttribute('role', 'toolbar');
        optionsBar.setAttribute('aria-label', 'Image Viewer Controls');

        const prevBtn = this.createIconButton('fa-solid fa-arrow-left', handlers.prevImage, translate('prevImage'));
        const nextBtn = this.createIconButton('fa-solid fa-arrow-right', handlers.nextImage, translate('nextImage'));

        const imageSelect = document.createElement('select');
        imageSelect.id = 'image-select';
        imageSelect.setAttribute('aria-label', 'Select Image');

        tweetInfo.imageUrls.forEach((url, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = (index + 1).toString();
            imageSelect.appendChild(option);
        });

        imageSelect.selectedIndex = currentIndex;
        imageSelect.addEventListener('change', () => {
            handlers.selectImage(parseInt(imageSelect.value));
        });

        const fitWidthBtn = this.createIconButton('fa-solid fa-arrows-left-right', () => handlers.adjustImages('width'), translate('fitWidth'));
        const fitHeightBtn = this.createIconButton('fa-solid fa-arrows-up-down', () => handlers.adjustImages('height'), translate('fitHeight'));
        const fitWindowBtn = this.createIconButton('fa-solid fa-expand', () => handlers.adjustImages('window'), translate('fitWindow'));
        const originalSizeBtn = this.createIconButton('fa-solid fa-image', () => handlers.adjustImages('original'), translate('originalSize'));

        const downloadCurrentBtn = this.createIconButton('fa-solid fa-download', handlers.downloadCurrentImage, translate('saveCurrentImage'));
        const downloadAllBtn = this.createIconButton('fa-solid fa-file-zipper', handlers.downloadAllImages, translate('saveAllImages'));

        const closeBtn = this.createIconButton('fa-solid fa-xmark', handlers.close, translate('close'));
        closeBtn.style.marginLeft = 'auto';
        closeBtn.style.marginRight = '10px';

        optionsBar.append(
            prevBtn,
            imageSelect,
            nextBtn,
            fitWidthBtn,
            fitHeightBtn,
            fitWindowBtn,
            originalSizeBtn,
            downloadCurrentBtn,
            downloadAllBtn,
            closeBtn
        );

        return optionsBar;
    }

    createIconButton(iconClass, onClick, tooltipText) {
        try {
            const { bgColor, textColor } = Utils.getUserUIColor();

            const button = document.createElement('button');
            button.className = 'icon-button';
            button.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
            button.style.background = bgColor;
            button.style.color = textColor;

            if (tooltipText) {
                button.title = tooltipText;
                button.setAttribute('aria-label', tooltipText);
            }

            button.addEventListener('click', (event) => {
                event.stopPropagation();
                onClick();
            });

            return button;
        } catch (e) {
            const fallbackButton = document.createElement('button');
            fallbackButton.textContent = tooltipText || "Button";
            return fallbackButton;
        }
    }

    createImageContainer() {
        const container = document.createElement('div');
        container.className = 'image-container-wrapper';
        container.style.cssText = `
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 60px 0 80px 0;
            z-index: 10001;
            pointer-events: none;
        `;
        return container;
    }

    createImageElement(url, index, currentIndex, handlers) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-container';
        imgContainer.dataset.index = index;
        imgContainer.dataset.url = url;

        const img = document.createElement('img');
        img.src = url;
        img.className = 'viewer-image';
        img.dataset.index = index;
        img.alt = `Image ${index + 1}`;
        
        // 클래스 명으로 이미지 뷰어 내부 이미지 식별하기 위한 추가 클래스
        img.classList.add('xcom-viewer-img');
        imgContainer.classList.add('xcom-viewer-container');

        // ===== 개선된 이미지 클릭 핸들러 - 디바운싱 적용 =====
        const handleImageClick = Utils.debounce((e) => {
            // 버블링 멈춤
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            
            console.log(`이미지 클릭됨: index=${index}`);
            
            // 클릭된 이미지가 현재 선택된 이미지인지 확인
            if (parseInt(index) !== currentIndex) {
                handlers.selectImage(parseInt(index));
            } else {
                handlers.focusImage(parseInt(index));
            }
            
            return false;
        }, 300, true); // 300ms 디바운스, 첫 클릭 즉시 실행

        // 단일 이벤트 리스너로 간소화 (중복 방지)
        imgContainer.addEventListener('click', handleImageClick, { capture: true });
        
        // 마우스 오버 효과
        imgContainer.addEventListener('mouseenter', () => {
            imgContainer.style.boxShadow = '0 0 8px rgba(29, 161, 242, 0.5)';
            img.style.opacity = '0.95';
        });

        imgContainer.addEventListener('mouseleave', () => {
            imgContainer.style.boxShadow = 'none';
            img.style.opacity = '1';
        });

        if (parseInt(index) === currentIndex) {
            const indicator = document.createElement('div');
            indicator.className = 'image-indicator';
            imgContainer.appendChild(indicator);
        }

        imgContainer.appendChild(img);
        return { imgContainer, img };
    }

    createThumbnailBar(tweetInfo, currentIndex, handlers) {
        const { bgColor } = Utils.getUserUIColor();

        const thumbnailBar = document.createElement('div');
        thumbnailBar.id = 'thumbnailBar';
        thumbnailBar.style.background = Utils.addAlpha(bgColor, 0.8);

        tweetInfo.imageUrls.forEach((url, index) => {
            const thumb = document.createElement('img');
            thumb.src = url.replace(/&name=orig/, '&name=small');
            thumb.className = index === currentIndex ? 'thumbnail active' : 'thumbnail';
            thumb.dataset.index = index;
            thumb.alt = `Thumbnail ${index + 1}`;
            
            // 클래스 명으로 썸네일 식별
            thumb.classList.add('xcom-thumbnail');

            // ===== 개선된 썸네일 클릭 핸들러 - 디바운싱 적용 =====
            const handleThumbClick = Utils.debounce((e) => {
                // 버블링 멈춤
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log(`썸네일 클릭됨: index=${index}`);
                
                // 썸네일 클릭 시에도 동일한 핵심 함수(번호 선택) 사용
                handlers.selectImage(parseInt(index));
                
                // 클릭된 썸네일 효과 추가
                thumb.style.transform = 'scale(1.2)';
                thumb.style.boxShadow = '0 0 10px rgba(29, 161, 242, 0.9)';
                
                // 효과 원복
                setTimeout(() => {
                    if (thumb.classList.contains('active')) {
                        thumb.style.transform = 'scale(1.1)';
                        thumb.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.7)';
                    } else {
                        thumb.style.transform = '';
                        thumb.style.boxShadow = '';
                    }
                }, 300);
                
                return false;
            }, 300, true); // 300ms 디바운스, 첫 클릭 즉시 실행
            
            // 이벤트 할당 (중복 방지를 위해 하나의 이벤트 리스너만 사용)
            thumb.addEventListener('click', handleThumbClick, { capture: true });

            thumb.setAttribute('role', 'tab');
            thumb.setAttribute('aria-selected', index === currentIndex ? 'true' : 'false');
            thumb.setAttribute('tabindex', '0');

            thumb.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handlers.selectImage(index);
                }
            });

            thumbnailBar.appendChild(thumb);
        });

        return thumbnailBar;
    }

    createCurrentImageIndicator(currentIndex, totalImages) {
        const indicator = document.createElement('div');
        indicator.id = 'current-image-indicator';
        indicator.textContent = translate('currentImageIndicator', currentIndex + 1, totalImages);
        return indicator;
    }

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

// == ViewerNavigation.js ==
class ViewerNavigation {
    constructor(viewer) {
        this.viewer = viewer;
        this.currentIndex = 0;
        this.currentAdjustMode = 'window';
        this.isManualNavigating = false;
        this.navigationTimeout = null;
    }

    navigateImage(direction, imagesCount) {
        try {
            if (imagesCount <= 1) return this.currentIndex;

            this.isManualNavigating = true;
            clearTimeout(this.navigationTimeout);

            let newIndex = this.currentIndex + direction;

            if (newIndex < 0) newIndex = imagesCount - 1;
            if (newIndex >= imagesCount) newIndex = 0;

            this.currentIndex = newIndex;
            
            this.navigationTimeout = setTimeout(() => {
                this.isManualNavigating = false;
            }, 1000);
            
            return this.currentIndex;
        } catch (e) {
            console.error(`Error navigating image: ${e.message}`);
            this.isManualNavigating = false;
            return this.currentIndex;
        }
    }

    selectImage(index, imagesCount) {
        if (index < 0 || index >= imagesCount) return this.currentIndex;
        
        this.isManualNavigating = true;
        clearTimeout(this.navigationTimeout);
        
        this.currentIndex = index;
        
        this.navigationTimeout = setTimeout(() => {
            this.isManualNavigating = false;
        }, 1000);
        
        return this.currentIndex;
    }

    setupKeyboardNavigation(handlers) {
        const keyHandler = (event) => {
            if (!this.viewer) return;

            switch(event.key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                    event.preventDefault();
                    console.log('키보드: 이전 이미지');
                    handlers.prevImage();
                    break;
                case 'ArrowDown':
                case 'ArrowRight':
                    event.preventDefault();
                    console.log('키보드: 다음 이미지');
                    handlers.nextImage();
                    break;
                case 'Escape':
                    event.preventDefault();
                    console.log('키보드: 닫기');
                    handlers.close();
                    break;
                case ' ': // Space
                    event.preventDefault();
                    console.log('키보드: 다음 이미지 (Space)');
                    handlers.nextImage();
                    break;
                case 'Home':
                    event.preventDefault();
                    console.log('키보드: 처음 이미지');
                    handlers.goToFirst();
                    break;
                case 'End':
                    event.preventDefault();
                    console.log('키보드: 마지막 이미지');
                    handlers.goToLast();
                    break;
            }
        };

        document.addEventListener('keydown', keyHandler);
        return keyHandler; // Return for cleanup
    }

    setupMouseWheelNavigation(handlers) {
        const wheelHandler = (event) => {
            if (event.deltaY !== 0) {
                if (event.shiftKey || event.ctrlKey) {
                    event.preventDefault();
                    if (event.deltaY > 0) {
                        handlers.nextImage();
                    } else {
                        handlers.prevImage();
                    }
                }
            }
        };

        this.viewer.addEventListener('wheel', wheelHandler, { passive: false });
        return wheelHandler; // Return for cleanup
    }

    focusCurrentImage(container, smooth = true) {
        try {
            const target = container.querySelector(`.image-container[data-index="${this.currentIndex}"]`);
            if (!target) return;

            target.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
                block: 'center'
            });
        } catch (e) {
            console.error(`focusCurrentImage error:`, e);
        }
    }

    updateThumbnailFocus(thumbnailBar) {
        if (!thumbnailBar) return;

        const thumbs = thumbnailBar.querySelectorAll('.thumbnail');
        thumbs.forEach((thumb, idx) => {
            thumb.classList.remove('active');
            thumb.setAttribute('aria-selected', 'false');

            if (idx === this.currentIndex) {
                thumb.classList.add('active');
                thumb.setAttribute('aria-selected', 'true');

                thumb.style.transform = 'scale(1.1)';
                thumb.style.boxShadow = '0 0 8px rgba(29, 161, 242, 0.8)';
                thumb.style.border = '3px solid #1da1f2';

                setTimeout(() => {
                    if (thumb.classList.contains('active')) {
                        thumb.style.transform = 'scale(1.05)';
                        thumb.style.boxShadow = '0 0 5px rgba(29, 161, 242, 0.6)';
                    }
                }, 300);
            } else {
                thumb.style.transform = 'scale(1)';
                thumb.style.boxShadow = 'none';
                thumb.style.border = '3px solid transparent';
            }
        });

        const selectedThumb = thumbnailBar.querySelector(`.thumbnail[data-index="${this.currentIndex}"]`);
        if (selectedThumb) {
            selectedThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }
}

// == ViewerDownload.js ==

class ViewerDownload {
    constructor(viewer) {
        this.viewer = viewer;
    }

    async downloadCurrentImage(tweetInfo, currentIndex) {
        try {
            if (!tweetInfo.imageUrls.length) return;

            const url = tweetInfo.imageUrls[currentIndex];
            const ext = Utils.getFileExtension(url);
            const filename = `${tweetInfo.user}_${tweetInfo.id}_${currentIndex + 1}.${ext}`;

            const downloadIndicator = document.createElement('div');
            downloadIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10010;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                max-width: 80%;
            `;

            const preview = document.createElement('img');
            preview.src = url.replace(/&name=orig/, '&name=small');
            preview.style.cssText = `
                max-width: 150px;
                max-height: 150px;
                border: 2px solid white;
            `;

            downloadIndicator.innerHTML = `
                <h3>Downloading Image ${currentIndex + 1} of ${tweetInfo.imageUrls.length}</h3>
                <p>${filename}</p>
            `;
            downloadIndicator.appendChild(preview);

            this.viewer.appendChild(downloadIndicator);

            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                if (typeof saveAs === 'function') {
                    saveAs(url, filename);
                } else {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } catch (err) {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            downloadIndicator.innerHTML = `
                <h3>Download Complete!</h3>
                <p>Image ${currentIndex + 1} of ${tweetInfo.imageUrls.length} saved as:</p>
                <p>${filename}</p>
            `;
            downloadIndicator.appendChild(preview);

            setTimeout(() => {
                if (downloadIndicator.parentNode) {
                    downloadIndicator.parentNode.removeChild(downloadIndicator);
                }
            }, 1500);
        } catch (e) {
            const existingIndicator = this.viewer.querySelector('div[style*="z-index: 10010"]');
            if (existingIndicator) {
                existingIndicator.parentNode.removeChild(existingIndicator);
            }
            console.error("Error downloading image:", e);
        }
    }

    async downloadAllImages(tweetInfo) {
        try {
            if (!tweetInfo.imageUrls.length) return;

            if (typeof JSZip !== 'function' && typeof window.JSZip !== 'function') {
                alert("JSZip library is not available. Please reload the page or use single image download.");
                return;
            }

            const ZipConstructor = typeof JSZip === 'function' ? JSZip : window.JSZip;
            const zip = new ZipConstructor();
            const folder = zip.folder(`${tweetInfo.user}_${tweetInfo.id}`);

            const loadingIndicator = document.createElement('div');
            loadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10010;
                text-align: center;
            `;
            loadingIndicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Downloading images...</p>';
            this.viewer.appendChild(loadingIndicator);

            const downloadPromises = tweetInfo.imageUrls.map(async (url, index) => {
                try {
                    const ext = Utils.getFileExtension(url);
                    const filename = `${tweetInfo.user}_${tweetInfo.id}_${index + 1}.${ext}`;
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const blob = await response.blob();
                    folder.file(filename, blob);

                    loadingIndicator.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                        <p>Downloading images (${index + 1}/${tweetInfo.imageUrls.length})...</p>
                    `;
                } catch (error) {
                    console.warn(`${translate('downloadFailed')}: ${url}`, error);
                }
            });

            await Promise.allSettled(downloadPromises);

            try {
                const zipContent = await zip.generateAsync({ type: 'blob' });
                
                if (typeof saveAs === 'function') {
                    saveAs(zipContent, `${tweetInfo.user}_${tweetInfo.id}.zip`);
                } else if (typeof window.saveAs === 'function') {
                    window.saveAs(zipContent, `${tweetInfo.user}_${tweetInfo.id}.zip`);
                } else {
                    const url = URL.createObjectURL(zipContent);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${tweetInfo.user}_${tweetInfo.id}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            } catch (error) {
                console.error(`Error creating zip file: ${error.message}`);
                alert(`Error creating zip file: ${error.message}`);
            }

            if (loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
        } catch (e) {
            const loadingIndicator = this.viewer.querySelector('div[style*="z-index: 10010"]');
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
            console.error("Error downloading all images:", e);
            alert(`Error downloading all images: ${e.message}`);
        }
    }
}

// == ViewerEvents.js ==

class ViewerEvents {
    constructor(viewer) {
        this.viewer = viewer;
        this.eventListeners = [];
        this.isMouseOverOptionsBar = false;
        this.isMouseOverThumbnailBar = false;
        this.isMouseInTopDetectionZone = false;
        this.isMouseInBottomDetectionZone = false;
        this.hideOptionsBarTimer = null;
        this.hideThumbnailBarTimer = null;
        this.detectionZoneSize = 150;
    }

    setupUIAutoHide(optionsBar, thumbnailBar) {
        // 옵션 바 이벤트 핸들러
        optionsBar.addEventListener('mouseenter', () => {
            this.isMouseOverOptionsBar = true;
            clearTimeout(this.hideOptionsBarTimer);
            optionsBar.style.transform = 'translateY(0)';
        });

        optionsBar.addEventListener('mouseleave', () => {
            this.isMouseOverOptionsBar = false;
            if (!this.isMouseInTopDetectionZone) {
                this.hideOptionsBarTimer = setTimeout(() => {
                    if (!this.isMouseOverOptionsBar && !this.isMouseInTopDetectionZone) {
                        optionsBar.style.transform = 'translateY(-100%)';
                    }
                }, 2000);
            }
        });

        // 썸네일 바 이벤트 핸들러
        thumbnailBar.addEventListener('mouseenter', () => {
            this.isMouseOverThumbnailBar = true;
            clearTimeout(this.hideThumbnailBarTimer);
            thumbnailBar.style.transform = 'translateY(0)';
        });

        thumbnailBar.addEventListener('mouseleave', () => {
            this.isMouseOverThumbnailBar = false;
            if (!this.isMouseInBottomDetectionZone) {
                this.hideThumbnailBarTimer = setTimeout(() => {
                    if (!this.isMouseOverThumbnailBar && !this.isMouseInBottomDetectionZone) {
                        thumbnailBar.style.transform = 'translateY(100%)';
                    }
                }, 2000);
            }
        });

        // 처음 자동 숨김 타이머 설정
        this.hideOptionsBarTimer = setTimeout(() => {
            if (!this.isMouseOverOptionsBar) {
                optionsBar.style.transform = 'translateY(-100%)';
            }
        }, 2000);

        this.hideThumbnailBarTimer = setTimeout(() => {
            if (!this.isMouseOverThumbnailBar) {
                thumbnailBar.style.transform = 'translateY(100%)';
            }
        }, 2000);

        // 마우스 움직임 핸들러 설정
        const mouseMoveHandler = Utils.debounce((e) => {
            if (!this.viewer) return;

            const isInTopZone = e.clientY < this.detectionZoneSize;
            if (isInTopZone !== this.isMouseInTopDetectionZone) {
                this.isMouseInTopDetectionZone = isInTopZone;

                if (isInTopZone && optionsBar) {
                    clearTimeout(this.hideOptionsBarTimer);
                    optionsBar.style.transform = 'translateY(0)';
                }
                else if (optionsBar && !this.isMouseOverOptionsBar) {
                    this.hideOptionsBarTimer = setTimeout(() => {
                        if (!this.isMouseOverOptionsBar && !this.isMouseInTopDetectionZone) {
                            optionsBar.style.transform = 'translateY(-100%)';
                        }
                    }, 2000);
                }
            }

            const isInBottomZone = e.clientY > window.innerHeight - this.detectionZoneSize;
            if (isInBottomZone !== this.isMouseInBottomDetectionZone) {
                this.isMouseInBottomDetectionZone = isInBottomZone;

                if (isInBottomZone && thumbnailBar) {
                    clearTimeout(this.hideThumbnailBarTimer);
                    thumbnailBar.style.transform = 'translateY(0)';
                }
                else if (thumbnailBar && !this.isMouseOverThumbnailBar) {
                    this.hideThumbnailBarTimer = setTimeout(() => {
                        if (!this.isMouseOverThumbnailBar && !this.isMouseInBottomDetectionZone) {
                            thumbnailBar.style.transform = 'translateY(100%)';
                        }
                    }, 2000);
                }
            }
        }, 50);

        this.viewer.addEventListener('mousemove', mouseMoveHandler);
        this.eventListeners.push({ event: 'mousemove', listener: mouseMoveHandler, element: this.viewer });
    }

    setupBackgroundClickHandler(closeHandler) {
        const backgroundClickHandler = (event) => {
            // 버튼이 왼쪽 클릭이 아닌 경우 무시
            if ('button' in event && event.button !== 0) return;
            
            // 인터랙티브 요소 클릭 시 무시
            const isInteractiveElement = event.target.closest(
                '.image-container, .viewer-image, #optionsBar, #thumbnailBar, ' +
                '.icon-button, select, .thumbnail, .image-placeholder, button'
            );
            
            // 뷰어 배경 또는 오버레이 클릭 시 닫기
            if (event.target === this.viewer || 
                event.target.classList.contains('background-overlay') ||
                (!isInteractiveElement && this.viewer.contains(event.target))) {
                event.preventDefault();
                event.stopPropagation();
                closeHandler();
            }
        };

        this.viewer.addEventListener('click', backgroundClickHandler, { capture: true });
        this.eventListeners.push({ 
            event: 'click', 
            listener: backgroundClickHandler, 
            options: { capture: true }, 
            element: this.viewer 
        });
    }

    setupIntersectionObserver(imageContainer, callbacks) {
        try {
            const options = {
                root: this.viewer,
                threshold: [0.1, 0.5, 0.9]
            };

            const observer = new IntersectionObserver((entries) => {
                // 가장 큰 교차 비율을 가진 이미지 찾기
                if (callbacks.isManualNavigating()) return;

                let maxVisibility = 0;
                let mostVisibleIndex = -1;

                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > maxVisibility) {
                        const container = entry.target;
                        const index = parseInt(container.dataset.index);
                        if (!isNaN(index)) {
                            maxVisibility = entry.intersectionRatio;
                            mostVisibleIndex = index;
                        }
                    }
                });

                if (mostVisibleIndex !== -1 && mostVisibleIndex !== callbacks.getCurrentIndex()) {
                    callbacks.updateCurrentIndex(mostVisibleIndex);
                }
            }, options);

            const containers = imageContainer.querySelectorAll('.image-container');
            containers.forEach(container => {
                observer.observe(container);
            });

            return observer;
        } catch (e) {
            console.error(`Error setting up intersection observer: ${e.message}`);
            return null;
        }
    }

    cleanupEventListeners() {
        this.eventListeners.forEach(({ event, listener, options, element }) => {
            const targetElement = element || document;
            if (targetElement && targetElement.removeEventListener) {
                targetElement.removeEventListener(event, listener, options);
            }
        });
        this.eventListeners = [];

        clearTimeout(this.hideOptionsBarTimer);
        clearTimeout(this.hideThumbnailBarTimer);
    }
}

// == TweetInfo.js ==

class TweetInfo {
    constructor() {
        this.user = '';
        this.id = '';
        this.imageUrls = [];
        this.isMediaTab = false;
    }

    extractFromTweet(containerElement) {
        try {
            // 미디어란인지 확인 (아티클이 아닌 경우)
            this.isMediaTab = !containerElement.tagName || containerElement.tagName.toLowerCase() !== 'article';
            
            this.imageUrls = this.getAllImagesFromTweet(containerElement);
            if (this.imageUrls.length === 0) return false;

            this.id = this.extractTweetIdFromElement(containerElement) || translate('unknownID');
            this.user = this.extractTweetUser(containerElement) || translate('unknownUser');

            return this.imageUrls.length > 0;
        } catch (e) {
            console.error("Error extracting tweet info:", e);
            return false;
        }
    }

    getAllImagesFromTweet(containerElement) {
        try {
            // 일반 타임라인과 미디어란 모두에서 이미지 찾기
            let images = [...containerElement.querySelectorAll('img[src*="pbs.twimg.com/media/"]')]
                .map(img => img.src.replace(/&name=\w+/, '&name=orig'));
            
            // 미디어란에서는 추가적인 방법으로 이미지 찾기 시도
            if (this.isMediaTab && images.length === 0) {
                // 클릭한 이미지가 있는지 확인
                const clickedImage = containerElement.tagName === 'IMG' ? 
                                    containerElement : 
                                    containerElement.querySelector('img');
                
                if (clickedImage && clickedImage.src && clickedImage.src.includes('pbs.twimg.com/media/')) {
                    // 클릭한 이미지를 추가
                    images.push(clickedImage.src.replace(/&name=\w+/, '&name=orig'));
                    
                    // 메디어란에서는 동일한 이미지를 가진 다른 트윗들이 있을 수 있음
                    // 클릭한 이미지만 처리하는 것이 안전
                }
            }
            
            // 이미지 중복 제거
            return [...new Set(images)];
        } catch (e) {
            console.error("Error getting images from tweet:", e);
            return [];
        }
    }

    extractTweetIdFromElement(containerElement) {
        try {
            // 미디어란의 경우 다른 방법으로 트윗 ID 추출 시도
            if (this.isMediaTab) {
                // 링크 탐색
                const statusLink = containerElement.querySelector('a[href*="/status/"]');
                if (statusLink) {
                    const match = statusLink.href.match(/\/status\/(\d+)/);
                    if (match) return match[1];
                }
                
                // 데이터 속성 탐색
                const linkElement = containerElement.closest('[role="link"]');
                if (linkElement && linkElement.href) {
                    const match = linkElement.href.match(/\/status\/(\d+)/);
                    if (match) return match[1];
                }
                
                return null;
            }
            
            // 일반 타임라인에서는 기존 방식 사용
            const statusLinks = containerElement.querySelectorAll('a[href*="/status/"]');
            for (const link of statusLinks) {
                const match = link.href.match(/\/status\/(\d+)/);
                if (match) return match[1];
            }
            return null;
        } catch (e) {
            console.error("Error extracting tweet ID:", e);
            return null;
        }
    }

    extractTweetUser(containerElement) {
        try {
            // 미디어란의 경우 URL에서 사용자 정보 추출 시도
            if (this.isMediaTab) {
                // 현재 URL에서 타니다면 사용자 아이디 추출 시도
                const pathMatch = window.location.pathname.match(/^\/(\w+)/);
                if (pathMatch && pathMatch[1]) {
                    return pathMatch[1];
                }
                
                // 링크에서 추출 시도
                const userLink = containerElement.querySelector('a[href^="/"]');
                if (userLink) {
                    const username = userLink.getAttribute('href').split('/')[1];
                    if (username && !username.includes('#') && !username.includes('?')) {
                        return username;
                    }
                }
                
                return null;
            }
            
            // 일반 타임라인에서는 기존 방식 사용
            const userLink = containerElement.querySelector('a[href^="/"]');
            if (!userLink) return null;
            
            const username = userLink.getAttribute('href').split('/')[1];
            if (username && !username.includes('#') && !username.includes('?')) {
                return username;
            }
            return null;
        } catch (e) {
            console.error("Error extracting tweet user:", e);
            return null;
        }
    }
}


// == ImageViewer.js ==

class ImageViewer {
    constructor() {
        this.currentIndex = 0;
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

    init(tweetElement) {
        if (!this.tweetInfo.extractFromTweet(tweetElement)) return;
        
        this.destroy();
        this.savedScrollPos = window.pageYOffset || document.documentElement.scrollTop;
        document.body.style.overflow = 'hidden';
        
        Utils.createStyleSheet(STYLE_ID, CSS);
        
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
            selectImage: (index) => this.selectImage(index),
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
    
    selectImage(index) {
        console.log(`selectImage 호출됨: index=${index}`);
        
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
                
                // UI 업데이트 - 모든 UI 요소 동기화
                this._updateAllUIElements();
                
                // 내비게이션 모드 타임아웃 설정
                this.navigation.navigationTimeout = setTimeout(() => {
                    this.navigation.isManualNavigating = false;
                }, 800); // 타임아웃 시간 줄임
            }
            
            // 포커스 설정 - 인덱스 변경여부와 관계없이 항상 실행
            this.focusCurrentImage(true);
            
            // 이미지가 제대로 로드되었는지 확인
            const targetImage = this.imageContainer.querySelector(`.image-container[data-index="${index}"] img`);
            if (targetImage && (!targetImage.complete || !targetImage.naturalWidth)) {
                // 이미지가 아직 로드 중인 경우
                console.log(`이미지 ${index}가 아직 로드 중입니다. 로드 완료 후 포커스합니다.`);
                targetImage.addEventListener('load', () => {
                    setTimeout(() => this.focusCurrentImage(true), 50);
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

// == main.js ==

(function() {
    'use strict';
    
    // 설정 플래그 - 미디어란 지원 활성화 변수
    const CONFIG = {
        enableMediaTab: true,  // 미디어란 지원 활성화
        debugMode: true        // 디버그 메시지 표시 활성화
    };
    
    // 스타일시트 생성
    Utils.createStyleSheet(STYLE_ID, CSS);
    
    // 현재 페이지가 미디어란인지 확인
    const isMediaTab = () => {
        return window.location.pathname.match(/\/[^\/]+\/media/);
    };

    // 디버그 로그 함수
    const debugLog = (message, data = null) => {
        if (CONFIG.debugMode) {
            if (data) {
                console.log(`[XcomGallery] ${message}`, data);
            } else {
                console.log(`[XcomGallery] ${message}`);
            }
        }
    };
    
    // 이미지 클릭 이벤트 핸들러
    const imageClickHandler = (event) => {
        // 이미지 요소가 있는지 확인
        const imageElement = event.target.closest('img[src*="pbs.twimg.com/media/"]');
        if (!imageElement) return;
        
        const isInMediaTab = isMediaTab();
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
        
        // 이미지 뷰어 초기화
        const viewer = new ImageViewer();
        viewer.init(containerElement);
    };
    
    // 이벤트 리스너 추가 - 캡처 오더 최상위 설정
    document.addEventListener("click", imageClickHandler, { capture: true, passive: false });
    
    // 마우스 다운 및 터치 시작 이벤트 캡처
    document.addEventListener("pointerdown", (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        
        const imageElement = event.target.closest('img[src*="pbs.twimg.com/media/"]');
        if (imageElement) {
            // 미디어란에서도 이미지 클릭 방지
            if (isMediaTab() && CONFIG.enableMediaTab) {
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
            if (isMediaTab() && CONFIG.enableMediaTab) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }
        }
    }, { capture: true, passive: false });
    
    // URL 변경 감지하여 /photo/ 경로 제거
    const cleanPhotoPath = () => {
        if (window.location.href.includes('/photo/')) {
            const newUrl = window.location.href.replace(/\/photo\/\d+$/, '');
            history.replaceState(null, '', newUrl);
        }
    };
    
    // 페이지 로드 시 URL 정리
    cleanPhotoPath();
    
    // URL 변경 감지
    try {
        const titleElement = document.querySelector('title');
        if (titleElement) {
            const urlObserver = new MutationObserver(() => {
                cleanPhotoPath();
            });
            
            urlObserver.observe(titleElement, {
                subtree: true,
                characterData: true,
                childList: true
            });
        } else {
            // title 요소를 찾을 수 없는 경우 정기적으로 확인
            let lastUrl = window.location.href;
            setInterval(() => {
                if (lastUrl !== window.location.href) {
                    lastUrl = window.location.href;
                    cleanPhotoPath();
                }
            }, 500);
        }
    } catch (e) {
        console.error("URL 감시 설정 중 오류 발생:", e);
    }
    
    // 트위터의 이미지 확대 기능 방지 - 강화 버전
    const reinforceEventPrevention = () => {
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
                const isInMediaTab = isMediaTab();
                debugLog(`강화 이미지 착취 - 미디어란: ${isInMediaTab}`, imgElement);
                
                // 미디어란이고 미디어란 지원이 활성화된 경우
                if (isInMediaTab && CONFIG.enableMediaTab) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    
                    // 이미지 클릭 핸들러 직접 호출
                    setTimeout(() => {
                        imageClickHandler({
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
    };
    
    // 이벤트 방지 강화
    reinforceEventPrevention();
    
    console.log("X.com Enhanced Image Gallery 로드 완료");
})();


