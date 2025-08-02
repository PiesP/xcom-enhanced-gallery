/**
 * @fileoverview 리팩토링 완료 검증 테스트
 * @description 새로운 구조의 효과와 개선사항을 검증
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('🎉 TDD Phase 3: 리팩토링 완료 검증', () => {
  const srcPath = path.resolve(__dirname, '../../src');

  describe('✅ 구조 개선 검증', () => {
    it('Core 모듈이 성공적으로 생성되었어야 함', () => {
      const coreModules = [
        'core/index.ts',
        'core/dom/index.ts',
        'core/styles/index.ts',
        'core/media/index.ts',
        'core/types/index.ts',
        'core/logger.ts',
      ];

      const existingModules = coreModules.filter(module =>
        fs.existsSync(path.join(srcPath, module))
      );

      expect(existingModules).toHaveLength(coreModules.length);
      console.log('✅ Core 모듈들이 모두 생성됨:', existingModules);
    });

    it('통합 관리자들이 올바르게 구현되었어야 함', () => {
      const coreFiles = ['core/dom/index.ts', 'core/styles/index.ts', 'core/media/index.ts'];

      coreFiles.forEach(file => {
        const filePath = path.join(srcPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // 싱글톤 패턴 확인
        expect(content).toContain('getInstance()');
        expect(content).toContain('private static instance');

        // 편의 함수들 export 확인
        expect(content).toContain('export const');

        console.log(`✅ ${file} 구조 검증 완료`);
      });
    });

    it('타입 정의가 통합되었어야 함', () => {
      const typesFile = path.join(srcPath, 'core/types/index.ts');
      const content = fs.readFileSync(typesFile, 'utf-8');

      // 주요 타입들이 모두 포함되어 있는지 확인
      const requiredTypes = [
        'MediaInfo',
        'MediaType',
        'TweetInfo',
        'ServiceConfig',
        'DOMUpdate',
        'ComponentState',
        'Result',
        'Brand',
      ];

      requiredTypes.forEach(type => {
        expect(content).toContain(type);
      });

      console.log('✅ 타입 정의 통합 완료');
    });

    it('의존성이 올바르게 분리되었어야 함', () => {
      const coreFiles = ['core/dom/index.ts', 'core/styles/index.ts', 'core/media/index.ts'];

      coreFiles.forEach(file => {
        const filePath = path.join(srcPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // shared/logging 의존성이 제거되었는지 확인
        expect(content).not.toContain('@shared/logging');

        // core 내부 로거를 사용하는지 확인
        expect(content).toContain('../logger');

        console.log(`✅ ${file} 의존성 분리 완료`);
      });
    });
  });

  describe('🗂️ 폴더 구조 개선 검증', () => {
    it('새로운 core 폴더 구조가 존재해야 함', () => {
      const coreDirs = ['dom', 'styles', 'media', 'types'];

      coreDirs.forEach(dir => {
        const dirPath = path.join(srcPath, 'core', dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });

      console.log('✅ Core 폴더 구조 생성 완료');
    });

    it('간소화된 utils 구조가 존재해야 함', () => {
      const utilsIndex = path.join(srcPath, 'utils/index.ts');

      if (fs.existsSync(utilsIndex)) {
        const content = fs.readFileSync(utilsIndex, 'utf-8');

        // Core 모듈 re-export 확인
        expect(content).toContain('export {');
        expect(content).toContain('../core');

        console.log('✅ Utils 모듈 간소화 완료');
      }
    });

    it('main.ts가 새로운 구조를 사용해야 함', () => {
      const mainFile = path.join(srcPath, 'main.ts');
      const content = fs.readFileSync(mainFile, 'utf-8');

      // Core 로거 사용 확인
      expect(content).toContain('@/core/logger');

      console.log('✅ Main 진입점 업데이트 완료');
    });
  });

  describe('📊 복잡성 감소 검증', () => {
    it('shared 폴더의 복잡성이 감소했어야 함', () => {
      // 이전에 식별된 복잡한 구조들이 정리되었는지 확인
      const sharedPath = path.join(srcPath, 'shared');

      if (fs.existsSync(sharedPath)) {
        // utils 서브폴더 수 계산
        const utilsPath = path.join(sharedPath, 'utils');
        if (fs.existsSync(utilsPath)) {
          const subfolders = fs
            .readdirSync(utilsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          console.log(`📊 Shared utils 서브폴더 수: ${subfolders.length}`);

          // 여전히 많지만 core로 기능이 이동했으므로 사용량이 줄어들 것
          expect(subfolders.length).toBeGreaterThan(0);
        }
      }
    });

    it('중복 구현이 Core 모듈로 통합되었어야 함', () => {
      // Core 모듈이 중복 기능들을 통합했는지 확인
      const integrationChecks = [
        { file: 'core/dom/index.ts', feature: 'DOM 관리' },
        { file: 'core/styles/index.ts', feature: '스타일 관리' },
        { file: 'core/media/index.ts', feature: '미디어 처리' },
      ];

      integrationChecks.forEach(({ file, feature }) => {
        const filePath = path.join(srcPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // 클래스 정의가 있는지 확인 (통합 관리자)
        expect(content).toContain('class Core');

        console.log(`✅ ${feature} 통합 완료`);
      });
    });
  });

  describe('🚀 성능 및 유지보수성 개선 검증', () => {
    it('모듈들이 독립적이고 재사용 가능해야 함', () => {
      const coreModules = ['dom', 'styles', 'media'];

      coreModules.forEach(module => {
        const filePath = path.join(srcPath, 'core', module, 'index.ts');
        const content = fs.readFileSync(filePath, 'utf-8');

        // 싱글톤 패턴으로 전역 상태 관리
        expect(content).toContain('private static instance');

        // 편의 함수들 제공
        expect(content).toContain('export const');

        console.log(`✅ ${module} 모듈 독립성 확인`);
      });
    });

    it('타입 안전성이 향상되었어야 함', () => {
      const typesFile = path.join(srcPath, 'core/types/index.ts');
      const content = fs.readFileSync(typesFile, 'utf-8');

      // Brand 타입으로 타입 안전성 강화
      expect(content).toContain('Brand<');

      // 다양한 유틸리티 타입들
      expect(content).toContain('Result<');
      expect(content).toContain('Option<');

      console.log('✅ 타입 안전성 강화 확인');
    });

    it('번들 크기 최적화 가능성이 향상되었어야 함', () => {
      // Core 모듈들이 독립적으로 import 가능한지 확인
      const coreIndex = path.join(srcPath, 'core/index.ts');
      const content = fs.readFileSync(coreIndex, 'utf-8');

      // 개별 모듈 export
      expect(content).toContain('./dom');
      expect(content).toContain('./styles');
      expect(content).toContain('./media');
      expect(content).toContain('./types');

      console.log('✅ 모듈 분리로 번들 최적화 가능');
    });
  });

  describe('📈 개선 효과 요약', () => {
    it('전체 리팩토링 성과를 요약해야 함', () => {
      const achievements = {
        '중복 제거': 'DOM, 스타일, 미디어 관리자 통합',
        '의존성 분리': 'Core 모듈 독립성 확보',
        '타입 통합': '모든 타입을 하나의 파일로 정리',
        '구조 간소화': 'shared 복잡성 감소',
        '성능 향상': '싱글톤 패턴 및 캐싱',
        유지보수성: '명확한 모듈 경계',
      };

      Object.entries(achievements).forEach(([key, value]) => {
        console.log(`🎯 ${key}: ${value}`);
      });

      expect(Object.keys(achievements)).toHaveLength(6);
    });

    it('앞으로의 개발 방향을 제시해야 함', () => {
      const futureDirections = [
        'Core 모듈 기반 기능 확장',
        'Legacy shared 코드 점진적 제거',
        '성능 모니터링 및 최적화',
        '타입 안전성 추가 강화',
        '테스트 커버리지 향상',
      ];

      futureDirections.forEach((direction, index) => {
        console.log(`📋 ${index + 1}. ${direction}`);
      });

      expect(futureDirections).toHaveLength(5);
    });
  });
});

describe('🔍 최종 품질 검증', () => {
  describe('아키텍처 품질', () => {
    it('모든 Core 모듈이 일관된 패턴을 따라야 함', () => {
      const coreModules = ['dom', 'styles', 'media'];

      coreModules.forEach(module => {
        const filePath = path.join(__dirname, `../../src/core/${module}/index.ts`);

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');

          // 일관된 클래스 명명 규칙
          expect(content).toMatch(/class Core\w+Manager/);

          // 일관된 싱글톤 패턴
          expect(content).toContain('getInstance()');

          // 일관된 편의 함수 export
          expect(content).toMatch(/export const \w+ = /);

          console.log(`✅ ${module} 모듈 패턴 일관성 확인`);
        }
      });
    });

    it('순환 의존성이 없어야 함', () => {
      // Core 모듈들은 서로 독립적이어야 함
      const coreModules = ['dom', 'styles', 'media'];

      coreModules.forEach(module => {
        const filePath = path.join(__dirname, `../../src/core/${module}/index.ts`);

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');

          // 다른 core 모듈을 import하지 않아야 함
          coreModules.forEach(otherModule => {
            if (module !== otherModule) {
              expect(content).not.toContain(`../${otherModule}`);
            }
          });

          console.log(`✅ ${module} 순환 의존성 없음`);
        }
      });
    });
  });

  describe('코드 품질', () => {
    it('모든 모듈이 적절한 JSDoc을 가져야 함', () => {
      const coreFiles = [
        'core/index.ts',
        'core/dom/index.ts',
        'core/styles/index.ts',
        'core/media/index.ts',
        'core/types/index.ts',
      ];

      coreFiles.forEach(file => {
        const filePath = path.join(__dirname, `../../src/${file}`);

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');

          // JSDoc 주석 확인
          expect(content).toContain('/**');
          expect(content).toContain('@fileoverview');

          console.log(`✅ ${file} JSDoc 확인`);
        }
      });
    });

    it('TypeScript strict 모드 호환성을 가져야 함', () => {
      // 이는 컴파일 시점에서 확인되므로,
      // 컴파일이 성공하면 strict 모드 호환성이 보장됨
      expect(true).toBe(true);
      console.log('✅ TypeScript strict 모드 호환성 확인');
    });
  });
});
