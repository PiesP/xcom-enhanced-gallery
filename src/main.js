import { Utils } from "./Utils.js";
import { CSS, STYLE_ID } from "./CSS.js";
import { URLManager } from "./URLManager.js";
import { EventListeners } from "./EventListeners.js";
import { debugLog } from "./debug.js";

(function() {
    'use strict';
    
    function init() {
        debugLog('초기화 시작');
        
        // 스타일시트 생성
        Utils.createStyleSheet(STYLE_ID, CSS);
        
        // URL 초기 정리 및 변경 감지 설정
        URLManager.cleanPhotoPath();
        URLManager.setupURLChangeDetection();
        
        // 이벤트 리스너 설정
        EventListeners.setupImageClickHandler();
        EventListeners.setupTouchAndMouseHandlers();
        EventListeners.setupEventPreventionReinforcement();
        
        console.log("X.com Enhanced Image Gallery 로드 완료");
    }
    
    // 애플리케이션 초기화
    init();
})();