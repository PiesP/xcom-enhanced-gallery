export class ViewerNavigation {
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

    selectImage(index, imagesCount, smooth = true) {
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