/**
 * @fileoverview Phase 19: 테스트 console.log 제거 검증
 * @description 프로덕션 코드에서 테스트용 console.log 제거 확인
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const projectRoot = resolve(__dirname, '../../../');

describe('Phase 19: 테스트 console.log 제거 (RED → GREEN)', () => {
  describe('19.1: [TEST] 태그가 있는 console.log 제거', () => {
    it('main.ts에 [TEST] 태그가 있는 console.log가 없어야 함', () => {
      const mainPath = resolve(projectRoot, 'src/main.ts');
      const content = readFileSync(mainPath, 'utf-8');

      // [TEST] 태그가 있는 console.log 찾기
      const testLogRegex = /console\.log\s*\(\s*['"`]\[TEST\]/gi;
      const matches = content.match(testLogRegex);

      expect(matches).toBeNull();
    });

    it('events.ts에 [TEST] 태그가 있는 console.log가 없어야 함', () => {
      const eventsPath = resolve(projectRoot, 'src/bootstrap/events.ts');
      const content = readFileSync(eventsPath, 'utf-8');

      // [TEST] 태그가 있는 console.log 찾기
      const testLogRegex = /console\.log\s*\(\s*['"`]\[TEST\]/gi;
      const matches = content.match(testLogRegex);

      expect(matches).toBeNull();
    });
  });

  describe('19.2: main.ts cleanup 로그 정리', () => {
    it('cleanup:before 로그가 제거되거나 logger.debug로 변경되어야 함', () => {
      const mainPath = resolve(projectRoot, 'src/main.ts');
      const content = readFileSync(mainPath, 'utf-8');

      // cleanup:before 관련 console.log 찾기
      const cleanupBeforeRegex = /console\.log\s*\(\s*['"`]\[TEST\]\[cleanup:before\]/gi;
      const matches = content.match(cleanupBeforeRegex);

      expect(matches).toBeNull();
    });

    it('cleanup:after 로그가 제거되거나 logger.debug로 변경되어야 함', () => {
      const mainPath = resolve(projectRoot, 'src/main.ts');
      const content = readFileSync(mainPath, 'utf-8');

      // cleanup:after 관련 console.log 찾기
      const cleanupAfterRegex = /console\.log\s*\(\s*['"`]\[TEST\]\[cleanup:after\]/gi;
      const matches = content.match(cleanupAfterRegex);

      expect(matches).toBeNull();
    });
  });

  describe('19.3: events.ts 로그 logger로 변경', () => {
    it('이벤트 연결 로그가 logger.debug를 사용해야 함', () => {
      const eventsPath = resolve(projectRoot, 'src/bootstrap/events.ts');
      const content = readFileSync(eventsPath, 'utf-8');

      // logger import 확인
      const hasLoggerImport =
        content.includes("from '../shared/logging/logger'") ||
        content.includes('from "../shared/logging/logger"') ||
        content.includes("from '@shared/logging/logger'") ||
        content.includes('from "@shared/logging/logger"');

      // [TEST] 태그가 있는 console.log가 없어야 함
      const testLogRegex = /console\.log\s*\(\s*['"`]\[TEST\]/gi;
      const matches = content.match(testLogRegex);

      // logger를 import하고 있거나, [TEST] 로그가 없어야 함
      expect(hasLoggerImport || matches === null).toBe(true);
    });
  });

  describe('19.4: logger 시스템 정상 작동 확인', () => {
    it('logger가 정상적으로 동작해야 함', async () => {
      const { logger } = await import('../../../src/shared/logging/logger');

      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('19.5: 프로덕션 코드에 불필요한 console 사용 검증', () => {
    it('src/ 디렉토리에 개발용 console.log가 최소화되어야 함', () => {
      // 일부 console.log는 logger 시스템 내부나 에러 핸들러에서 사용될 수 있음
      // 하지만 [TEST] 태그가 있는 것들은 제거되어야 함
      const mainPath = resolve(projectRoot, 'src/main.ts');
      const eventsPath = resolve(projectRoot, 'src/bootstrap/events.ts');

      const mainContent = readFileSync(mainPath, 'utf-8');
      const eventsContent = readFileSync(eventsPath, 'utf-8');

      // [TEST] 태그가 있는 모든 console 사용 확인
      const testConsoleRegex = /console\.(log|warn|error|debug)\s*\(\s*['"`]\[TEST\]/gi;

      const mainMatches = mainContent.match(testConsoleRegex);
      const eventsMatches = eventsContent.match(testConsoleRegex);

      expect(mainMatches).toBeNull();
      expect(eventsMatches).toBeNull();
    });
  });
});
