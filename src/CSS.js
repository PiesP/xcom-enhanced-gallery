export const STYLE_ID = 'xcom-image-viewer-styles';

export const CSS = `
    /* CSS 변수 기본값 (폴백) */
    :root {
        /* 색상 */
        --xcom-bg-primary: #ffffff;
        --xcom-bg-secondary: #f5f8fa;
        --xcom-bg-tertiary: #e1e8ed;
        --xcom-bg-overlay: rgba(255, 255, 255, 0.9);
        --xcom-bg-modal: rgba(0, 0, 0, 0.7);
        
        --xcom-text-primary: #14171a;
        --xcom-text-secondary: #657786;
        --xcom-text-tertiary: #aab8c2;
        --xcom-text-inverse: #ffffff;
        
        --xcom-accent-primary: #1da1f2;
        --xcom-accent-secondary: #0c7abf;
        --xcom-accent-tertiary: #e1f5fe;
        
        --xcom-border-light: #e1e8ed;
        --xcom-border-medium: #ccd6dd;
        --xcom-border-dark: #657786;
        
        /* 그림자 */
        --xcom-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
        --xcom-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
        --xcom-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
        
        /* 레이아웃 */
        --xcom-radius-sm: 4px;
        --xcom-radius-md: 8px;
        --xcom-radius-lg: 16px;
        --xcom-radius-pill: 9999px;
        
        --xcom-space-xs: 4px;
        --xcom-space-sm: 8px;
        --xcom-space-md: 16px;
        --xcom-space-lg: 24px;
        --xcom-space-xl: 32px;
        
        /* 애니메이션 */
        --xcom-transition-fast: 150ms;
        --xcom-transition-normal: 300ms;
        --xcom-transition-slow: 500ms;
        
        /* 헤더와 바 요소 */
        --xcom-header-bg: rgba(255, 255, 255, 0.85);
        --xcom-header-text: #14171a;
        --xcom-header-border: #e1e8ed;
        --xcom-header-height: 50px;
        
        --xcom-toolbar-bg: rgba(255, 255, 255, 0.85);
        --xcom-toolbar-text: #14171a;
        --xcom-toolbar-border: #e1e8ed;
        
        --xcom-thumbnail-bg: rgba(255, 255, 255, 0.85);
        --xcom-thumbnail-border: #e1e8ed;
        --xcom-thumbnail-active: #1da1f2;
        
        /* 이미지 뷰어 특수 변수 */
        --xcom-backdrop-color: rgba(0, 0, 0, 0.85);
        --xcom-indicator-bg: rgba(0, 0, 0, 0.7);
        --xcom-indicator-text: #ffffff;
        --xcom-button-hover-bg: #f5f8fa;
    }

    /* 테마 전환 시 전환 효과 */
    #xcom-image-viewer * {
        transition: background-color var(--xcom-transition-normal), 
                    color var(--xcom-transition-normal), 
                    border-color var(--xcom-transition-normal), 
                    box-shadow var(--xcom-transition-normal);
    }
    
    #xcom-image-viewer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--xcom-backdrop-color);
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
        padding: var(--xcom-space-sm) var(--xcom-space-md);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--xcom-space-sm);
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10004;
        background-color: var(--xcom-toolbar-bg);
        color: var(--xcom-toolbar-text);
        border-bottom: 1px solid var(--xcom-toolbar-border);
        box-shadow: var(--xcom-shadow-sm);
        transition: transform 0.3s ease;
        transform: translateY(0);
        height: var(--xcom-header-height);
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
        gap: var(--xcom-space-sm);
        transition: transform 0.3s ease;
        transform: translateY(0);
        z-index: 10004;
        padding: var(--xcom-space-sm) var(--xcom-space-md);
        margin-bottom: var(--xcom-space-md);
        overflow-x: auto;
        background-color: var(--xcom-thumbnail-bg);
        border-top: 1px solid var(--xcom-thumbnail-border);
    }

    .icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--xcom-space-xs) var(--xcom-space-sm);
        border: none;
        cursor: pointer;
        font-size: 16px;
        border-radius: var(--xcom-radius-sm);
        background-color: transparent;
        color: var(--xcom-toolbar-text);
        transition: all var(--xcom-transition-fast) ease;
    }

    .icon-button:hover {
        background-color: var(--xcom-button-hover-bg);
    }

    .icon-button:focus {
        outline: 2px solid var(--xcom-accent-primary);
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
        margin: var(--xcom-space-sm) 0;
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
        transition: all var(--xcom-transition-normal) ease;
        border: 3px solid transparent;
        pointer-events: auto;
        border-radius: var(--xcom-radius-sm);
    }

    .thumbnail:hover {
        transform: scale(1.05);
        box-shadow: var(--xcom-shadow-md);
    }

    .thumbnail.active {
        border-color: var(--xcom-thumbnail-active);
        transform: scale(1.1);
        box-shadow: var(--xcom-shadow-md);
    }

    .image-indicator {
        position: absolute;
        top: var(--xcom-space-sm);
        right: var(--xcom-space-sm);
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--xcom-accent-primary);
        box-shadow: var(--xcom-shadow-sm);
        pointer-events: none;
        z-index: 10003;
    }

    #current-image-indicator {
        position: fixed;
        bottom: 15px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--xcom-indicator-bg);
        color: var(--xcom-indicator-text);
        padding: var(--xcom-space-sm) var(--xcom-space-md);
        border-radius: var(--xcom-radius-pill);
        font-size: 14px;
        font-weight: bold;
        z-index: 10004;
        pointer-events: none;
        box-shadow: var(--xcom-shadow-md);
    }
    
    /* 테마 토글 버튼 */
    .theme-toggle-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--xcom-radius-sm);
        background-color: transparent;
        color: var(--xcom-toolbar-text);
        font-size: 18px;
        cursor: pointer;
        transition: all var(--xcom-transition-fast) ease;
    }

    .theme-toggle-button:hover {
        background-color: var(--xcom-button-hover-bg);
    }

    /* 반응형 스타일 */
    @media (max-width: 768px) {
        .icon-button {
            padding: var(--xcom-space-xs);
            font-size: 14px;
        }

        #optionsBar {
            flex-wrap: wrap;
            justify-content: space-around;
            padding: var(--xcom-space-xs);
        }

        .thumbnail {
            height: 50px;
        }
        
        /* 모바일 화면에서 더 직관적인 컨트롤 */
        #optionsBar > div {
            flex: 1;
            justify-content: center;
        }
        
        /* 섹션별 간격 조정 */
        #optionsBar > div:nth-child(2) {
            order: 3; /* 모바일에서는 맨 아래로 */
            width: 100%;
            margin-top: var(--xcom-space-xs);
        }
    }
    
    /* 키보드 포커스 스타일 */
    :focus-visible {
        outline: 2px solid var(--xcom-accent-primary);
        outline-offset: 2px;
    }
    
    /* 애니메이션 효과 */
    @keyframes pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
    }
    
    .loading {
        animation: pulse 1.5s infinite ease-in-out;
    }
`;