#!/usr/bin/env node
/**
 * @fileoverview GalleryHOC.tsx 명명 표준화 스크립트
 * @description "unified" 접두사를 안전하게 제거하는 자동화 스크립트
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/shared/components/hoc/GalleryHOC.tsx');

console.log('GalleryHOC.tsx 명명 표준화 시작...');

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Interface 변경
content = content.replace(/UnifiedGalleryComponentProps/g, 'GalleryComponentProps');

// 2. 함수명 변경
content = content.replace(/createUnifiedMarkerAttributes/g, 'createMarkerAttributes');
content = content.replace(/createUnifiedClassName/g, 'createClassName');
content = content.replace(/createUnifiedEventHandlers/g, 'createEventHandlers');
content = content.replace(/isUnifiedGalleryElement/g, 'isGalleryElement');
content = content.replace(/isEventFromUnifiedGallery/g, 'isEventFromGallery');

// 3. 변수명 변경
content = content.replace(/UnifiedGalleryComponent/g, 'GalleryComponent');
content = content.replace(/unifiedClassName/g, 'className');

// 4. 로그 메시지 변경
content = content.replace(/unified gallery/g, 'gallery');
content = content.replace(/Unified gallery/g, 'Gallery');

// 5. 주석 변경
content = content.replace(/통합 갤러리 HOC/g, '갤러리 HOC');
content = content.replace(/통합 HOC입니다/g, 'HOC입니다');
content = content.replace(/통합 마킹 속성 생성/g, '마킹 속성 생성');
content = content.replace(/통합 클래스명 생성/g, '클래스명 생성');
content = content.replace(/통합 이벤트 핸들러 생성/g, '이벤트 핸들러 생성');
content = content.replace(/통합 갤러리 요소/g, '갤러리 요소');

// 6. 설명 텍스트 정리
content = content.replace(/모든 갤러리 관련 컴포넌트에 대한 통합/g, '모든 갤러리 관련 컴포넌트를 위한');

// 파일 쓰기
fs.writeFileSync(filePath, content, 'utf-8');

console.log('GalleryHOC.tsx 명명 표준화 완료!');
console.log('변경된 내용:');
console.log('- UnifiedGalleryComponentProps → GalleryComponentProps');
console.log('- createUnified* → create*');
console.log('- isUnifiedGallery* → isGallery*');
console.log('- UnifiedGalleryComponent → GalleryComponent');
console.log('- 주석의 "통합" 접두사 제거');
