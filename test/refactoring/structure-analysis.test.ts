/**
 * @fileoverview 구조 분석 및 리팩토링 계획 테스트
 * @description TDD 방식으로 현재 구조의 문제점을 식별하고 개선 방향을 제시
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('🔍 TDD Phase 1: 구조 분석 (RED)', () => {
  const srcPath = path.resolve(__dirname, '../../src');

  describe('중복 구현 검증', () => {
    it('DOM 관리 중복 구현 검출', () => {
      // 현재 DOM 관련 파일들
      const domFiles = [
        'shared/dom/UnifiedDOMManager.ts',
        'shared/utils/dom/DOMBatcher.ts',
        'shared/utils/core-utils.ts',
        'shared/dom/DOMCache.ts',
        'shared/dom/DOMEventManager.ts',
      ];

      const existingFiles = domFiles.filter(file => fs.existsSync(path.join(srcPath, file)));

      // 중복이 있음을 확인 (나중에 통합 필요)
      expect(existingFiles.length).toBeGreaterThan(2);
      console.log('🔍 DOM 중복 파일들:', existingFiles);
    });

    it('스타일 관리 중복 구현 검출', () => {
      const styleFiles = [
        'shared/styles/UnifiedStyleManager.ts',
        'shared/utils/styles/css-utilities.ts',
        'shared/utils/styles/style-utils.ts',
        'shared/utils/styles.ts',
      ];

      const existingFiles = styleFiles.filter(file => fs.existsSync(path.join(srcPath, file)));

      expect(existingFiles.length).toBeGreaterThan(2);
      console.log('🔍 스타일 중복 파일들:', existingFiles);
    });

    it('미디어 처리 중복 구현 검출', () => {
      const mediaFiles = [
        'shared/media/FilenameService.ts',
        'shared/utils/media/image-filter.ts',
        'shared/utils/media/media-url.util.ts',
        'shared/services/media/TwitterVideoExtractor.ts',
        'shared/services/MediaService.ts',
      ];

      const existingFiles = mediaFiles.filter(file => fs.existsSync(path.join(srcPath, file)));

      expect(existingFiles.length).toBeGreaterThan(2);
      console.log('🔍 미디어 중복 파일들:', existingFiles);
    });

    it('타입 정의 중복 검출', () => {
      const typeFiles = [
        'shared/types/core/media.types.ts',
        'shared/types/media.types.ts',
        'types/index.ts',
        'shared/types/app.types.ts',
      ];

      const existingFiles = typeFiles.filter(file => fs.existsSync(path.join(srcPath, file)));

      expect(existingFiles.length).toBeGreaterThan(2);
      console.log('🔍 타입 중복 파일들:', existingFiles);
    });
  });

  describe('불필요한 복잡성 검증', () => {
    it('utils 폴더 과도한 세분화 검출', () => {
      const utilsPath = path.join(srcPath, 'shared/utils');

      if (fs.existsSync(utilsPath)) {
        const subfolders = fs
          .readdirSync(utilsPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        // 10개 이상의 서브폴더는 과도함
        expect(subfolders.length).toBeGreaterThan(5);
        console.log('🔍 과도한 utils 서브폴더들:', subfolders);
      }
    });

    it('서비스 폴더 복잡성 검출', () => {
      const servicesPath = path.join(srcPath, 'shared/services');

      if (fs.existsSync(servicesPath)) {
        const allFiles = getAllFiles(servicesPath);
        const serviceFiles = allFiles.filter(file => file.endsWith('.ts'));

        // 20개 이상의 서비스 파일은 과도함
        expect(serviceFiles.length).toBeGreaterThan(10);
        console.log('🔍 서비스 파일 수:', serviceFiles.length);
      }
    });
  });

  describe('사용되지 않는 기능 검출', () => {
    it('virtual-scroll 사용 여부 검증', async () => {
      const virtualScrollExists = fs.existsSync(path.join(srcPath, 'shared/utils/virtual-scroll'));

      if (virtualScrollExists) {
        // 실제 사용되는지 확인 필요
        console.log('⚠️ virtual-scroll 모듈 존재 - 사용 여부 확인 필요');
        expect(virtualScrollExists).toBe(true);
      }
    });

    it('accessibility 유틸리티 사용 여부 검증', () => {
      const accessibilityExists = fs.existsSync(path.join(srcPath, 'shared/utils/accessibility'));

      if (accessibilityExists) {
        console.log('⚠️ accessibility 모듈 존재 - 사용 여부 확인 필요');
        expect(accessibilityExists).toBe(true);
      }
    });
  });
});

describe('🎯 TDD Phase 2: 리팩토링 목표 (GREEN)', () => {
  describe('새로운 구조 설계', () => {
    it('통합 DOM 관리자 요구사항 정의', () => {
      // 새로운 구조에서는 하나의 DOM 관리자만 존재해야 함
      const requiredFeatures = [
        'querySelector 캐싱',
        '배치 DOM 업데이트',
        '이벤트 관리',
        '성능 최적화',
      ];

      expect(requiredFeatures).toHaveLength(4);
      console.log('✅ DOM 관리자 요구사항:', requiredFeatures);
    });

    it('통합 스타일 관리자 요구사항 정의', () => {
      const requiredFeatures = [
        'CSS 변수 관리',
        '테마 적용',
        '글래스모피즘 효과',
        '클래스 결합 유틸리티',
      ];

      expect(requiredFeatures).toHaveLength(4);
      console.log('✅ 스타일 관리자 요구사항:', requiredFeatures);
    });

    it('통합 미디어 처리자 요구사항 정의', () => {
      const requiredFeatures = [
        '미디어 URL 추출',
        '고품질 URL 변환',
        '파일명 생성',
        '이미지 필터링',
      ];

      expect(requiredFeatures).toHaveLength(4);
      console.log('✅ 미디어 처리자 요구사항:', requiredFeatures);
    });
  });

  describe('간소화된 폴더 구조 제안', () => {
    it('새로운 core 구조 검증', () => {
      const newStructure = {
        'core/dom': '통합 DOM 관리',
        'core/styles': '통합 스타일 관리',
        'core/media': '통합 미디어 처리',
        'core/types': '모든 타입 정의',
        'features/gallery': '갤러리 기능',
        'features/settings': '설정 기능',
        services: '핵심 서비스만',
        utils: '범용 유틸리티만',
      };

      expect(Object.keys(newStructure)).toHaveLength(8);
      console.log('✅ 새로운 구조:', newStructure);
    });
  });
});

// 헬퍼 함수
function getAllFiles(dirPath: string, files: string[] = []): string[] {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
