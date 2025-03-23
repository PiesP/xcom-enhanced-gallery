import { StorageUtils } from "../utils/StorageUtils.js";
import { Utils } from "../Utils.js";

/**
 * 레이아웃 관리 클래스
 * 반응형 레이아웃과 UI 배치를 관리합니다.
 */
export class LayoutManager {
  static LOCAL_STORAGE_KEY = "xcom-gallery-layout";
  
  // 레이아웃 모드
  static LAYOUT_MODES = {
    COMPACT: "compact",
    COMFORTABLE: "comfortable",
    CUSTOM: "custom"
  };
  
  // 현재 레이아웃 모드
  static currentMode = null;
  
  // 레이아웃 변경 리스너
  static layoutChangeListeners = [];
  
  // 화면 크기 분기점
  static BREAKPOINTS = {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE: 1440
  };
  
  /**
   * 레이아웃 관리자 초기화
   * @returns {string} 적용된 레이아웃 모드
   */
  static initialize() {
    // 저장된 레이아웃 설정 불러오기
    const savedMode = StorageUtils.getLocalStorageItem(
      this.LOCAL_STORAGE_KEY, 
      this.LAYOUT_MODES.COMFORTABLE
    );
    
    // 화면 크기 변경 감지 리스너 설정
    this.setupResizeListener();
    
    // 레이아웃 적용
    return this.setLayoutMode(savedMode, false);
  }
  
  /**
   * 화면 크기 변경 감지 리스너 설정
   */
  static setupResizeListener() {
    // 리사이즈 이벤트 디바운싱
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.applyResponsiveLayout();
        this.notifyLayoutChangeListeners();
      }, 200);
    });
  }
  
  /**
   * 현재 화면 크기에 기반한 반응형 레이아웃 적용
   */
  static applyResponsiveLayout() {
    const width = window.innerWidth;
    
    // 사용자 정의 레이아웃인 경우 변경하지 않음
    if (this.currentMode === this.LAYOUT_MODES.CUSTOM) {
      return;
    }
    
    // 화면 크기에 따른 레이아웃 조정
    if (width <= this.BREAKPOINTS.MOBILE) {
      document.documentElement.setAttribute('data-layout', 'mobile');
      // 모바일 뷰에서는 항상 컴팩트 모드 강제
      this.applyCompactLayout();
    } else if (width <= this.BREAKPOINTS.TABLET) {
      document.documentElement.setAttribute('data-layout', 'tablet');
      // 태블릿은 현재 선택된 모드 적용
      this.applyCurrentLayoutMode();
    } else {
      document.documentElement.setAttribute('data-layout', 'desktop');
      // 데스크톱은 현재 선택된 모드 적용
      this.applyCurrentLayoutMode();
    }
  }
  
  /**
   * 레이아웃 모드 설정
   * @param {string} mode - 레이아웃 모드 (compact, comfortable, custom)
   * @param {boolean} save - 설정 저장 여부
   * @returns {string} 적용된 모드
   */
  static setLayoutMode(mode, save = true) {
    // 유효한 모드인지 확인
    if (!Object.values(this.LAYOUT_MODES).includes(mode)) {
      mode = this.LAYOUT_MODES.COMFORTABLE;
    }
    
    this.currentMode = mode;
    
    // 모드 적용
    this.applyCurrentLayoutMode();
    
    // 레이아웃 설정 저장
    if (save) {
      StorageUtils.setLocalStorageItem(this.LOCAL_STORAGE_KEY, mode);
    }
    
    // 변경 알림
    this.notifyLayoutChangeListeners();
    
    return mode;
  }
  
  /**
   * 현재 레이아웃 모드 적용
   */
  static applyCurrentLayoutMode() {
    switch (this.currentMode) {
      case this.LAYOUT_MODES.COMPACT:
        this.applyCompactLayout();
        break;
      case this.LAYOUT_MODES.COMFORTABLE:
        this.applyComfortableLayout();
        break;
      case this.LAYOUT_MODES.CUSTOM:
        // 사용자 정의 레이아웃은 변경하지 않음
        break;
      default:
        this.applyComfortableLayout();
    }
  }
  
  /**
   * 컴팩트 레이아웃 적용
   * 작은 화면이나 제한된 공간에 최적화
   */
  static applyCompactLayout() {
    document.documentElement.setAttribute('data-density', 'compact');
    
    // 옵션바와 썸네일바에 컴팩트 스타일 적용
    const optionsBar = document.getElementById('optionsBar');
    if (optionsBar) {
      optionsBar.classList.add('compact');
      
      // 그룹 내 요소 간격 조정
      const sections = optionsBar.querySelectorAll('div');
      sections.forEach(section => {
        section.style.gap = 'var(--xcom-space-xs)';
      });
    }
    
    const thumbnailBar = document.getElementById('thumbnailBar');
    if (thumbnailBar) {
      thumbnailBar.classList.add('compact');
      thumbnailBar.style.height = '70px';
    }
    
    // 썸네일 크기 조정
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
      thumb.style.height = '50px';
    });
  }
  
  /**
   * 편안한 레이아웃 적용
   * 충분한 여백과 시각적 여유 제공
   */
  static applyComfortableLayout() {
    document.documentElement.setAttribute('data-density', 'comfortable');
    
    // 옵션바와 썸네일바에 편안한 스타일 적용
    const optionsBar = document.getElementById('optionsBar');
    if (optionsBar) {
      optionsBar.classList.remove('compact');
      
      // 그룹 내 요소 간격 조정
      const sections = optionsBar.querySelectorAll('div');
      sections.forEach(section => {
        section.style.gap = 'var(--xcom-space-sm)';
      });
    }
    
    const thumbnailBar = document.getElementById('thumbnailBar');
    if (thumbnailBar) {
      thumbnailBar.classList.remove('compact');
      thumbnailBar.style.height = '80px';
    }
    
    // 썸네일 크기 조정
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
      thumb.style.height = '60px';
    });
  }
  
  /**
   * 현재 레이아웃 모드 가져오기
   * @returns {string} 현재 레이아웃 모드
   */
  static getCurrentMode() {
    return this.currentMode || this.LAYOUT_MODES.COMFORTABLE;
  }
  
  /**
   * 레이아웃 변경 리스너 등록
   * @param {Function} listener - 레이아웃 변경 시 호출될 콜백 함수
   */
  static addLayoutChangeListener(listener) {
    if (typeof listener === "function" && 
        !this.layoutChangeListeners.includes(listener)) {
      this.layoutChangeListeners.push(listener);
    }
  }
  
  /**
   * 레이아웃 변경 리스너 제거
   * @param {Function} listener - 제거할 리스너
   */
  static removeLayoutChangeListener(listener) {
    const index = this.layoutChangeListeners.indexOf(listener);
    if (index !== -1) {
      this.layoutChangeListeners.splice(index, 1);
    }
  }
  
  /**
   * 레이아웃 변경 리스너에 알림
   */
  static notifyLayoutChangeListeners() {
    const mode = this.getCurrentMode();
    this.layoutChangeListeners.forEach(listener => {
      try {
        listener(mode);
      } catch (e) {
        console.error("레이아웃 변경 리스너 오류:", e);
      }
    });
  }
  
  /**
   * 레이아웃 모드 토글 버튼 생성
   * @returns {HTMLElement} 레이아웃 모드 토글 버튼
   */
  static createLayoutToggle() {
    const { bgColor, textColor } = Utils.getUserUIColor();
    
    const button = document.createElement("button");
    button.className = "layout-toggle-button icon-button";
    button.setAttribute("aria-label", "레이아웃 모드 전환");
    button.title = "레이아웃 모드 전환 (컴팩트/편안함)";
    
    // 현재 모드에 맞는 아이콘 설정
    this.updateLayoutToggleIcon(button);
    
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 모드 토글
      const newMode = this.currentMode === this.LAYOUT_MODES.COMPACT
        ? this.LAYOUT_MODES.COMFORTABLE
        : this.LAYOUT_MODES.COMPACT;
      
      this.setLayoutMode(newMode);
      this.updateLayoutToggleIcon(button);
    });
    
    // 레이아웃 변경 시 아이콘 업데이트
    this.addLayoutChangeListener(() => {
      this.updateLayoutToggleIcon(button);
    });
    
    return button;
  }
  
  /**
   * 레이아웃 토글 버튼 아이콘 업데이트
   * @param {HTMLElement} button - 레이아웃 토글 버튼
   */
  static updateLayoutToggleIcon(button) {
    const mode = this.getCurrentMode();
    
    button.innerHTML = mode === this.LAYOUT_MODES.COMPACT
      ? '<i class="fa-solid fa-expand" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-compress" aria-hidden="true"></i>';
  }
}