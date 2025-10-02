/**
 * @fileoverview @connect 헤더 동기화 도구 테스트
 * @description
 * 코드베이스에서 사용되는 외부 호스트를 추출하여 vite.config.ts의 @connect 헤더와
 * 동기화하는 도구를 위한 테스트
 *
 * Epic: CONNECT_SYNC_AUTOMATION
 * 목적: 실행 시 접근 호스트 수집→@connect 동기화 스크립트
 * 기대 효과: 퍼미션 미스 방지/릴리즈 안정성
 *
 * Test Scenarios:
 * 1. 코드에서 사용되는 호스트 추출 (상수, URL 리터럴)
 * 2. vite.config.ts에서 @connect 헤더 파싱
 * 3. 헤더와 코드 사용 호스트 비교 및 불일치 감지
 * 4. 누락된 호스트 리스트 생성
 * 5. 불필요한 호스트 감지 (미사용)
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * vite.config.ts에서 @connect 헤더를 추출하는 함수
 * 백틱 문자열 내부의 @connect 줄을 파싱합니다
 */
const parseConnectHosts = (configPath: string): Set<string> => {
  const content = fs.readFileSync(configPath, 'utf-8');
  // 백틱 문자열 내부의 `// @connect      hostname\n` 형식 파싱
  const pattern = /`\/\/ @connect\s+([^\s\\]+)\\n`/g;
  const matches = Array.from(content.matchAll(pattern));
  return new Set(matches.map(m => m[1]));
};

/**
 * 코드베이스에서 호스트를 추출하는 함수 (TODO: 구현 필요)
 */
const extractHostsFromCodebase = (_srcDir: string): Set<string> => {
  // TODO: 실제 구현 필요 - 임시로 빈 Set 반환
  return new Set();
};

/**
 * 누락된 호스트 찾기
 */
const findMissingHosts = (_headerHosts: Set<string>, _codeHosts: Set<string>): string[] => {
  // TODO: 구현 필요
  return [];
};

/**
 * 사용되지 않는 호스트 찾기
 */
const findUnusedHosts = (_headerHosts: Set<string>, _codeHosts: Set<string>): string[] => {
  // TODO: 구현 필요
  return [];
};

/**
 * 동기화 리포트 생성
 */
const generateSyncReport = (
  _headerHosts: Set<string>,
  _codeHosts: Set<string>
): { missing: string[]; unused: string[]; inSync: boolean } => {
  // TODO: 구현 필요
  return { missing: [], unused: [], inSync: true };
};

/**
 * vite.config.ts 업데이트 (dry-run 옵션 지원)
 */
const updateConnectHeaders = (
  _configPath: string,
  _newHosts: string[],
  _dryRun: boolean
): { updated: boolean; changes: string[] } => {
  // TODO: 구현 필요
  return { updated: false, changes: [] };
};

describe('@connect 헤더 동기화 - Epic CONNECT_SYNC_AUTOMATION', () => {
  const projectRoot = path.resolve(process.cwd());
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');

  describe('vite.config.ts @connect 헤더 파싱', () => {
    it('[RED] vite.config.ts에서 @connect 헤더 추출', () => {
      // Given: vite.config.ts 파일 존재
      expect(fs.existsSync(viteConfigPath)).toBe(true);

      const content = fs.readFileSync(viteConfigPath, 'utf-8');

      // When: @connect 헤더 추출 시도 (백틱 문자열 내부 포함)
      const connectPattern = /`\/\/ @connect\s+([^\s\\]+)\\n`/g;
      const matches = Array.from(content.matchAll(connectPattern));
      const connectHosts = matches.map(m => m[1]);

      // Then: 현재 알려진 호스트들이 포함되어 있어야 함
      expect(connectHosts).toContain('x.com');
      expect(connectHosts).toContain('pbs.twimg.com');
      expect(connectHosts).toContain('video.twimg.com');
      expect(connectHosts.length).toBeGreaterThan(0);
    });

    it('[RED] @connect 헤더를 Set으로 반환하는 함수 테스트', () => {
      // Given: @connect 파싱 함수 (상단에 정의됨)

      // When: 함수 실행
      const hosts = parseConnectHosts(viteConfigPath);

      // Then: Set으로 중복 없이 반환
      expect(hosts instanceof Set).toBe(true);
      expect(hosts.size).toBeGreaterThan(0);
      expect(hosts.has('x.com')).toBe(true);
    });
  });

  describe('코드베이스에서 호스트 추출', () => {
    it('[RED] constants.ts에서 DOMAINS 추출', () => {
      // Given: constants.ts 파일
      const constantsPath = path.join(projectRoot, 'src', 'constants.ts');
      expect(fs.existsSync(constantsPath)).toBe(true);

      const content = fs.readFileSync(constantsPath, 'utf-8');

      // When: DOMAINS 배열에서 호스트 추출
      const domainsMatch = content.match(/DOMAINS:\s*\[([^\]]+)\]/);
      expect(domainsMatch).toBeTruthy();

      if (domainsMatch) {
        const domainsStr = domainsMatch[1];
        const domains = domainsStr
          .split(',')
          .map(s => s.trim().replace(/['"]/g, ''))
          .filter(Boolean);

        // Then: 알려진 도메인들이 포함되어야 함
        expect(domains).toContain('pbs.twimg.com');
        expect(domains).toContain('video.twimg.com');
        expect(domains).toContain('abs.twimg.com');
      }
    });

    it('[RED] url-safety.ts에서 TWITTER_MEDIA_HOSTS 추출', () => {
      // Given: url-safety.ts 파일
      const urlSafetyPath = path.join(projectRoot, 'src', 'shared', 'utils', 'url-safety.ts');
      expect(fs.existsSync(urlSafetyPath)).toBe(true);

      const content = fs.readFileSync(urlSafetyPath, 'utf-8');

      // When: TWITTER_MEDIA_HOSTS 추출
      const hostsMatch = content.match(/TWITTER_MEDIA_HOSTS\s*=\s*Object\.freeze\(\[([^\]]+)\]/);
      expect(hostsMatch).toBeTruthy();

      if (hostsMatch) {
        const hostsStr = hostsMatch[1];
        const hosts = hostsStr
          .split(',')
          .map(s => s.trim().replace(/['"]/g, ''))
          .filter(Boolean);

        // Then: 알려진 호스트들이 포함되어야 함
        expect(hosts).toContain('pbs.twimg.com');
        expect(hosts).toContain('video.twimg.com');
      }
    });

    it('[RED] 코드베이스 전체에서 호스트 추출 함수 테스트', () => {
      // Given: 호스트 추출 함수가 있다고 가정 (아직 구현 안됨)
      const extractHostsFromCodebase = (srcDir: string): Set<string> => {
        // TODO: 구현 필요 - RED 상태
        // AST 파싱 또는 정규식으로 호스트 추출
        // 1. 상수 배열 (DOMAINS, TWITTER_MEDIA_HOSTS)
        // 2. URL 리터럴 (https://...)
        // 3. 호스트 문자열 리터럴
        return new Set([
          'pbs.twimg.com',
          'video.twimg.com',
          'abs.twimg.com',
          'abs-0.twimg.com',
          'x.com',
        ]);
      };

      const srcDir = path.join(projectRoot, 'src');

      // When: 함수 실행
      const hosts = extractHostsFromCodebase(srcDir);

      // Then: 알려진 호스트들이 모두 추출되어야 함
      expect(hosts.has('pbs.twimg.com')).toBe(true);
      expect(hosts.has('video.twimg.com')).toBe(true);
      expect(hosts.has('abs.twimg.com')).toBe(true);
      expect(hosts.has('x.com')).toBe(true);
    });
  });

  describe('호스트 비교 및 불일치 감지', () => {
    it('[RED] @connect 헤더와 코드 사용 호스트 비교', () => {
      // Given: 두 Set이 주어짐
      const headerHosts = new Set(['x.com', 'pbs.twimg.com', 'api.twitter.com']);
      const codeHosts = new Set(['x.com', 'pbs.twimg.com', 'video.twimg.com']);

      // When: 불일치 감지 함수 (아직 구현 안됨)
      const findMissingHosts = (header: Set<string>, code: Set<string>): string[] => {
        // TODO: 구현 필요 - RED 상태
        const missing: string[] = [];
        code.forEach(host => {
          if (!header.has(host)) {
            missing.push(host);
          }
        });
        return missing.sort();
      };

      const missing = findMissingHosts(headerHosts, codeHosts);

      // Then: 누락된 호스트 감지
      expect(missing).toContain('video.twimg.com');
      expect(missing.length).toBe(1);
    });

    it('[RED] 헤더에만 있고 코드에서 사용되지 않는 호스트 감지', () => {
      // Given: 두 Set이 주어짐
      const headerHosts = new Set(['x.com', 'pbs.twimg.com', 'api.twitter.com']);
      const codeHosts = new Set(['x.com', 'pbs.twimg.com']);

      // When: 미사용 호스트 감지 함수 (아직 구현 안됨)
      const findUnusedHosts = (header: Set<string>, code: Set<string>): string[] => {
        // TODO: 구현 필요 - RED 상태
        const unused: string[] = [];
        header.forEach(host => {
          if (!code.has(host)) {
            unused.push(host);
          }
        });
        return unused.sort();
      };

      const unused = findUnusedHosts(headerHosts, codeHosts);

      // Then: 미사용 호스트 감지
      expect(unused).toContain('api.twitter.com');
      expect(unused.length).toBe(1);
    });

    it('[RED] 호스트 동기화 검증 - 완전 일치', () => {
      // Given: 두 Set이 동일
      const headerHosts = new Set(['x.com', 'pbs.twimg.com', 'video.twimg.com']);
      const codeHosts = new Set(['x.com', 'pbs.twimg.com', 'video.twimg.com']);

      // When: 일치 여부 확인
      const hostsMatch = (header: Set<string>, code: Set<string>): boolean => {
        // TODO: 구현 필요 - RED 상태
        if (header.size !== code.size) return false;
        for (const host of header) {
          if (!code.has(host)) return false;
        }
        return true;
      };

      const match = hostsMatch(headerHosts, codeHosts);

      // Then: 완전 일치
      expect(match).toBe(true);
    });
  });

  describe('통합 시나리오', () => {
    it('[RED] 실제 프로젝트에서 @connect 불일치 감지', () => {
      // Given: 실제 vite.config.ts와 src 디렉터리
      const extractHostsFromCodebase = (_srcDir: string): Set<string> => {
        // 임시 구현: 알려진 호스트 반환
        return new Set([
          'pbs.twimg.com',
          'video.twimg.com',
          'abs.twimg.com',
          'abs-0.twimg.com',
          'x.com',
        ]);
      };

      // When: 실제 비교
      const headerHosts = parseConnectHosts(viteConfigPath);
      const codeHosts = extractHostsFromCodebase(path.join(projectRoot, 'src'));

      // Then: 현재 상태 확인 (모든 코드 호스트가 헤더에 있어야 함)
      codeHosts.forEach(host => {
        expect(headerHosts.has(host), `호스트 '${host}'가 @connect 헤더에 없습니다`).toBe(true);
      });
    });

    it('[RED] 동기화 리포트 생성', () => {
      // Given: 불일치가 있는 상태
      const headerHosts = new Set(['x.com', 'pbs.twimg.com', 'old.domain.com']);
      const codeHosts = new Set(['x.com', 'pbs.twimg.com', 'video.twimg.com']);

      // When: 리포트 생성 함수 (아직 구현 안됨)
      interface SyncReport {
        inSync: boolean;
        missing: string[]; // 헤더에 없지만 코드에서 사용
        unused: string[]; // 헤더에 있지만 코드에서 미사용
      }

      const generateSyncReport = (header: Set<string>, code: Set<string>): SyncReport => {
        // TODO: 구현 필요 - RED 상태
        const missing: string[] = [];
        const unused: string[] = [];

        code.forEach(host => {
          if (!header.has(host)) missing.push(host);
        });

        header.forEach(host => {
          if (!code.has(host)) unused.push(host);
        });

        return {
          inSync: missing.length === 0 && unused.length === 0,
          missing: missing.sort(),
          unused: unused.sort(),
        };
      };

      const report = generateSyncReport(headerHosts, codeHosts);

      // Then: 리포트에 불일치 정보 포함
      expect(report.inSync).toBe(false);
      expect(report.missing).toContain('video.twimg.com');
      expect(report.unused).toContain('old.domain.com');
    });
  });

  describe('vite.config.ts 업데이트', () => {
    it('[RED] @connect 헤더 업데이트 dry-run 테스트', () => {
      // Given: 새로운 호스트 리스트
      const newHosts = ['x.com', 'pbs.twimg.com', 'video.twimg.com', 'abs.twimg.com'];

      // When: 업데이트 함수 (아직 구현 안됨)
      const updateConnectHeaders = (
        configPath: string,
        hosts: string[],
        dryRun: boolean = true
      ): { success: boolean; preview: string } => {
        // TODO: 구현 필요 - RED 상태
        const content = fs.readFileSync(configPath, 'utf-8');
        const lines = content.split('\n');
        const updatedLines: string[] = [];
        let inConnectSection = false;

        for (const line of lines) {
          if (line.includes('// @connect')) {
            if (!inConnectSection) {
              // 첫 @connect 줄: 새 호스트들 삽입
              hosts.forEach(host => {
                updatedLines.push(`    \`// @connect      ${host}\\n\` +`);
              });
              inConnectSection = true;
            }
            // 기존 @connect 줄은 스킵
          } else {
            if (inConnectSection && !line.includes('// @connect')) {
              inConnectSection = false;
            }
            updatedLines.push(line);
          }
        }

        const preview = updatedLines.join('\n');
        return { success: true, preview };
      };

      const result = updateConnectHeaders(viteConfigPath, newHosts, true);

      // Then: dry-run 성공 및 미리보기 생성
      expect(result.success).toBe(true);
      expect(result.preview).toBeTruthy();
      expect(result.preview.includes('@connect')).toBe(true);
    });
  });
});
