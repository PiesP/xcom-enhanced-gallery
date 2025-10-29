#!/usr/bin/env node
/**
 * Vitest Worker 프로세스 자동 정리 스크립트
 * 목적: 테스트 완료 후 남아있는 Vitest 워커 프로세스를 종료하여 메모리 확보
 * 사용: npm test 완료 후 자동 실행 또는 수동 실행
 *
 * 장점:
 * - 크로스 플랫폼 호환 (Windows, Linux, macOS)
 * - 에러 핸들링 개선
 * - npm 스크립트 통합 용이
 * - 프로젝트 일관성 유지 (모든 스크립트가 JS)
 */

import { execSync } from 'node:child_process';
import { freemem, totalmem } from 'node:os';

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * 색상이 적용된 메시지 출력
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 명령어를 실행하고 출력을 반환 (에러 무시)
 */
function execSafe(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    // pgrep이 프로세스를 찾지 못하면 exit code 1을 반환
    // 이는 정상적인 상황이므로 빈 문자열 반환
    return '';
  }
}

/**
 * Vitest 워커 프로세스 PID 목록 가져오기
 */
function getVitestWorkerPids() {
  // ps aux를 사용하여 정확한 프로세스만 찾기
  const output = execSafe('ps aux | grep "[v]itest/dist/workers/forks.js" | awk \'{print $2}\'');
  if (!output) return [];

  return output.split('\n').filter(Boolean);
}

/**
 * 프로세스가 존재하는지 확인
 */
function isProcessAlive(pid) {
  try {
    process.kill(parseInt(pid, 10), 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * 메모리 상태 포맷팅
 */
function formatMemory(bytes) {
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)}GB`;
}

/**
 * 현재 메모리 상태 출력
 */
function printMemoryStatus() {
  const total = totalmem();
  const free = freemem();
  const used = total - free;
  const usedPercent = ((used / total) * 100).toFixed(1);

  console.log(`  Total: ${formatMemory(total)}`);
  console.log(`  Used: ${formatMemory(used)} (${usedPercent}%)`);
  console.log(`  Free: ${formatMemory(free)}`);
}

/**
 * 프로세스 메모리 사용량 출력
 */
function printProcessMemory(pids) {
  if (pids.length === 0) return;

  console.log('\n📊 메모리 사용 현황:');
  // grep이 자신을 잡는 문제 방지: [v]itest 패턴 사용
  const output = execSafe('ps aux --sort=-%mem | grep "[v]itest/dist/workers/forks.js" | head -5');
  if (output) {
    const lines = output.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      console.log(lines.join('\n'));
    } else {
      console.log('  (상세 정보 없음)');
    }
  }
}

/**
 * 프로세스에 시그널 전송
 */
function killProcess(pid, signal = 'SIGTERM') {
  try {
    process.kill(parseInt(pid, 10), signal);
    return true;
  } catch {
    return false;
  }
}

/**
 * 지정된 시간(ms) 동안 대기
 */
function sleep(ms) {
  // eslint-disable-next-line no-undef
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🧹 Vitest Worker 프로세스 정리 시작...\n');

  // 1. Vitest 워커 프로세스 찾기
  let workerPids = getVitestWorkerPids();

  if (workerPids.length === 0) {
    log('✓ 정리할 Vitest 워커 프로세스가 없습니다.', 'green');
    return 0;
  }

  // 2. 프로세스 정보 출력
  log(`⚠️  발견된 Vitest 워커: ${workerPids.length}개`, 'yellow');
  printProcessMemory(workerPids);

  // 3. 프로세스 종료 (SIGTERM → SIGKILL)
  console.log('\n🔄 프로세스 종료 중...');

  // SIGTERM으로 정상 종료 시도
  for (const pid of workerPids) {
    if (isProcessAlive(pid)) {
      if (killProcess(pid, 'SIGTERM')) {
        console.log(`  - PID ${pid}: SIGTERM 전송`);
      }
    }
  }

  // 2초 대기
  await sleep(2000);

  // 여전히 남아있는 프로세스 확인
  const remainingPids = getVitestWorkerPids();

  if (remainingPids.length > 0) {
    log('⚠️  일부 프로세스가 남아있음. SIGKILL 전송...', 'yellow');
    for (const pid of remainingPids) {
      if (isProcessAlive(pid)) {
        if (killProcess(pid, 'SIGKILL')) {
          console.log(`  - PID ${pid}: SIGKILL 전송`);
        }
      }
    }
    await sleep(1000);
  }

  // 4. 결과 확인
  const finalCheck = getVitestWorkerPids();

  if (finalCheck.length === 0) {
    log('\n✓ 모든 Vitest 워커 프로세스가 정리되었습니다.', 'green');

    // 메모리 확보 확인
    console.log('\n📊 메모리 확보 후:');
    printMemoryStatus();

    console.log('\n✅ 정리 완료');
    return 0;
  } else {
    log('\n❌ 일부 프로세스가 여전히 실행 중입니다.', 'red');
    console.log(`남은 프로세스: ${finalCheck.join(', ')}`);
    return 1;
  }
}

// 스크립트 실행
main()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    log(`❌ 오류 발생: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
