// ==UserScript==
// @name         X.com Enhanced Image Gallery
// @namespace    https://github.com/PiesP/xcom-enhanced-gallery
// @version      0.9.3
// @description  Enhanced image viewer for X.com that displays original-sized images in a vertical gallery with adjustable view modes and batch download options.
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/js/all.min.js
// ==/UserScript==

(function () {
    'use strict';

    const I18N = {
        ko: {
            prevImage: '이전 이미지',
            nextImage: '다음 이미지',
            fitWidth: '너비 맞춤',
            fitHeight: '높이 맞춤',
            fitWindow: '창 맞춤',
            originalSize: '원본 크기',
            saveCurrentImage: '현재 이미지 저장',
            saveAllImages: '모든 이미지 저장',
            close: '닫기 (Esc키로도 닫힘)',
            downloadFailed: '이미지 다운로드 실패',
            unknownUser: '알 수 없는 사용자',
            unknownID: '알 수 없는 ID',
            currentImageIndicator: '현재 이미지: %1 / %2',
            positionAdaptive: '위치 자동 조정',
            positionTop: '이미지 상단 정렬',
            positionCenter: '이미지 중앙 정렬'
        },
        en: {
            prevImage: 'Previous Image',
            nextImage: 'Next Image',
            fitWidth: 'Fit to Width',
            fitHeight: 'Fit to Height',
            fitWindow: 'Fit to Window',
            originalSize: 'Original Size',
            saveCurrentImage: 'Save Current Image',
            saveAllImages: 'Save All Images',
            close: 'Close (or press Esc)',
            downloadFailed: 'Image download failed',
            unknownUser: 'UnknownUser',
            unknownID: 'UnknownID',
            currentImageIndicator: 'Current image: %1 of %2',
            positionAdaptive: 'Adaptive Image Position',
            positionTop: 'Align Image to Top',
            positionCenter: 'Center Image in View'
        }
    };

    const userLang = (navigator.language || navigator.userLanguage).split('-')[0];
    const lang = I18N[userLang] ? userLang : 'ko';

    function _(key) {
        return I18N[lang][key] || I18N.ko[key];
    }

    const STYLE_ID = 'xcom-image-viewer-styles';
    const CSS = `
        #xcom-image-viewer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            overflow-y: auto;
            z-index: 10000;
            overscroll-behavior: contain;
            touch-action: pan-y pinch-zoom;
        }

        #optionsBar {
            width: 100%;
            padding: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 10004;
            transition: transform 0.3s ease;
            transform: translateY(0);
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
            gap: 5px;
            transition: transform 0.3s ease;
            transform: translateY(0);
            z-index: 10004;
            padding: 0 10px;
            overflow-x: auto;
        }

        .icon-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px 10px;
            border: none;
            cursor: pointer;
            font-size: 16px;
            border-radius: 4px;
        }

        .icon-button:hover {
            opacity: 0.8;
        }

        .icon-button:focus {
            outline: 2px solid #1da1f2;
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
            margin: 5px 0;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            user-select: none;
            pointer-events: auto;
            z-index: 10001;
        }

        .thumbnail {
            height: 60px;
            max-height: 60px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 3px solid transparent;
            pointer-events: auto;
        }

        .thumbnail:hover {
            transform: scale(1.05);
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
        }

        .thumbnail.active {
            border-color: #1da1f2;
            transform: scale(1.1);
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
        }

        .image-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #1da1f2;
            box-shadow: 0 0 5px white;
            pointer-events: none;
            z-index: 10003;
        }

        #current-image-indicator {
            position: fixed;
            top: 10px;
            right: 100px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10004;
            pointer-events: none;
        }

        @media (max-width: 768px) {
            .icon-button {
                padding: 8px;
            }

            #optionsBar {
                flex-wrap: wrap;
                justify-content: space-around;
            }

            .thumbnail {
                height: 50px;
            }
        }
    `;

    class Utils {
        static getLocalStorageItem(key, defaultValue) {
            try {
                const value = localStorage.getItem(key);
                return value !== null ? value : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        }

        static setLocalStorageItem(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn(`localStorage save failed: ${e.message}`);
            }
        }

        static createStyleSheet() {
            if (!document.getElementById(STYLE_ID)) {
                const styleSheet = document.createElement('style');
                styleSheet.id = STYLE_ID;
                styleSheet.textContent = CSS;
                document.head.appendChild(styleSheet);
            }
        }

        static getFileExtension(url) {
            try {
                const urlParams = new URL(url).searchParams;
                const format = urlParams.get('format');
                return format ? format : 'jpg';
            } catch (e) {
                return 'jpg';
            }
        }

        static getUserUIColor() {
            try {
                const computedStyle = getComputedStyle(document.body);
                const bgColor = computedStyle.backgroundColor || 'black';
                const textColor = computedStyle.color || 'white';
                return { bgColor, textColor };
            } catch (e) {
                return { bgColor: 'black', textColor: 'white' };
            }
        }

        static addAlpha(color, alpha) {
            try {
                if (color.startsWith("rgb(")) {
                    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
                }
                return color;
            } catch (e) {
                return `rgba(0, 0, 0, ${alpha})`;
            }
        }

        static parseRGB(colorStr) {
            try {
                const result = colorStr.match(/\d+/g);
                return result ? result.slice(0, 3).map(Number) : [0, 0, 0];
            } catch (e) {
                return [0, 0, 0];
            }
        }

        static getAdaptiveBorderColor() {
            try {
                const { bgColor } = this.getUserUIColor();
                const [r, g, b] = this.parseRGB(bgColor);
                const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                return brightness < 128 ? "#1da1f2" : "#0d8ecf";
            } catch (e) {
                return "#1da1f2";
            }
        }

        static debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }
    }

    class TweetInfo {
        constructor() {
            this.user = '';
            this.id = '';
            this.imageUrls = [];
        }
        
        extractFromTweet(tweetElement) {
            try {
                this.imageUrls = this.getAllImagesFromTweet(tweetElement);
                
                if (this.imageUrls.length === 0) {
                    return false;
                }
                
                this.id = this.extractTweetIdFromElement(tweetElement) || _('unknownID');
                
                const isRetweet = this.isRetweet(tweetElement);
                
                let tweetContentElement = tweetElement.querySelector('[data-testid="tweet"]') || tweetElement;
                
                let authorFound = false;
                
                if (isRetweet) {
                    authorFound = this.findOriginalAuthor(tweetContentElement);
                }
                
                if (!authorFound) {
                    authorFound = this.findAuthorFromTweet(tweetContentElement);
                }
                
                if (!this.user) {
                    this.user = _('unknownUser');
                }
                
                return this.imageUrls.length > 0;
            } catch (e) {
                console.error("Error extracting tweet info:", e);
                return false;
            }
        }
        
        isRetweet(tweetElement) {
            
            const socialContext = tweetElement.querySelector('[data-testid="socialContext"]');
            if (socialContext) {
                const text = socialContext.textContent.toLowerCase();
                if (text.includes('리트윗') || text.includes('retweet') || text.includes('리포스트') || text.includes('repost')) {
                    return true;
                }
            }
            
            const retweetIcon = tweetElement.querySelector('[data-testid="socialContext"] svg');
            if (retweetIcon) {
                return true;
            }
            
            const anyShareText = tweetElement.textContent.match(/리트윗|리포스트|retweet|repost/i);
            if (anyShareText) {
                const textNodes = Array.from(tweetElement.querySelectorAll('*'))
                    .filter(el => el.childNodes.length === 1 && el.childNodes[0].nodeType === 3)
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0 && text.length < 30); 
                    
                for (const text of textNodes) {
                    if (text.match(/리트윗|리포스트|retweet|repost/i)) {
                        return true;
                    }
                }
            }
            
            return false;
        }
        
        findOriginalAuthor(tweetContentElement) {
            try {
                
                const imageElements = tweetContentElement.querySelectorAll('img[src*="pbs.twimg.com/media/"]');
                if (imageElements.length > 0) {
                    const firstImage = imageElements[0];
                    const nearbyLinks = this.getNearbyUserLinks(firstImage);
                    
                    for (const link of nearbyLinks) {
                        const username = this.extractUsername(link);
                        if (username) {
                            this.user = username;
                            return true;
                        }
                    }
                }
                
                const contentLinks = tweetContentElement.querySelectorAll('a[role="link"][href^="/"]');
                for (const link of contentLinks) {
                    if (link.getAttribute('data-testid') === 'timestamp' || 
                        link.href.includes('/hashtag/') ||
                        link.href.includes('/search?')) {
                        continue;
                    }
                    
                    const username = this.extractUsername(link);
                    if (username) {
                        this.user = username;
                        return true;
                    }
                }
                
                const userNameLinks = tweetContentElement.querySelectorAll('[data-testid="User-Name"] a[href^="/"]');
                for (const link of userNameLinks) {
                    const username = this.extractUsername(link);
                    if (username) {
                        this.user = username;
                        return true;
                    }
                }
                
                return false;
            } catch (e) {
                console.error("Error finding original author:", e);
                return false;
            }
        }
        
        findAuthorFromTweet(tweetContentElement) {
            try {
                
                const userNameLinks = tweetContentElement.querySelectorAll('[data-testid="User-Name"] a[href^="/"]');
                for (const link of userNameLinks) {
                    const username = this.extractUsername(link);
                    if (username) {
                        this.user = username;
                        return true;
                    }
                }
                
                const headerLinks = this.getNearbyUserLinks(tweetContentElement, 0, 3);
                for (const link of headerLinks) {
                    const username = this.extractUsername(link);
                    if (username) {
                        this.user = username;
                        return true;
                    }
                }
                
                const anyUserLink = tweetContentElement.querySelector('a[href^="/"]');
                if (anyUserLink) {
                    const username = this.extractUsername(anyUserLink);
                    if (username) {
                        this.user = username;
                        return true;
                    }
                }
                
                return false;
            } catch (e) {
                console.error("Error finding author from tweet:", e);
                return false;
            }
        }
        
        getNearbyUserLinks(element, maxDistance = 3, maxLinks = 5) {
            const links = [];
            
            let parent = element.parentElement;
            for (let i = 0; i < maxDistance && parent; i++) {
                const userLinks = parent.querySelectorAll('a[href^="/"]');
                for (const link of userLinks) {
                    if (!link.href.includes('/status/') && 
                        !link.href.includes('/hashtag/') && 
                        !link.href.includes('/search?')) {
                        links.push(link);
                        if (links.length >= maxLinks) return links;
                    }
                }
                parent = parent.parentElement;
            }
            
            let sibling = element.previousElementSibling;
            for (let i = 0; i < maxDistance && sibling; i++) {
                const userLinks = sibling.querySelectorAll('a[href^="/"]');
                for (const link of userLinks) {
                    if (!link.href.includes('/status/') && 
                        !link.href.includes('/hashtag/') && 
                        !link.href.includes('/search?')) {
                        links.push(link);
                        if (links.length >= maxLinks) return links;
                    }
                }
                sibling = sibling.previousElementSibling;
            }
            
            return links;
        }
        
        extractUsername(link) {
            if (!link || !link.getAttribute) return null;
            
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('/')) return null;
            
            const parts = href.split('/').filter(part => part.length > 0);
            if (parts.length > 0) {
                if (parts[0].includes('#') || parts[0].includes('?')) {
                    return null;
                }
                
                const nonUsernamePaths = ['search', 'explore', 'notifications', 'messages', 'i', 'bookmarks', 'lists'];
                if (nonUsernamePaths.includes(parts[0].toLowerCase())) {
                    return null;
                }
                
                return parts[0];
            }
            
            return null;
        }
    
        extractTweetIdFromElement(tweetElement) {
            try {
                let tweetId = (window.location.href.match(/status\/(\d+)/) || [])[1];
                if (tweetId) return tweetId;
                
                const statusLinks = tweetElement.querySelectorAll('a[href*="/status/"]');
                for (const link of statusLinks) {
                    const match = link.href.match(/\/status\/(\d+)/);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
                
                const article = tweetElement.closest('article');
                if (article) {
                    for (const attr of ['data-tweet-id', 'data-item-id']) {
                        if (article.hasAttribute(attr)) {
                            return article.getAttribute(attr);
                        }
                    }
                    
                    for (const attr of article.attributes) {
                        if (attr.name.startsWith('data-') && /^\d+$/.test(attr.value)) {
                            return attr.value;
                        }
                    }
                }
                
                const timeElement = tweetElement.querySelector('time');
                if (timeElement) {
                    const timeLink = timeElement.closest('a[href*="/status/"]');
                    if (timeLink) {
                        const match = timeLink.href.match(/\/status\/(\d+)/);
                        if (match && match[1]) {
                            return match[1];
                        }
                    }
                }
                
                const testIdElements = tweetElement.querySelectorAll('[data-testid]');
                for (const el of testIdElements) {
                    if (el.dataset.testid === 'tweet') {
                        const nearbyLinks = el.querySelectorAll('a[href*="/status/"]');
                        for (const link of nearbyLinks) {
                            const match = link.href.match(/\/status\/(\d+)/);
                            if (match && match[1]) {
                                return match[1];
                            }
                        }
                    }
                }
                
                const imgElements = tweetElement.querySelectorAll('img[src*="pbs.twimg.com/media/"]');
                if (imgElements.length > 0) {
                    const imgSrc = imgElements[0].src;
                    const match = imgSrc.match(/\/media\/([A-Za-z0-9_-]+)/);
                    if (match && match[1]) {
                        return `img_${match[1]}`;
                    }
                }
                
                return null;
            } catch (e) {
                console.error("Error extracting tweet ID:", e);
                return null;
            }
        }
    
        getAllImagesFromTweet(tweetElement) {
            try {
                return [...tweetElement.querySelectorAll('img[src*="pbs.twimg.com/media/"]')]
                    .map(img => img.src.replace(/&name=\w+/, '&name=orig'));
            } catch (e) {
                console.error("Error getting images from tweet:", e);
                return [];
            }
        }
    }

    class ImageViewer {
        constructor() {
            this.currentIndex = 0;
            this.displayMode = "vertical";
            this.currentAdjustMode = Utils.getLocalStorageItem('adjustMode', "window");
            this.positionPreference = Utils.getLocalStorageItem('imagePositionPreference', 'adaptive');
            this.tweetInfo = new TweetInfo();

            this.viewer = null;
            this.optionsBar = null;
            this.thumbnailBar = null;
            this.imageContainer = null;
            this.currentImageIndicator = null;

            this.hideOptionsBarTimer = null;
            this.hideThumbnailBarTimer = null;
            this.intersectionObserver = null;
            this.manualNavigationTimeout = null;

            this.eventListeners = [];
            this.resizeObservers = [];
            this.lazyLoadedImages = new Set();
            this.clickLogs = [];

            this.savedScrollPos = 0;
            this.isMouseOverOptionsBar = false;
            this.isMouseOverThumbnailBar = false;
            this.isMouseInTopDetectionZone = false;
            this.isMouseInBottomDetectionZone = false;
            this.manualNavigationInProgress = false;

            this.detectionZoneSize = 150;
            this.debugMode = true;

            this.navigateImage = this.navigateImage.bind(this);
            this.destroy = this.destroy.bind(this);
            this.preventXViewer = this.preventXViewer.bind(this);
            this.focusCurrentImage = this.focusCurrentImage.bind(this);
            this.updateViewerForCurrentImage = this.updateViewerForCurrentImage.bind(this);
        }

        logDebug(message, ...data) {
            if (this.debugMode) {
                console.log(`[ImageViewer] ${message}`, ...data);

                if (message.includes('Click')) {
                    this.clickLogs.push({
                        time: new Date().toISOString(),
                        message,
                        data
                    });
                    if (this.clickLogs.length > 100) this.clickLogs.shift();
                }
            }
        }

        init() {
            Utils.createStyleSheet();
            this.addEventListeners();
            this.reinforceEventPrevention();
        }

        addEventListeners() {
            const events = ['pointerdown', 'mousedown', 'click', 'auxclick', 'touchstart'];
        
            events.forEach(evt => {
                const listener = (event) => {
                    if (event.type !== 'touchstart' && 'button' in event && event.button !== 0) {
                        return;
                    }
        
                    if (this.viewer && this.viewer.contains(event.target)) {
                        return;
                    }
        
                    if ((event.target.tagName === 'IMG' && event.target.src?.includes('pbs.twimg.com/media/')) ||
                        event.target.closest('img[src*="pbs.twimg.com/media/"]')) {
                        this.preventXViewer(event);
                    }
                };
        
                document.addEventListener(evt, listener, {
                    capture: true,
                    passive: false
                });
        
                this.eventListeners.push({ event: evt, listener, options: { capture: true } });
            });
        
            try {
                const titleElement = document.querySelector('title');
                if (titleElement) {
                    const urlObserver = new MutationObserver(() => {
                        if (window.location.href.includes('/photo/')) {
                            const newUrl = window.location.href.replace(/\/photo\/\d+$/, '');
                            history.replaceState(null, '', newUrl);
                        }
                    });
        
                    urlObserver.observe(titleElement, {
                        subtree: true,
                        characterData: true,
                        childList: true
                    });
                } else {
                    let lastUrl = window.location.href;
                    setInterval(() => {
                        if (lastUrl !== window.location.href) {
                            lastUrl = window.location.href;
                            if (lastUrl.includes('/photo/')) {
                                const newUrl = lastUrl.replace(/\/photo\/\d+$/, '');
                                history.replaceState(null, '', newUrl);
                            }
                        }
                    }, 500);
                }
            } catch (e) {
                console.error("Error setting up URL observer:", e);
            }
        
            const themeObserver = new MutationObserver(() => {
                if (this.viewer) {
                    this.updateUIColors();
                }
            });
        
            themeObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        
            document.addEventListener('click', (event) => {
                if ('button' in event && event.button !== 0) {
                    return;
                }
        
                if (this.viewer && this.viewer.contains(event.target)) {
                    return;
                }
        
                if (event.target.matches('img[src*="pbs.twimg.com/media/"]') ||
                    event.target.closest('img[src*="pbs.twimg.com/media/"]')) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }, { capture: true, passive: false });
        }

        preventXViewer(event) {
            try {
                if (event.type !== 'touchstart' && 'button' in event && event.button !== 0) {
                    return;
                }
        
                if (this.viewer && this.viewer.contains(event.target)) {
                    return;
                }
        
                const imgElement = event.target.tagName === 'IMG' ?
                    event.target : event.target.closest('img[src*="pbs.twimg.com/media/"]');
        
                if (!imgElement || !imgElement.src || !imgElement.src.includes('pbs.twimg.com/media/')) return;
        
                if (window.location.href.includes('/photo/')) {
                    const newUrl = window.location.href.replace(/\/photo\/\d+$/, '');
                    history.replaceState(null, '', newUrl);
                }
        
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
        
                if (event.type === 'click' || event.type === 'mousedown' || event.type === 'pointerdown') {
                    const tweet = imgElement.closest('article');
                    if (tweet && this.tweetInfo.extractFromTweet(tweet)) {
                        const origSrc = imgElement.src.replace(/&name=\w+/, '&name=orig');
                        this.currentIndex = this.tweetInfo.imageUrls.indexOf(origSrc);
                        if (this.currentIndex === -1) this.currentIndex = 0;
        
                        setTimeout(() => {
                            this.show();
                        }, 50);
                    }
                }
        
                return false;
            } catch (e) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return false;
            }
        }

        reinforceEventPrevention() {
            const reinforcementListener = (event) => {
                if ('button' in event && event.button !== 0) {
                    return;
                }
        
                if (this.viewer && this.viewer.contains(event.target)) {
                    return;
                }
        
                if (event.target.tagName === 'IMG' &&
                    event.target.src &&
                    event.target.src.includes('pbs.twimg.com/media/')) {
        
                    event.preventDefault();
                    event.stopPropagation();
                }
            };
        
            document.body.addEventListener('click', reinforcementListener, {
                capture: true,
                passive: false
            });
        
            this.eventListeners.push({
                event: 'click',
                listener: reinforcementListener,
                options: { capture: true },
                element: document.body
            });
        }

        show() {
            try {
                this.savedScrollPos = window.pageYOffset || document.documentElement.scrollTop;

                this.destroy();

                document.body.style.overflow = 'hidden';

                this.viewer = document.createElement('div');
                this.viewer.id = 'xcom-image-viewer';
                this.viewer.setAttribute('role', 'dialog');
                this.viewer.setAttribute('aria-label', 'Image Viewer');

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

                backgroundOverlay.addEventListener('click', (event) => {
                    if (event.target === backgroundOverlay) {
                        if (this.debugMode) {
                            console.log('Direct background overlay click detected - closing viewer');
                        }
                        this.destroy();

                        event.stopPropagation();
                        event.preventDefault();
                    }
                });

                this.viewer.appendChild(backgroundOverlay);

                this.createOptionsBar();
                this.createImageContainer();
                this.createThumbnailBar();

                this.setupKeyboardNavigation();
                this.setupMouseMovementDetection();
                this.setupBackgroundClickHandler();

                document.body.appendChild(this.viewer);

                this.updateDisplayMode();
                if (this.currentAdjustMode) {
                    this.adjustImages(this.currentAdjustMode);
                }

                this.setupIntersectionObserver();
                this.lazyLoadImages();
                this.focusCurrentImage(true);

                this.reinforceEventPrevention();

                if (this.debugMode) {
                    console.log('Viewer initialized with:', {
                        currentIndex: this.currentIndex,
                        imageCount: this.tweetInfo.imageUrls.length,
                        adjustMode: this.currentAdjustMode
                    });
                }
            } catch (e) {
                console.error(`Error showing image viewer: ${e.message}`, e);
                this.destroy();
            }
        }

        createOptionsBar() {
            try {
                const { bgColor, textColor } = Utils.getUserUIColor();

                this.optionsBar = document.createElement('div');
                this.optionsBar.id = 'optionsBar';
                this.optionsBar.style.background = Utils.addAlpha(bgColor, 0.8);
                this.optionsBar.style.color = textColor;
                this.optionsBar.setAttribute('role', 'toolbar');
                this.optionsBar.setAttribute('aria-label', 'Image Viewer Controls');

                this.hideOptionsBarTimer = setTimeout(() => {
                    if (!this.isMouseOverOptionsBar) {
                        this.optionsBar.style.transform = 'translateY(-100%)';
                    }
                }, 2000);

                this.optionsBar.addEventListener('mouseenter', () => {
                    this.isMouseOverOptionsBar = true;
                    clearTimeout(this.hideOptionsBarTimer);
                    this.optionsBar.style.transform = 'translateY(0)';
                });

                this.optionsBar.addEventListener('mouseleave', () => {
                    this.isMouseOverOptionsBar = false;
                    if (!this.isMouseInTopDetectionZone) {
                        this.hideOptionsBarTimer = setTimeout(() => {
                            if (!this.isMouseOverOptionsBar && !this.isMouseInTopDetectionZone) {
                                this.optionsBar.style.transform = 'translateY(-100%)';
                            }
                        }, 2000);
                    }
                });

                const prevBtn = this.createIconButton('fa-solid fa-arrow-left', () => this.navigateImage(-1), _('prevImage'));
                const nextBtn = this.createIconButton('fa-solid fa-arrow-right', () => this.navigateImage(1), _('nextImage'));

                const imageSelect = document.createElement('select');
                imageSelect.id = 'image-select';
                imageSelect.setAttribute('aria-label', 'Select Image');

                this.tweetInfo.imageUrls.forEach((url, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = (index + 1).toString();
                    imageSelect.appendChild(option);
                });

                imageSelect.selectedIndex = this.currentIndex;
                imageSelect.addEventListener('change', () => {
                    this.manualNavigationInProgress = true;
                    clearTimeout(this.manualNavigationTimeout);

                    this.currentIndex = parseInt(imageSelect.value);
                    this.updateViewerForCurrentImage();

                    this.manualNavigationTimeout = setTimeout(() => {
                        this.manualNavigationInProgress = false;
                    }, 1000);
                });

                const fitWidthBtn = this.createIconButton('fa-solid fa-arrows-left-right', () => this.adjustImages('width'), _('fitWidth'));
                const fitHeightBtn = this.createIconButton('fa-solid fa-arrows-up-down', () => this.adjustImages('height'), _('fitHeight'));
                const fitWindowBtn = this.createIconButton('fa-solid fa-expand', () => this.adjustImages('window'), _('fitWindow'));
                const originalSizeBtn = this.createIconButton('fa-solid fa-image', () => this.adjustImages('original'), _('originalSize'));

                const downloadCurrentBtn = this.createIconButton('fa-solid fa-download', () => this.downloadCurrentImage(), _('saveCurrentImage'));
                const downloadAllBtn = this.createIconButton('fa-solid fa-file-zipper', () => this.downloadAllImages(), _('saveAllImages'));

                const closeBtn = this.createIconButton('fa-solid fa-xmark', () => this.destroy(), _('close'));
                closeBtn.style.marginLeft = 'auto';
                closeBtn.style.marginRight = '10px';

                this.currentImageIndicator = document.createElement('div');
                this.currentImageIndicator.id = 'current-image-indicator';
                this.currentImageIndicator.textContent = _('currentImageIndicator')
                    .replace('%1', this.currentIndex + 1)
                    .replace('%2', this.tweetInfo.imageUrls.length);

                this.optionsBar.append(
                    prevBtn,
                    imageSelect,
                    nextBtn,
                    fitWidthBtn,
                    fitHeightBtn,
                    fitWindowBtn,
                    originalSizeBtn,
                    downloadCurrentBtn,
                    downloadAllBtn,
                    closeBtn
                );

                this.viewer.appendChild(this.optionsBar);
                this.viewer.appendChild(this.currentImageIndicator);
            } catch (e) {
                console.error(`Error creating options bar: ${e.message}`);
            }
        }

        createImageContainer() {
            try {
                this.imageContainer = document.createElement('div');
                this.imageContainer.style.cssText = `
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    padding: 60px 0 80px 0;
                    z-index: 10000;
                `;

                this.viewer.appendChild(this.imageContainer);

                this.tweetInfo.imageUrls.forEach((url, index) => {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'image-placeholder';
                    placeholder.dataset.index = index;
                    placeholder.dataset.src = url;
                    placeholder.style.cssText = `
                        width: 100%;
                        height: 200px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 5px 0;
                    `;

                    const loadingSpinner = document.createElement('div');
                    loadingSpinner.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x"></i>';
                    placeholder.appendChild(loadingSpinner);

                    this.imageContainer.appendChild(placeholder);
                });

                this.imageContainer.addEventListener('click', (event) => {
                    event.stopPropagation();
                    event.preventDefault();

                    const container = event.target.closest('.image-container');
                    if (!container) return;

                    const index = parseInt(container.dataset.index);
                    if (isNaN(index)) return;

                    if (this.currentIndex !== index) {
                        this.manualNavigationInProgress = true;
                        clearTimeout(this.manualNavigationTimeout);

                        this.currentIndex = index;
                        this.updateViewerForCurrentImage();

                        this.manualNavigationTimeout = setTimeout(() => {
                            this.manualNavigationInProgress = false;
                        }, 1000);
                    }
                }, { capture: true });
            } catch (e) {
                console.error(`Error creating image container: ${e.message}`);
            }
        }

        createImageElement(url, index) {
            try {
                if (this.lazyLoadedImages.has(index)) return;

                const placeholder = this.imageContainer.querySelector(`.image-placeholder[data-index="${index}"]`);
                if (placeholder) {
                    placeholder.remove();
                }

                const imgContainer = document.createElement('div');
                imgContainer.className = 'image-container';
                imgContainer.dataset.index = index;
                imgContainer.dataset.url = url;

                const img = document.createElement('img');
                img.src = url;
                img.className = 'viewer-image';
                img.dataset.index = index;
                img.alt = `Image ${index + 1} of ${this.tweetInfo.imageUrls.length}`;

                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    if (this.currentIndex !== parseInt(index)) {
                        this.manualNavigationInProgress = true;
                        clearTimeout(this.manualNavigationTimeout);

                        this.currentIndex = parseInt(index);
                        this.updateViewerForCurrentImage();

                        this.manualNavigationTimeout = setTimeout(() => {
                            this.manualNavigationInProgress = false;
                        }, 1000);
                    }
                }, { capture: true });

                imgContainer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const clickedIndex = parseInt(imgContainer.dataset.index);

                    if (this.currentIndex !== clickedIndex) {
                        this.manualNavigationInProgress = true;
                        clearTimeout(this.manualNavigationTimeout);

                        this.currentIndex = clickedIndex;
                        this.updateViewerForCurrentImage();

                        this.manualNavigationTimeout = setTimeout(() => {
                            this.manualNavigationInProgress = false;
                        }, 1000);
                    }
                }, { capture: true });

                imgContainer.addEventListener('mouseenter', () => {
                    imgContainer.style.boxShadow = '0 0 8px rgba(29, 161, 242, 0.5)';
                    img.style.opacity = '0.95';
                });

                imgContainer.addEventListener('mouseleave', () => {
                    imgContainer.style.boxShadow = 'none';
                    img.style.opacity = '1';
                });

                img.onload = () => {
                    if (this.currentAdjustMode) {
                        this.adjustImageElement(img, this.currentAdjustMode);
                    }

                    if (parseInt(index) === this.currentIndex) {
                        setTimeout(() => this.focusCurrentImage(true), 50);
                    }
                };

                img.onerror = () => {
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjODg4Ij5JbWFnZSBMb2FkIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                };

                if (parseInt(index) === this.currentIndex) {
                    const indicator = document.createElement('div');
                    indicator.className = 'image-indicator';
                    indicator.style.position = 'absolute';
                    indicator.style.top = '10px';
                    indicator.style.right = '10px';
                    indicator.style.width = '12px';
                    indicator.style.height = '12px';
                    indicator.style.borderRadius = '50%';
                    indicator.style.background = '#1da1f2';
                    indicator.style.boxShadow = '0 0 5px white';
                    indicator.style.zIndex = '10003';
                    imgContainer.appendChild(indicator);
                }

                imgContainer.appendChild(img);
                this.imageContainer.appendChild(imgContainer);
                this.lazyLoadedImages.add(index);

                return img;
            } catch (e) {
                console.error(`Error creating image element: ${e.message}`, e);
                return null;
            }
        }

        createThumbnailBar() {
            try {
                const { bgColor } = Utils.getUserUIColor();

                this.thumbnailBar = document.createElement('div');
                this.thumbnailBar.id = 'thumbnailBar';
                this.thumbnailBar.style.background = Utils.addAlpha(bgColor, 0.8);

                this.tweetInfo.imageUrls.forEach((url, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = url.replace(/&name=orig/, '&name=small');
                    thumb.className = index === this.currentIndex ? 'thumbnail active' : 'thumbnail';
                    thumb.dataset.index = index;
                    thumb.alt = `Thumbnail ${index + 1}`;

                    thumb.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        e.preventDefault();

                        setTimeout(() => {
                            if (this.currentIndex !== index) {
                                this.manualNavigationInProgress = true;
                                clearTimeout(this.manualNavigationTimeout);

                                thumb.style.transform = 'scale(1.2)';
                                thumb.style.boxShadow = '0 0 10px rgba(29, 161, 242, 0.9)';

                                this.currentIndex = index;
                                this.updateViewerForCurrentImage();

                                this.manualNavigationTimeout = setTimeout(() => {
                                    this.manualNavigationInProgress = false;
                                }, 1000);
                            }
                        }, 10);
                    }, { capture: true });

                    thumb.setAttribute('role', 'tab');
                    thumb.setAttribute('aria-selected', index === this.currentIndex ? 'true' : 'false');
                    thumb.setAttribute('tabindex', '0');

                    thumb.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            if (this.currentIndex !== index) {
                                this.manualNavigationInProgress = true;
                                clearTimeout(this.manualNavigationTimeout);

                                this.currentIndex = index;
                                this.updateViewerForCurrentImage();

                                this.manualNavigationTimeout = setTimeout(() => {
                                    this.manualNavigationInProgress = false;
                                }, 1000);
                            }
                        }
                    });

                    this.thumbnailBar.appendChild(thumb);
                });

                this.viewer.appendChild(this.thumbnailBar);

                this.thumbnailBar.addEventListener('mouseenter', () => {
                    this.isMouseOverThumbnailBar = true;
                    clearTimeout(this.hideThumbnailBarTimer);
                    this.thumbnailBar.style.transform = 'translateY(0)';
                });

                this.thumbnailBar.addEventListener('mouseleave', () => {
                    this.isMouseOverThumbnailBar = false;
                    if (!this.isMouseInBottomDetectionZone) {
                        this.hideThumbnailBarTimer = setTimeout(() => {
                            if (!this.isMouseOverThumbnailBar && !this.isMouseInBottomDetectionZone) {
                                this.thumbnailBar.style.transform = 'translateY(100%)';
                            }
                        }, 2000);
                    }
                });

                this.hideThumbnailBarTimer = setTimeout(() => {
                    if (!this.isMouseOverThumbnailBar) {
                        this.thumbnailBar.style.transform = 'translateY(100%)';
                    }
                }, 2000);
            } catch (e) {
                console.error(`Error creating thumbnail bar: ${e.message}`);
            }
        }

        createIconButton(iconClass, onClick, tooltipText) {
            try {
                const { bgColor, textColor } = Utils.getUserUIColor();

                const button = document.createElement('button');
                button.className = 'icon-button';
                button.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
                button.style.background = bgColor;
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

        setupKeyboardNavigation() {
            const keyHandler = (event) => {
                if (!this.viewer) return;

                switch(event.key) {
                    case 'ArrowUp':
                    case 'ArrowLeft':
                        event.preventDefault();
                        this.navigateImage(-1);
                        break;
                    case 'ArrowDown':
                    case 'ArrowRight':
                        event.preventDefault();
                        this.navigateImage(1);
                        break;
                    case 'Escape':
                        event.preventDefault();
                        this.destroy();
                        break;
                    case ' ':
                        event.preventDefault();
                        this.navigateImage(1);
                        break;
                    case 'Home':
                        event.preventDefault();
                        this.currentIndex = 0;
                        this.updateViewerForCurrentImage();
                        break;
                    case 'End':
                        event.preventDefault();
                        this.currentIndex = this.tweetInfo.imageUrls.length - 1;
                        this.updateViewerForCurrentImage();
                        break;
                }
            };

            document.addEventListener('keydown', keyHandler);

            this.eventListeners.push({
                event: 'keydown',
                listener: keyHandler,
                options: {}
            });
        }

        setupMouseMovementDetection() {
            this.isMouseInTopDetectionZone = false;
            this.isMouseInBottomDetectionZone = false;

            const mouseMoveHandler = Utils.debounce((e) => {
                if (!this.viewer) return;

                const isInTopZone = e.clientY < this.detectionZoneSize;
                if (isInTopZone !== this.isMouseInTopDetectionZone) {
                    this.isMouseInTopDetectionZone = isInTopZone;

                    if (isInTopZone && this.optionsBar) {
                        clearTimeout(this.hideOptionsBarTimer);
                        this.optionsBar.style.transform = 'translateY(0)';
                    }
                    else if (this.optionsBar && !this.isMouseOverOptionsBar) {
                        this.hideOptionsBarTimer = setTimeout(() => {
                            if (!this.isMouseOverOptionsBar && !this.isMouseInTopDetectionZone) {
                                this.optionsBar.style.transform = 'translateY(-100%)';
                            }
                        }, 2000);
                    }
                }

                const isInBottomZone = e.clientY > window.innerHeight - this.detectionZoneSize;
                if (isInBottomZone !== this.isMouseInBottomDetectionZone) {
                    this.isMouseInBottomDetectionZone = isInBottomZone;

                    if (isInBottomZone && this.thumbnailBar) {
                        clearTimeout(this.hideThumbnailBarTimer);
                        this.thumbnailBar.style.transform = 'translateY(0)';
                    }
                    else if (this.thumbnailBar && !this.isMouseOverThumbnailBar) {
                        this.hideThumbnailBarTimer = setTimeout(() => {
                            if (!this.isMouseOverThumbnailBar && !this.isMouseInBottomDetectionZone) {
                                this.thumbnailBar.style.transform = 'translateY(100%)';
                            }
                        }, 2000);
                    }
                }

                if (this.currentImageIndicator) {
                    this.currentImageIndicator.style.opacity = "1";
                    setTimeout(() => {
                        if (this.currentImageIndicator) {
                            this.currentImageIndicator.style.opacity = "0.3";
                        }
                    }, 2000);
                }
            }, 50);

            this.viewer.addEventListener('mousemove', mouseMoveHandler);

            this.eventListeners.push({
                event: 'mousemove',
                listener: mouseMoveHandler,
                options: {},
                element: this.viewer
            });
        }

        setupBackgroundClickHandler() {
            if (this._backgroundClickHandler) {
                this.viewer.removeEventListener('click', this._backgroundClickHandler);
            }
        
            this._backgroundClickHandler = (event) => {
                if ('button' in event && event.button !== 0) {
                    return;
                }
        
                console.log('Click detected:',
                    'Target:', event.target.tagName,
                    'ID:', event.target.id,
                    'Class:', event.target.className,
                    'Is viewer:', event.target === this.viewer);
        
                const isInteractiveElement = event.target.closest(
                    '.image-container, .viewer-image, #optionsBar, #thumbnailBar, ' +
                    '.icon-button, select, .thumbnail, .image-placeholder, button'
                );
        
                if (event.target === this.viewer || !isInteractiveElement) {
                    console.log('Closing viewer - detected background click');
                    this.destroy();
                }
            };
        
            this.viewer.addEventListener('click', this._backgroundClickHandler, { capture: true });
        
            this.eventListeners.push({
                event: 'click',
                listener: this._backgroundClickHandler,
                options: { capture: true },
                element: this.viewer
            });
        
            this.viewer.style.cursor = 'default';
        }

        navigateImage(direction) {
            try {
                const imageCount = this.tweetInfo.imageUrls.length;
                if (imageCount <= 1) return;

                this.manualNavigationInProgress = true;
                clearTimeout(this.manualNavigationTimeout);

                let newIndex = this.currentIndex + direction;

                if (newIndex < 0) newIndex = imageCount - 1;
                if (newIndex >= imageCount) newIndex = 0;

                this.currentIndex = newIndex;
                this.updateViewerForCurrentImage();

                this.manualNavigationTimeout = setTimeout(() => {
                    this.manualNavigationInProgress = false;
                }, 1000);
            } catch (e) {
                console.error(`Error navigating image: ${e.message}`);
                this.manualNavigationInProgress = false;
            }
        }

        lazyLoadImages() {
            try {
                const placeholders = this.imageContainer.querySelectorAll('.image-placeholder');

                const checkVisibility = () => {
                    const containerRect = this.imageContainer.getBoundingClientRect();
                    const containerTop = containerRect.top;
                    const containerBottom = containerRect.bottom;
                    const containerHeight = containerRect.height;

                    placeholders.forEach(placeholder => {
                        const index = parseInt(placeholder.dataset.index);
                        const rect = placeholder.getBoundingClientRect();

                        if ((rect.bottom >= containerTop - containerHeight &&
                             rect.top <= containerBottom + containerHeight) ||
                            index === this.currentIndex) {

                            this.createImageElement(placeholder.dataset.src, index);
                        }
                    });
                };

                checkVisibility();

                const scrollHandler = Utils.debounce(checkVisibility, 200);
                this.viewer.addEventListener('scroll', scrollHandler);

                this.eventListeners.push({
                    event: 'scroll',
                    listener: scrollHandler,
                    options: {},
                    element: this.viewer
                });
            } catch (e) {
                console.error(`Error in lazy loading images: ${e.message}`);
            }
        }

        updateViewerForCurrentImage() {
            try {
                const imageSelect = document.getElementById('image-select');
                if (imageSelect) {
                    imageSelect.value = this.currentIndex;
                }

                this.updateThumbnailFocus();

                const allContainers = this.imageContainer.querySelectorAll('.image-container');
                allContainers.forEach((container, idx) => {
                    const existingIndicator = container.querySelector('.image-indicator');
                    if (existingIndicator) existingIndicator.remove();

                    if (idx === this.currentIndex) {
                        const indicator = document.createElement('div');
                        indicator.className = 'image-indicator';
                        indicator.style.position = 'absolute';
                        indicator.style.top = '10px';
                        indicator.style.right = '10px';
                        indicator.style.width = '12px';
                        indicator.style.height = '12px';
                        indicator.style.borderRadius = '50%';
                        indicator.style.background = '#1da1f2';
                        indicator.style.boxShadow = '0 0 7px white';
                        indicator.style.zIndex = '10003';
                        container.appendChild(indicator);

                        container.style.boxShadow = '0 0 15px rgba(29, 161, 242, 0.3)';
                        container.style.backgroundColor = 'rgba(29, 161, 242, 0.05)';
                    } else {
                        container.style.boxShadow = 'none';
                        container.style.backgroundColor = 'transparent';
                    }
                });

                setTimeout(() => {
                    this.focusCurrentImage(false);

                    setTimeout(() => {
                        this.focusCurrentImage(false);
                    }, 300);
                }, 50);

                if (this.currentImageIndicator) {
                    this.currentImageIndicator.textContent = _('currentImageIndicator')
                        .replace('%1', this.currentIndex + 1)
                        .replace('%2', this.tweetInfo.imageUrls.length);
                }
            } catch (e) {
                console.error(`Error updating viewer: ${e.message}`);
            }
        }

        focusCurrentImage(initialLoad = false) {
            try {
                let target = this.imageContainer.querySelector(`.image-container[data-index="${this.currentIndex}"]`);

                if (!target) {
                    this.createImageElement(this.tweetInfo.imageUrls[this.currentIndex], this.currentIndex);

                    target = this.imageContainer.querySelector(`.image-container[data-index="${this.currentIndex}"]`);

                    if (!target) {
                        setTimeout(() => this.focusCurrentImage(initialLoad), 100);
                        return;
                    }
                }

                target.scrollIntoView({
                    behavior: initialLoad ? 'auto' : 'smooth',
                    block: 'center'
                });

                if (this.currentImageIndicator) {
                    this.currentImageIndicator.textContent = _('currentImageIndicator')
                        .replace('%1', this.currentIndex + 1)
                        .replace('%2', this.tweetInfo.imageUrls.length);

                    this.currentImageIndicator.style.opacity = "1";
                }

                this.updateThumbnailFocus();

            } catch (e) {
                console.error(`focusCurrentImage error:`, e);
            }
        }

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

        updateDisplayMode() {
            try {
                if (!this.imageContainer) return;

                this.imageContainer.innerHTML = '';

                this.tweetInfo.imageUrls.forEach((url, index) => {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'image-placeholder';
                    placeholder.dataset.index = index;
                    placeholder.dataset.src = url;
                    placeholder.style.cssText = `
                        width: 100%;
                        height: 200px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 5px 0;
                    `;

                    const loadingSpinner = document.createElement('div');
                    loadingSpinner.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x"></i>';
                    placeholder.appendChild(loadingSpinner);

                    this.imageContainer.appendChild(placeholder);
                });

                this.lazyLoadedImages = new Set();

                this.lazyLoadImages();
                this.focusCurrentImage();
            } catch (e) {
                console.error(`Error updating display mode: ${e.message}`);
            }
        }

        adjustImages(mode) {
            try {
                this.currentAdjustMode = mode;
                Utils.setLocalStorageItem('adjustMode', mode);

                const images = this.imageContainer.querySelectorAll('.viewer-image');
                images.forEach(img => this.adjustImageElement(img, mode));

                setTimeout(() => this.focusCurrentImage(), 50);
            } catch (e) {
                console.error(`Error adjusting images: ${e.message}`);
            }
        }

        adjustImageElement(img, mode) {
            try {
                if (!img.complete || !img.naturalWidth) {
                    img.addEventListener('load', () => this.recalculateImageSize(img, mode), { once: true });
                    return;
                }

                this.recalculateImageSize(img, mode);
            } catch (e) {
                console.error(`Error adjusting image element: ${e.message}`);
            }
        }

        recalculateImageSize(img, mode) {
            try {
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;
                const winWidth = window.innerWidth;
                const winHeight = window.innerHeight - 160;

                let width, height;

                switch(mode) {
                    case 'width':
                        width = `${Math.min(winWidth, imgWidth)}px`;
                        height = 'auto';
                        break;
                    case 'height':
                        height = `${Math.min(winHeight, imgHeight)}px`;
                        width = 'auto';
                        break;
                    case 'window':
                        const scale = Math.min(1, winWidth / imgWidth, winHeight / imgHeight);
                        width = `${imgWidth * scale}px`;
                        height = `${imgHeight * scale}px`;
                        break;
                    case 'original':
                        width = `${imgWidth}px`;
                        height = `${imgHeight}px`;
                        break;
                }

                img.style.width = width;
                img.style.height = height;
                img.style.objectFit = "initial";
                img.style.margin = "0 auto";

                img.style.position = "static";
                img.style.transform = "none";

                if (mode === 'original') {
                    img.style.maxWidth = "none";
                } else {
                    img.style.maxWidth = "100%";
                }

                if (parseInt(img.dataset.index) === this.currentIndex) {
                    setTimeout(() => this.focusCurrentImage(), 50);
                }
            } catch (e) {
                console.error(`Error recalculating image size: ${e.message}`);
            }
        }

        async downloadCurrentImage() {
            try {
                if (!this.tweetInfo.imageUrls.length) return;

                const url = this.tweetInfo.imageUrls[this.currentIndex];
                const ext = Utils.getFileExtension(url);
                const filename = `${this.tweetInfo.user}_${this.tweetInfo.id}_${this.currentIndex + 1}.${ext}`;

                const downloadIndicator = document.createElement('div');
                downloadIndicator.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    z-index: 10010;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    max-width: 80%;
                `;

                const preview = document.createElement('img');
                preview.src = url.replace(/&name=orig/, '&name=small');
                preview.style.cssText = `
                    max-width: 150px;
                    max-height: 150px;
                    border: 2px solid white;
                `;

                downloadIndicator.innerHTML = `
                    <h3>Downloading Image ${this.currentIndex + 1} of ${this.tweetInfo.imageUrls.length}</h3>
                    <p>${filename}</p>
                `;
                downloadIndicator.appendChild(preview);

                this.viewer.appendChild(downloadIndicator);

                await new Promise(resolve => setTimeout(resolve, 500));

                try {
                    saveAs(url, filename);
                } catch (err) {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }

                downloadIndicator.innerHTML = `
                    <h3>Download Complete!</h3>
                    <p>Image ${this.currentIndex + 1} of ${this.tweetInfo.imageUrls.length} saved as:</p>
                    <p>${filename}</p>
                `;
                downloadIndicator.appendChild(preview);

                setTimeout(() => {
                    if (downloadIndicator.parentNode) {
                        downloadIndicator.parentNode.removeChild(downloadIndicator);
                    }
                }, 1500);
            } catch (e) {
                const existingIndicator = this.viewer.querySelector('div[style*="z-index: 10010"]');
                if (existingIndicator) {
                    existingIndicator.parentNode.removeChild(existingIndicator);
                }
            }
        }

        async downloadAllImages() {
            try {
                if (!this.tweetInfo.imageUrls.length) return;

                const zip = new JSZip();
                const folder = zip.folder(`${this.tweetInfo.user}_${this.tweetInfo.id}`);

                const loadingIndicator = document.createElement('div');
                loadingIndicator.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    z-index: 10010;
                    text-align: center;
                `;
                loadingIndicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Downloading images...</p>';
                this.viewer.appendChild(loadingIndicator);

                const downloadPromises = this.tweetInfo.imageUrls.map(async (url, index) => {
                    try {
                        const ext = Utils.getFileExtension(url);
                        const filename = `${this.tweetInfo.user}_${this.tweetInfo.id}_${index + 1}.${ext}`;
                        const response = await fetch(url);

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const blob = await response.blob();
                        folder.file(filename, blob);

                        loadingIndicator.innerHTML = `
                            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                            <p>Downloading images (${index + 1}/${this.tweetInfo.imageUrls.length})...</p>
                        `;
                    } catch (error) {
                        console.warn(`${_('downloadFailed')}: ${url}`, error);
                    }
                });

                await Promise.allSettled(downloadPromises);

                try {
                    const zipContent = await zip.generateAsync({ type: 'blob' });
                    saveAs(zipContent, `${this.tweetInfo.user}_${this.tweetInfo.id}.zip`);
                } catch (error) {
                    console.error(`Error creating zip file: ${error.message}`);
                }

                this.viewer.removeChild(loadingIndicator);
            } catch (e) {
                const loadingIndicator = this.viewer.querySelector('div[style*="z-index: 10010"]');
                if (loadingIndicator) {
                    this.viewer.removeChild(loadingIndicator);
                }
            }
        }

        setupIntersectionObserver() {
            try {
                if (this.intersectionObserver) {
                    this.intersectionObserver.disconnect();
                }

                const findImageAtViewportCenter = () => {
                    if (!this.viewer || !this.imageContainer) return null;

                    const viewerRect = this.viewer.getBoundingClientRect();
                    const viewportCenterY = viewerRect.top + (viewerRect.height / 2);

                    const containers = Array.from(this.imageContainer.querySelectorAll('.image-container, .image-placeholder'));
                    if (containers.length === 0) return null;

                    const centerContainer = containers.find(container => {
                        const rect = container.getBoundingClientRect();
                        return rect.top <= viewportCenterY && rect.bottom >= viewportCenterY;
                    });

                    if (centerContainer) {
                        return parseInt(centerContainer.dataset.index);
                    }

                    return null;
                };

                const updateCenterFocus = () => {
                    if (this.manualNavigationInProgress) return;

                    const centerImageIndex = findImageAtViewportCenter();

                    if (centerImageIndex !== null && centerImageIndex !== this.currentIndex) {
                        this.currentIndex = centerImageIndex;
                        this.updateThumbnailFocus();

                        const imageSelect = document.getElementById('image-select');
                        if (imageSelect) {
                            imageSelect.value = this.currentIndex;
                        }

                        if (this.currentImageIndicator) {
                            this.currentImageIndicator.textContent = _('currentImageIndicator')
                                .replace('%1', this.currentIndex + 1)
                                .replace('%2', this.tweetInfo.imageUrls.length);
                        }
                    }
                };

                let isScrolling = false;
                let scrollTimeout = null;

                const handleScroll = () => {
                    if (!this.viewer) return;

                    isScrolling = true;
                    clearTimeout(scrollTimeout);

                    if (!this.manualNavigationInProgress) {
                        updateCenterFocus();
                    }

                    scrollTimeout = setTimeout(() => {
                        isScrolling = false;
                        if (!this.manualNavigationInProgress) {
                            updateCenterFocus();
                        }
                    }, 100);
                };

                this.viewer.addEventListener('scroll', handleScroll);
                this.eventListeners.push({
                    event: 'scroll',
                    listener: handleScroll,
                    options: { passive: true },
                    element: this.viewer
                });

                this.intersectionObserver = new IntersectionObserver((entries) => {
                    if (!isScrolling && !this.manualNavigationInProgress) {
                        updateCenterFocus();
                    }
                }, { root: this.viewer, threshold: 0.1 });

                setTimeout(() => {
                    if (!this.imageContainer) return;

                    const elementsToObserve = this.imageContainer.querySelectorAll('.image-container, .image-placeholder');
                    elementsToObserve.forEach(el => this.intersectionObserver.observe(el));

                    if (!this.manualNavigationInProgress) {
                        updateCenterFocus();
                    }
                }, 100);
            } catch (e) {
                console.error(`Error setting up intersection observer: ${e.message}`);
            }
        }

        updateUIColors() {
            try {
                const { bgColor, textColor } = Utils.getUserUIColor();

                if (this.optionsBar) {
                    this.optionsBar.style.background = Utils.addAlpha(bgColor, 0.8);
                    this.optionsBar.style.color = textColor;
                }

                if (this.thumbnailBar) {
                    this.thumbnailBar.style.background = Utils.addAlpha(bgColor, 0.8);
                }

                const buttons = document.querySelectorAll('#xcom-image-viewer .icon-button');
                if (buttons.length > 0) {
                    buttons.forEach(button => {
                        button.style.background = bgColor;
                        button.style.color = textColor;
                    });
                }

                this.updateThumbnailFocus();
            } catch (e) {
                console.error(`Error updating UI colors: ${e.message}`);
            }
        }

        destroy() {
            try {
                if (!this.viewer) return;

                this.viewer.remove();
                this.viewer = null;

                this.currentImageIndicator = null;

                document.body.style.overflow = '';

                window.scrollTo(0, this.savedScrollPos);

                const viewerSpecificListeners = this.eventListeners.filter(
                    ({ element }) => element === this.viewer || element === this.optionsBar || element === this.thumbnailBar
                );

                viewerSpecificListeners.forEach(({ event, listener, options, element }) => {
                    if (element && element.removeEventListener) {
                        element.removeEventListener(event, listener, options);
                    }
                });

                this.resizeObservers.forEach(({ observer }) => {
                    if (observer) {
                        observer.disconnect();
                    }
                });
                this.resizeObservers = [];

                if (this.intersectionObserver) {
                    this.intersectionObserver.disconnect();
                    this.intersectionObserver = null;
                }

                clearTimeout(this.hideOptionsBarTimer);
                clearTimeout(this.hideThumbnailBarTimer);
                clearTimeout(this.manualNavigationTimeout);

                this.lazyLoadedImages = new Set();

                this.reinforceEventPrevention();
            } catch (e) {
                console.error(`Error destroying viewer: ${e.message}`);

                document.body.style.overflow = '';
            }
        }
    }

    const imageViewer = new ImageViewer();
    imageViewer.init();
})();
