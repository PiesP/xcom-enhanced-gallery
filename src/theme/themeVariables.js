/**
 * 테마 변수 정의
 * 앱 전체에서 사용되는 색상, 간격, 크기 등의 디자인 변수
 */
export const themeVariables = {
  // 라이트 테마 변수
  light: {
    // 색상
    "bg-primary": "#ffffff",
    "bg-secondary": "#f5f8fa",
    "bg-tertiary": "#e1e8ed",
    "bg-overlay": "rgba(255, 255, 255, 0.9)",
    "bg-modal": "rgba(0, 0, 0, 0.7)",
    
    "text-primary": "#14171a",
    "text-secondary": "#657786",
    "text-tertiary": "#aab8c2",
    "text-inverse": "#ffffff",
    
    "accent-primary": "#1da1f2",
    "accent-secondary": "#0c7abf",
    "accent-tertiary": "#e1f5fe",
    
    "border-light": "#e1e8ed",
    "border-medium": "#ccd6dd",
    "border-dark": "#657786",
    
    // 그림자
    "shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.1)",
    "shadow-md": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "shadow-lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
    
    // 효과
    "opacity-disabled": "0.5",
    "opacity-hover": "0.8",
    
    // 레이아웃
    "radius-sm": "4px",
    "radius-md": "8px",
    "radius-lg": "16px",
    "radius-pill": "9999px",
    
    "space-xs": "4px",
    "space-sm": "8px",
    "space-md": "16px",
    "space-lg": "24px",
    "space-xl": "32px",
    
    // 애니메이션
    "transition-fast": "150ms",
    "transition-normal": "300ms",
    "transition-slow": "500ms",
    
    // 헤더와 바 요소
    "header-bg": "rgba(255, 255, 255, 0.85)",
    "header-text": "#14171a",
    "header-border": "#e1e8ed",
    "header-height": "50px",
    
    "toolbar-bg": "rgba(255, 255, 255, 0.85)",
    "toolbar-text": "#14171a",
    "toolbar-border": "#e1e8ed",
    
    "thumbnail-bg": "rgba(255, 255, 255, 0.85)",
    "thumbnail-border": "#e1e8ed",
    "thumbnail-active": "#1da1f2",
    
    // 이미지 뷰어 특수 변수
    "backdrop-color": "rgba(0, 0, 0, 0.85)",
    "indicator-bg": "rgba(0, 0, 0, 0.7)",
    "indicator-text": "#ffffff",
    "button-hover-bg": "#f5f8fa",
  },
  
  // 다크 테마 변수
  dark: {
    // 색상
    "bg-primary": "#15202b",
    "bg-secondary": "#1c2938",
    "bg-tertiary": "#243447",
    "bg-overlay": "rgba(21, 32, 43, 0.9)",
    "bg-modal": "rgba(0, 0, 0, 0.85)",
    
    "text-primary": "#ffffff",
    "text-secondary": "#8899a6",
    "text-tertiary": "#66757f",
    "text-inverse": "#15202b",
    
    "accent-primary": "#1da1f2",
    "accent-secondary": "#1a91da",
    "accent-tertiary": "#0c2d48",
    
    "border-light": "#38444d",
    "border-medium": "#536471",
    "border-dark": "#8899a6",
    
    // 그림자
    "shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.3)",
    "shadow-md": "0 4px 6px rgba(0, 0, 0, 0.4)",
    "shadow-lg": "0 10px 15px rgba(0, 0, 0, 0.5)",
    
    // 효과
    "opacity-disabled": "0.5",
    "opacity-hover": "0.9",
    
    // 레이아웃
    "radius-sm": "4px",
    "radius-md": "8px",
    "radius-lg": "16px",
    "radius-pill": "9999px",
    
    "space-xs": "4px",
    "space-sm": "8px",
    "space-md": "16px",
    "space-lg": "24px",
    "space-xl": "32px",
    
    // 애니메이션
    "transition-fast": "150ms",
    "transition-normal": "300ms",
    "transition-slow": "500ms",
    
    // 헤더와 바 요소
    "header-bg": "rgba(21, 32, 43, 0.85)",
    "header-text": "#ffffff",
    "header-border": "#38444d",
    "header-height": "50px",
    
    "toolbar-bg": "rgba(21, 32, 43, 0.85)",
    "toolbar-text": "#ffffff",
    "toolbar-border": "#38444d",
    
    "thumbnail-bg": "rgba(21, 32, 43, 0.85)",
    "thumbnail-border": "#38444d",
    "thumbnail-active": "#1da1f2",
    
    // 이미지 뷰어 특수 변수
    "backdrop-color": "rgba(0, 0, 0, 0.95)",
    "indicator-bg": "rgba(29, 161, 242, 0.2)",
    "indicator-text": "#ffffff",
    "button-hover-bg": "#243447",
  }
};