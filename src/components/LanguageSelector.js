import { translate, setLocale, getLocale, getSupportedLocales } from "../I18N/index.js";
import { Utils } from "../Utils.js";

/**
 * 언어 선택 드롭다운 메뉴 컴포넌트
 */
export class LanguageSelector {
    /**
     * 언어 선택 드롭다운 메뉴 생성
     * @param {Function} onLanguageChange - 언어 변경 시 호출될 콜백 함수
     * @returns {HTMLElement} 언어 선택 드롭다운 메뉴 요소
     */
    static createLanguageDropdown(onLanguageChange) {
        const { bgColor, textColor } = Utils.getUserUIColor();

        // 언어 목록 가져오기
        const supportedLocales = getSupportedLocales();
        
        // 현재 선택된 언어 가져오기
        const currentLocale = getLocale();
        
        // 언어 이름 매핑
        const localeNames = {
            'en': 'English',
            'ko': '한국어',
            'ja': '日本語',
            'zh-CN': '简体中文',
            'es': 'Español',
            'fr': 'Français'
        };
        
        // 컨테이너 생성
        const container = document.createElement('div');
        container.className = 'language-selector-container';
        container.style.cssText = `
            display: flex;
            align-items: center;
            margin-left: 10px;
        `;
        
        // 모든 컨테이너 이벤트 중지 - 상위 요소로 전파 방지
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { capture: true });
        
        // 아이콘 생성
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-language';
        icon.style.cssText = `
            margin-right: 5px;
            font-size: 16px;
        `;
        
        // 드롭다운 생성
        const select = document.createElement('select');
        select.id = 'language-select';
        select.className = 'language-select';
        select.style.cssText = `
            background: ${bgColor};
            color: ${textColor};
            border: none;
            border-radius: 4px;
            padding: 2px 5px;
            font-size: 14px;
            cursor: pointer;
        `;
        
        // 포커스/클릭 시 이벤트 전파 중지
        select.addEventListener('focus', (e) => {
            e.stopPropagation();
        }, { capture: true });
        
        select.addEventListener('click', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { capture: true });
        
        // 각 언어에 대한 옵션 추가
        supportedLocales.forEach(locale => {
            const option = document.createElement('option');
            option.value = locale;
            option.textContent = localeNames[locale] || locale;
            option.selected = locale === currentLocale;
            select.appendChild(option);
        });
        
        // 언어 변경 이벤트 핸들러 - 철저한 이벤트 제어
        select.addEventListener('change', (e) => {
            // 이벤트 전파 중지
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            
            const selectedLocale = select.value;
            if (setLocale(selectedLocale)) {
                // 로그 추가
                console.log(`언어 변경: ${selectedLocale}`);
                
                // 로컬 스토리지에 언어 설정 저장
                try {
                    localStorage.setItem('xcom-gallery-locale', selectedLocale);
                } catch (e) {
                    console.warn('언어 설정 저장 오류:', e);
                }
                
                // 안전한 방식으로 콜백 호출
                if (typeof onLanguageChange === 'function') {
                    // 비동기적으로 호출하여 현재 이벤트 루프에 영향을 주지 않도록 함
                    setTimeout(() => {
                        try {
                            onLanguageChange(selectedLocale);
                        } catch (err) {
                            console.error('언어 변경 콜백 오류:', err);
                        }
                    }, 0);
                }
                
                // 성공 메시지 표시
                const toast = document.createElement('div');
                toast.textContent = `언어가 ${localeNames[selectedLocale]}로 변경되었습니다.`;
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 10010;
                    font-size: 14px;
                `;
                document.body.appendChild(toast);
                
                // 3초 후 토스트 메시지 자동 삭제
                setTimeout(() => {
                    if (toast && toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 3000);
            }
            
            // 이벤트 전파 방지 강화
            return false;
        }, { capture: true });
        
        // 요소 조립
        container.appendChild(icon);
        container.appendChild(select);
        
        return container;
    }
}