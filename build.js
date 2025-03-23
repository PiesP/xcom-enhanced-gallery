import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const UTILS_DIR = path.join(SRC_DIR, 'utils');
const CORE_DIR = path.join(SRC_DIR, 'core');
const TWEET_DIR = path.join(SRC_DIR, 'tweet');
const I18N_DIR = path.join(SRC_DIR, 'I18N');
const I18N_UTILS_DIR = path.join(I18N_DIR, 'utils');
const LOCALES_DIR = path.join(I18N_DIR, 'locales');
const DIST_DIR = './dist';
const OUTPUT_FILE = 'xcom-enhanced-gallery.user.js';

const METADATA = `// ==UserScript==
// @name         X.com Enhanced Image Gallery
// @namespace    https://github.com/PiesP/xcom-enhanced-gallery
// @version      0.9.6
// @description  Enhanced image viewer for X.com that displays original-sized images in a vertical gallery with adjustable view modes and batch download options.
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/js/all.min.js
// ==/UserScript==\n\n`;

// 로케일 JSON 파일을 JavaScript 객체로 처리
const processLocaleFiles = () => {
  const locales = {};
  
  if (fs.existsSync(LOCALES_DIR)) {
    const files = fs.readdirSync(LOCALES_DIR)
      .filter(file => file.endsWith('.json'));
    
    files.forEach(file => {
      const locale = path.basename(file, '.json');
      const filePath = path.join(LOCALES_DIR, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        locales[locale] = JSON.parse(content);
      } catch (e) {
        console.error(`Error processing locale file ${file}:`, e);
      }
    });
  }
  
  return `// == I18N/locales.js ==
const LOCALE_DATA = ${JSON.stringify(locales, null, 2)};\n\n`;
};

// 로케일 로더 함수 수정
const modifyLocaleLoader = (content) => {
  return content.replace(
    /const loadLocaleFile = async \(locale\) => \{[\s\S]*?return \{\};[\s\S]*?\};/,
    `const loadLocaleFile = async (locale) => {
  return LOCALE_DATA[locale] || {};
};`
  );
};

// JavaScript 코드 변환 및 수정
const processJavaScriptFile = (content, filePath) => {
  // import 문 제거
  content = content.replace(/import .*?;\n?/g, '');
  
  // export 구문 처리 개선
  if (filePath.includes('index.js')) {
    // 인덱스 파일의 내보내기 객체를 적절히 처리
    content = content.replace(/export default \{[\s\S]*?\};/, '');
  }
  
  // export class 처리
  content = content.replace(/export (class|function) (\w+)/g, '$1 $2');
  
  // export const/let/var 처리
  content = content.replace(/export (const|let|var) (\w+)/g, '$1 $2');

  return content;
};

// 출력 초기화
let output = METADATA;

// 로케일 데이터 추가
output += processLocaleFiles();

// 파일 순서 - 의존성 순서대로 정렬
const configFiles = [
  path.join(SRC_DIR, 'debug.js'),
  path.join(SRC_DIR, 'config.js'),
  path.join(SRC_DIR, 'CSS.js')
];

// 유틸리티 파일 (분할된 파일 추가)
const utilsFiles = [
  path.join(UTILS_DIR, 'StorageUtils.js'),
  path.join(UTILS_DIR, 'DOMUtils.js'),
  path.join(UTILS_DIR, 'URLUtils.js'),
  path.join(UTILS_DIR, 'FunctionUtils.js'),
  path.join(SRC_DIR, 'Utils.js')
];

const i18nUtilFiles = [
  path.join(I18N_UTILS_DIR, 'StringFormatter.js'),
  path.join(I18N_UTILS_DIR, 'LocaleDetector.js')
];

const i18nFiles = [
  path.join(I18N_DIR, 'TranslationManager.js'),
  path.join(I18N_DIR, 'index.js')
];

// 트윗 관련 파일 (분할된 파일 추가)
const tweetFiles = [
  path.join(TWEET_DIR, 'ImageExtractor.js'),
  path.join(TWEET_DIR, 'TweetDataExtractor.js'),
  path.join(SRC_DIR, 'TweetInfo.js')
];

const componentUtilFiles = [
  path.join(COMPONENTS_DIR, 'ViewerState.js'),
  path.join(COMPONENTS_DIR, 'ImageAdjustment.js'),
  path.join(COMPONENTS_DIR, 'ThumbnailManager.js')
];

const componentFiles = [
  path.join(COMPONENTS_DIR, 'LanguageSelector.js'),
  path.join(COMPONENTS_DIR, 'ViewerDOM.js'),
  path.join(COMPONENTS_DIR, 'ViewerNavigation.js'),
  path.join(COMPONENTS_DIR, 'ViewerDownload.js'),
  path.join(COMPONENTS_DIR, 'ViewerEvents.js'),
  path.join(COMPONENTS_DIR, 'ViewerImageLoader.js'),
  path.join(COMPONENTS_DIR, 'ViewerFocus.js')
];

// 테마 관련 파일
const themeFiles = [
  path.join(SRC_DIR, 'theme', 'themeVariables.js'),
  path.join(SRC_DIR, 'theme', 'ThemeManager.js'),
  path.join(SRC_DIR, 'theme', 'LayoutManager.js')
];

// 뷰어 코어 파일 (분할된 파일 추가)
const coreFiles = [
  path.join(CORE_DIR, 'ViewerComponentInitializer.js'),
  path.join(CORE_DIR, 'ViewerNavigationManager.js'),
  path.join(CORE_DIR, 'ViewerUIManager.js'),
  path.join(CORE_DIR, 'ViewerCleanup.js'),
  path.join(SRC_DIR, 'ViewerCore.js'),
  path.join(SRC_DIR, 'ImageViewer.js')
];

const supportFiles = [
  path.join(SRC_DIR, 'URLManager.js'),
  path.join(SRC_DIR, 'EventListeners.js')
];

const mainFiles = [
  path.join(SRC_DIR, 'main.js')
];

// 파일 배열에 대한 처리 함수
const processFileArray = (files, description) => {
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      content = processJavaScriptFile(content, filePath);
      
      const relativePath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
      output += `// == ${relativePath} ==\n${content}\n\n`;
    } else {
      console.warn(`파일을 찾을 수 없습니다: ${filePath}`);
    }
  });
};

// 각 파일 그룹 처리
console.log("기본 설정 파일 처리 중...");
processFileArray(configFiles, "기본 설정");

console.log("유틸리티 파일 처리 중...");
processFileArray(utilsFiles, "유틸리티");

console.log("I18N 유틸리티 파일 처리 중...");
processFileArray(i18nUtilFiles, "I18N 유틸리티");

console.log("I18N 파일 처리 중...");
i18nFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = processJavaScriptFile(content, filePath);
    
    if (filePath.endsWith('index.js')) {
      content = modifyLocaleLoader(content);
      
      content = content.replace(
        /const translate = \(key, ...params\) => \{/,
        'function translate(key, ...params) {'
      );
      
      content = content.replace(
        /const setLocale = \(locale\) => \{/,
        'function setLocale(locale) {'
      );
      
      content = content.replace(
        /const getLocale = \(\) => \{/,
        'function getLocale() {'
      );
      
      content = content.replace(
        /const getSupportedLocales = \(\) => \{/,
        'function getSupportedLocales() {'
      );
    }
    
    const relativePath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
    output += `// == ${relativePath} ==\n${content}\n\n`;
  } else {
    console.warn(`파일을 찾을 수 없습니다: ${filePath}`);
  }
});

console.log("트윗 관련 파일 처리 중...");
processFileArray(tweetFiles, "트윗 관련");

console.log("컴포넌트 유틸리티 파일 처리 중...");
processFileArray(componentUtilFiles, "컴포넌트 유틸리티");

console.log("컴포넌트 파일 처리 중...");
processFileArray(componentFiles, "컴포넌트");

console.log("지원 파일 처리 중...");
processFileArray(supportFiles, "지원");

console.log("코어 파일 처리 중...");
processFileArray(coreFiles, "코어");

console.log("테마 파일 처리 중...");
processFileArray(themeFiles, "테마");

console.log("메인 파일 처리 중...");
processFileArray(mainFiles, "메인");

// dist 디렉토리가 없으면 생성
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 파일 저장
fs.writeFileSync(path.join(DIST_DIR, OUTPUT_FILE), output, 'utf-8');
console.log(`빌드 완료: ${path.join(DIST_DIR, OUTPUT_FILE)}`);
