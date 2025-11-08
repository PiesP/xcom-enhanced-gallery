/**
 * @fileoverview Vitest Global Teardown
 * @description 모든 Vitest 실행 종료 시 자동으로 워커 프로세스 정리
 * Phase 241: Vitest 워커 자동 정리 자동화
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Vitest 종료 시 워커 프로세스 정리
 */
export default async function teardown(): Promise<void> {
  const scriptPath = join(__dirname, '..', 'scripts', 'cleanup-vitest-workers.js');

  try {
    console.log('[Global Teardown] Cleaning up Vitest workers...');
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      timeout: 10000, // 10초 타임아웃
    });

    if (stdout) {
      console.log(stdout);
    }
    if (stderr && !stderr.includes('No Vitest worker processes found')) {
      console.error('[Global Teardown] Cleanup warnings:', stderr);
    }
  } catch (error) {
    // 워커 정리 실패는 경고만 출력 (테스트 실패로 이어지지 않도록)
    console.warn(
      '[Global Teardown] Failed to cleanup workers:',
      error instanceof Error ? error.message : error
    );
  }
}
