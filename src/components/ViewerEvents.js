import { Utils } from "../Utils.js";

export class ViewerEvents {
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