import { StorageUtils } from "../utils/StorageUtils.js";
import { Utils } from "../Utils.js";
import { themeVariables } from "./themeVariables.js";

/**
 * 테마 관리 클래스
 * 라이트/다크 모드와 같은 테마 설정을 관리하고 적용합니다.
 */
export class ThemeManager {
  static LOCAL_STORAGE_KEY = "xcom-gallery-theme";
  static THEMES = {
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
  };
  
  // 현재 테마
  static currentTheme = null;
  
  // 테마 변경 리스너
  static themeChangeListeners = [];
  
  /**
   * 테마 관리자 초기화
   * @returns {string} 적용된 테마
   */
  static initialize() {
    // 저장된 테마 설정 불러오기
    const savedTheme = StorageUtils.getLocalStorageItem(
      this.LOCAL_STORAGE_KEY, 
      this.THEMES.SYSTEM
    );
    
    // 시스템 설정 감지 및 이벤트 리스너 설정
    this.setupSystemThemeListener();
    
    // 테마 적용
    return this.setTheme(savedTheme, false);
  }
  
  /**
   * 시스템 테마 설정 감지 리스너 설정
   */
  static setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      // 변경 감지 리스너
      const handleChange = (e) => {
        if (this.currentTheme === this.THEMES.SYSTEM) {
          this.applyThemeVariables(e.matches ? this.THEMES.DARK : this.THEMES.LIGHT);
          this.notifyThemeChangeListeners();
        }
      };
      
      // 현대 이벤트 리스너 API 사용
      try {
        mediaQuery.addEventListener("change", handleChange);
      } catch (e) {
        // 구형 브라우저 호환성
        mediaQuery.addListener(handleChange);
      }
    }
  }
  
  /**
   * 테마 설정
   * @param {string} theme - 테마 식별자 (light, dark, system)
   * @param {boolean} save - 설정 저장 여부
   * @returns {string} 적용된 테마
   */
  static setTheme(theme, save = true) {
    // 유효한 테마인지 확인
    if (!Object.values(this.THEMES).includes(theme)) {
      theme = this.THEMES.SYSTEM;
    }
    
    this.currentTheme = theme;
    
    // 시스템 테마일 경우 현재 시스템 설정 감지
    if (theme === this.THEMES.SYSTEM) {
      const isDarkMode = window.matchMedia && 
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      this.applyThemeVariables(isDarkMode ? this.THEMES.DARK : this.THEMES.LIGHT);
    } else {
      this.applyThemeVariables(theme);
    }
    
    // 테마 설정 저장
    if (save) {
      StorageUtils.setLocalStorageItem(this.LOCAL_STORAGE_KEY, theme);
    }
    
    // 변경 알림
    this.notifyThemeChangeListeners();
    
    return this.getEffectiveTheme();
  }
  
  /**
   * 현재 적용된 테마 가져오기
   * @returns {string} 현재 적용 중인 테마
   */
  static getCurrentTheme() {
    return this.currentTheme || this.THEMES.SYSTEM;
  }
  
  /**
   * 실제로 적용된 테마 가져오기 (시스템 테마가 아닌 실제 표시 테마)
   * @returns {string} 효과적으로 적용된 테마
   */
  static getEffectiveTheme() {
    if (this.currentTheme !== this.THEMES.SYSTEM) {
      return this.currentTheme;
    }
    
    // 시스템 테마일 경우 현재 시스템 설정 반환
    return window.matchMedia && 
      window.matchMedia("(prefers-color-scheme: dark)").matches ? 
      this.THEMES.DARK : this.THEMES.LIGHT;
  }
  
  /**
   * 테마 변수 적용
   * @param {string} theme - 적용할 테마
   */
  static applyThemeVariables(theme) {
    const variables = theme === this.THEMES.DARK ? 
      themeVariables.dark : themeVariables.light;
    
    // CSS 변수를 루트 요소에 적용
    const style = document.documentElement.style;
    
    // 모든 변수 적용
    Object.entries(variables).forEach(([key, value]) => {
      style.setProperty(`--xcom-${key}`, value);
    });
    
    // 테마 클래스 적용 (다른 스타일링 방식에 유용)
    document.documentElement.setAttribute("data-theme", theme);
  }
  
  /**
   * 다음 테마로 전환 (순환)
   * @returns {string} 새로 적용된 테마
   */
  static cycleTheme() {
    const themes = Object.values(this.THEMES);
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    
    return this.setTheme(themes[nextIndex]);
  }
  
  /**
   * 테마 변경 리스너 등록
   * @param {Function} listener - 테마 변경 시 호출될 콜백 함수
   */
  static addThemeChangeListener(listener) {
    if (typeof listener === "function" && 
        !this.themeChangeListeners.includes(listener)) {
      this.themeChangeListeners.push(listener);
    }
  }
  
  /**
   * 테마 변경 리스너 제거
   * @param {Function} listener - 제거할 리스너
   */
  static removeThemeChangeListener(listener) {
    const index = this.themeChangeListeners.indexOf(listener);
    if (index !== -1) {
      this.themeChangeListeners.splice(index, 1);
    }
  }
  
  /**
   * 테마 변경 리스너에 알림
   */
  static notifyThemeChangeListeners() {
    const theme = this.getEffectiveTheme();
    this.themeChangeListeners.forEach(listener => {
      try {
        listener(theme);
      } catch (e) {
        console.error("테마 변경 리스너 오류:", e);
      }
    });
  }
  
  /**
   * 테마 전환 버튼 생성
   * @returns {HTMLElement} 테마 전환 버튼
   */
  static createThemeToggle() {
    const { bgColor, textColor } = Utils.getUserUIColor();
    
    const button = document.createElement("button");
    button.className = "theme-toggle-button icon-button";
    button.setAttribute("aria-label", "테마 전환");
    button.title = "테마 전환 (라이트/다크)";
    
    // 현재 테마에 맞는 아이콘 설정
    this.updateThemeToggleIcon(button);
    
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.cycleTheme();
      this.updateThemeToggleIcon(button);
    });
    
    // 테마 변경 시 아이콘 업데이트
    this.addThemeChangeListener(() => {
      this.updateThemeToggleIcon(button);
    });
    
    return button;
  }
  
  /**
   * 테마 토글 버튼 아이콘 업데이트
   * @param {HTMLElement} button - 테마 토글 버튼
   */
  static updateThemeToggleIcon(button) {
    const theme = this.getEffectiveTheme();
    
    button.innerHTML = theme === this.THEMES.DARK
      ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
  }
}