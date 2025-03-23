import { Utils } from "../Utils.js";

/**
 * 썸네일 관리 클래스
 */
export class ThumbnailManager {
    constructor(thumbnailBar) {
        this.thumbnailBar = thumbnailBar;
        this.currentIndex = 0;
    }
    
    /**
     * 현재 인덱스 설정
     * @param {number} index - 현재 이미지 인덱스
     */
    setCurrentIndex(index) {
        this.currentIndex = index;
    }
    
    /**
     * 썸네일 포커스 업데이트
     */
    updateThumbnailFocus() {
        if (!this.thumbnailBar) return;

        const thumbs = this.thumbnailBar.querySelectorAll('.thumbnail');
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

        const selectedThumb = this.thumbnailBar.querySelector(`.thumbnail[data-index="${this.currentIndex}"]`);
        if (selectedThumb) {
            selectedThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }
    
    /**
     * 썸네일 클릭 핸들러 설정
     * @param {function} clickHandler - 클릭 핸들러 함수
     */
    setupThumbnailClickHandlers(clickHandler) {
        if (!this.thumbnailBar) return;
        
        const thumbs = this.thumbnailBar.querySelectorAll('.thumbnail');
        thumbs.forEach(thumb => {
            const index = parseInt(thumb.dataset.index);
            
            // 기존 핸들러 제거
            const newThumb = thumb.cloneNode(true);
            thumb.parentNode.replaceChild(newThumb, thumb);
            
            // 디바운스된 새 핸들러 할당
            const handleThumbClick = Utils.debounce((e) => {
                // 버블링 멈춤
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                
                // 썸네일 클릭 시 이미지 선택
                clickHandler(index, true);
                
                // 클릭된 썸네일 효과 추가
                newThumb.style.transform = 'scale(1.2)';
                newThumb.style.boxShadow = '0 0 10px rgba(29, 161, 242, 0.9)';
                
                // 효과 원복
                setTimeout(() => {
                    if (newThumb.classList.contains('active')) {
                        newThumb.style.transform = 'scale(1.1)';
                        newThumb.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.7)';
                    } else {
                        newThumb.style.transform = '';
                        newThumb.style.boxShadow = '';
                    }
                }, 300);
                
                return false;
            }, 300, true);
            
            newThumb.addEventListener('click', handleThumbClick, { capture: true });
            
            // 키보드 접근성
            newThumb.setAttribute('role', 'tab');
            newThumb.setAttribute('aria-selected', index === this.currentIndex ? 'true' : 'false');
            newThumb.setAttribute('tabindex', '0');
            
            newThumb.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    clickHandler(index, true);
                }
            });
        });
    }
}