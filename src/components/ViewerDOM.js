import { Utils } from "../Utils.js";
import { translate, getLocale, setLocale } from "../I18N/index.js";
import { LanguageSelector } from "./LanguageSelector.js";
import { ThemeManager } from "../theme/ThemeManager.js";
import { LayoutManager } from "../theme/LayoutManager.js";

export class ViewerDOM {
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
        optionsBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: ${Utils.addAlpha(bgColor, 0.8)};
            color: ${textColor};
            padding: 0 10px;
            height: 50px;
        `;
        optionsBar.setAttribute('role', 'toolbar');
        optionsBar.setAttribute('aria-label', 'Image Viewer Controls');

        // 왼쪽, 중앙, 오른쪽 섹션 생성
        const leftSection = document.createElement('div');
        leftSection.style.cssText = 'display: flex; align-items: center; gap: 5px;';
        
        const centerSection = document.createElement('div');
        centerSection.style.cssText = 'display: flex; align-items: center; flex: 1; justify-content: center;';
        
        const rightSection = document.createElement('div');
        rightSection.style.cssText = 'display: flex; align-items: center; gap: 5px;';

        // 네비게이션 버튼 생성
        const prevBtn = this.createIconButton('fa-solid fa-arrow-left', handlers.prevImage, translate('viewer.controls.prev'));
        const nextBtn = this.createIconButton('fa-solid fa-arrow-right', handlers.nextImage, translate('viewer.controls.next'));

        // 이미지 선택 드롭다운 생성
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
            handlers.selectImage(parseInt(imageSelect.value), true);
        });

        // 이미지 조정 버튼 생성
        const fitWidthBtn = this.createIconButton('fa-solid fa-arrows-left-right', () => handlers.adjustImages('width'), translate('viewer.modes.fitWidth'));
        const fitHeightBtn = this.createIconButton('fa-solid fa-arrows-up-down', () => handlers.adjustImages('height'), translate('viewer.modes.fitHeight'));
        const fitWindowBtn = this.createIconButton('fa-solid fa-expand', () => handlers.adjustImages('window'), translate('viewer.modes.fitWindow'));
        const originalSizeBtn = this.createIconButton('fa-solid fa-image', () => handlers.adjustImages('original'), translate('viewer.modes.original'));

        // 다운로드 버튼 생성
        const downloadCurrentBtn = this.createIconButton('fa-solid fa-download', handlers.downloadCurrentImage, translate('viewer.controls.download'));
        const downloadAllBtn = this.createIconButton('fa-solid fa-file-zipper', handlers.downloadAllImages, translate('viewer.controls.downloadZip'));

        // 테마 토글 버튼 생성
        const themeToggleBtn = ThemeManager.createThemeToggle();
        
        // 레이아웃 토글 버튼 생성
        const layoutToggleBtn = LayoutManager.createLayoutToggle();
        
        // 언어 선택기 생성
        const languageSelector = LanguageSelector.createLanguageDropdown((newLocale) => {
            // UI 요소들 언어 변경 적용
            if (handlers.onLanguageChange) {
                handlers.onLanguageChange(newLocale);
            }
        });
        
        // 닫기 버튼 생성
        const closeBtn = this.createIconButton('fa-solid fa-xmark', handlers.close, translate('viewer.controls.close'));
        
        // 요소들을 섹션에 배치
        leftSection.append(prevBtn, imageSelect, nextBtn);
        
        centerSection.append(
            fitWidthBtn,
            fitHeightBtn,
            fitWindowBtn,
            originalSizeBtn
        );
        
        rightSection.append(
            downloadCurrentBtn,
            downloadAllBtn,
            themeToggleBtn,
            layoutToggleBtn,
            languageSelector,
            closeBtn
        );

        // 섹션들을 옵션바에 추가
        optionsBar.append(leftSection, centerSection, rightSection);

        return optionsBar;
    }

    createIconButton(iconClass, onClick, tooltipText) {
        try {
            const { bgColor, textColor } = Utils.getUserUIColor();

            const button = document.createElement('button');
            button.className = 'icon-button';
            button.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
            button.style.background = 'transparent';
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
            padding: 60px 0 100px 0;
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
                handlers.selectImage(parseInt(index), true);
            } else {
                handlers.focusImage(parseInt(index));
            }
            
            return false;
        }, 300, true); // 300ms 디바운스, 첫 클릭 즉시 실행

        // 단일 이벤트 리스너로 간소화 (중복 방지)
        imgContainer.addEventListener('click', handleImageClick, { capture: true });
        
        // 마우스 오버 효과
        imgContainer.addEventListener('mouseenter', () => {
            imgContainer.style.boxShadow = 'var(--xcom-shadow-md)';
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
        thumbnailBar.style.cssText = `
            background: ${Utils.addAlpha(bgColor, 0.8)};
            border-top: 1px solid var(--xcom-thumbnail-border);
        `;

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
                handlers.selectImage(parseInt(index), true);
                
                // 클릭된 썸네일 효과 추가
                thumb.style.transform = 'scale(1.2)';
                thumb.style.boxShadow = 'var(--xcom-shadow-md)';
                
                // 효과 원복
                setTimeout(() => {
                    if (thumb.classList.contains('active')) {
                        thumb.style.transform = 'scale(1.1)';
                        thumb.style.boxShadow = 'var(--xcom-shadow-md)';
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
        const { bgColor, textColor } = Utils.getUserUIColor();
        
        const indicator = document.createElement('div');
        indicator.id = 'current-image-indicator';
        indicator.textContent = translate('viewer.indicators.currentImage', { current: currentIndex + 1, total: totalImages });
        indicator.style.cssText = `
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--xcom-indicator-bg);
            color: var(--xcom-indicator-text);
            padding: var(--xcom-space-sm) var(--xcom-space-md);
            border-radius: var(--xcom-radius-pill);
            font-size: 14px;
            font-weight: bold;
            z-index: 10002;
            box-shadow: var(--xcom-shadow-md);
        `;
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