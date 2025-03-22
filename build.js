import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const DIST_DIR = './dist';
const OUTPUT_FILE = 'xcom-enhanced-gallery.user.js';

const METADATA = `// ==UserScript==
// @name         X.com Enhanced Image Gallery
// @namespace    https://github.com/PiesP/xcom-enhanced-gallery
// @version      0.9.5
// @description  Enhanced image viewer for X.com that displays original-sized images in a vertical gallery with adjustable view modes and batch download options.
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/js/all.min.js
// ==/UserScript==\n\n`;

// 파일 순서 - 의존성 순서대로 정렬
const coreFiles = ['I18N.js', 'Utils.js', 'CSS.js'];
const componentFiles = ['ViewerDOM.js', 'ViewerNavigation.js', 'ViewerDownload.js', 'ViewerEvents.js'];
const mainFiles = ['TweetInfo.js', 'ImageViewer.js', 'main.js'];

let output = METADATA;

// 코어 파일 추가
coreFiles.forEach(file => {
    const filePath = path.join(SRC_DIR, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(/import .*?;\n?/g, ''); // import 문 제거
        content = content.replace(/export /g, ''); // export 키워드 제거
        output += `// == ${file} ==\n${content}\n\n`;
    }
});

// 컴포넌트 파일 추가
componentFiles.forEach(file => {
    const filePath = path.join(COMPONENTS_DIR, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(/import .*?;\n?/g, ''); // import 문 제거
        content = content.replace(/export /g, ''); // export 키워드 제거
        output += `// == ${file} ==\n${content}\n\n`;
    }
});

// 메인 파일 추가
mainFiles.forEach(file => {
    const filePath = path.join(SRC_DIR, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(/import .*?;\n?/g, ''); // import 문 제거
        content = content.replace(/export /g, ''); // export 키워드 제거
        output += `// == ${file} ==\n${content}\n\n`;
    }
});

// dist 디렉토리가 없으면 생성
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// 파일 저장
fs.writeFileSync(path.join(DIST_DIR, OUTPUT_FILE), output, 'utf-8');
console.log(`빌드 완료: ${path.join(DIST_DIR, OUTPUT_FILE)}`);
