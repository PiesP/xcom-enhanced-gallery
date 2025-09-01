/**
 * @fileoverview Vendor Mock 완전성 검증 유틸리티
 * @description 테스트 실행 시 mock 함수들이 모두 정의되어 있는지 검증
 * @version 1.0.0
 */

import { vi } from 'vitest';
import { testLogger } from '../logging/test-logger.js';

/**
 * 필수 Preact API 함수들
 */
const REQUIRED_PREACT_API = [
  'h',
  'Fragment',
  'render',
  'createRef',
  'isValidElement',
  'options',
  'createElement',
  'memo',
];

/**
 * 필수 Preact Hooks API 함수들
 */
const REQUIRED_PREACT_HOOKS_API = [
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useRef',
  'useContext',
  'useReducer',
  'useLayoutEffect',
  'useErrorBoundary',
  'useDebugValue',
];

/**
 * 필수 Preact Signals API 함수들
 */
const REQUIRED_PREACT_SIGNALS_API = ['signal', 'computed', 'effect', 'batch', 'untracked'];

/**
 * 필수 Fflate API 함수들
 */
const REQUIRED_FFLATE_API = [
  'zip',
  'unzip',
  'strToU8',
  'strFromU8',
  'gzip',
  'gunzip',
  'deflate',
  'inflate',
];

/**
 * Mock 객체의 완전성을 검증하는 함수
 */
export function validateMockCompleteness(mockObject, requiredAPIs) {
  const missingAPIs = [];
  const invalidAPIs = [];

  requiredAPIs.forEach(apiKey => {
    if (!(apiKey in mockObject)) {
      missingAPIs.push(apiKey);
    } else if (typeof mockObject[apiKey] !== 'function' && typeof mockObject[apiKey] !== 'object') {
      invalidAPIs.push(apiKey);
    }
  });

  const isValid = missingAPIs.length === 0 && invalidAPIs.length === 0;

  return {
    isValid: isValid,
    missingAPIs: missingAPIs,
    invalidAPIs: invalidAPIs,
  };
}

/**
 * 모든 Vendor Mock의 완전성을 검증
 */
export function validateAllVendorMocks(mockManager) {
  const validationResults = [];

  try {
    // Preact API 검증
    const preactAPI = mockManager.getPreactSafe();
    const preactResult = validateMockCompleteness(preactAPI, REQUIRED_PREACT_API);
    if (preactResult.isValid) {
      validationResults.push('✅ Preact API 검증 완료');
    } else {
      validationResults.push(
        `❌ Preact API 검증 실패: 누락된 API - ${preactResult.missingAPIs.join(', ')}`
      );
    }
  } catch (error) {
    validationResults.push(`❌ Preact API 검증 실패: ${error.message}`);
  }

  try {
    // Preact Hooks API 검증
    const hooksAPI = mockManager.getPreactHooksSafe();
    const hooksResult = validateMockCompleteness(hooksAPI, REQUIRED_PREACT_HOOKS_API);
    if (hooksResult.isValid) {
      validationResults.push('✅ Preact Hooks API 검증 완료');
    } else {
      validationResults.push(
        `❌ Preact Hooks API 검증 실패: 누락된 API - ${hooksResult.missingAPIs.join(', ')}`
      );
    }
  } catch (error) {
    validationResults.push(`❌ Preact Hooks API 검증 실패: ${error.message}`);
  }

  try {
    // Preact Signals API 검증
    const signalsAPI = mockManager.getPreactSignalsSafe();
    const signalsResult = validateMockCompleteness(signalsAPI, REQUIRED_PREACT_SIGNALS_API);
    if (signalsResult.isValid) {
      validationResults.push('✅ Preact Signals API 검증 완료');
    } else {
      validationResults.push(
        `❌ Preact Signals API 검증 실패: 누락된 API - ${signalsResult.missingAPIs.join(', ')}`
      );
    }
  } catch (error) {
    validationResults.push(`❌ Preact Signals API 검증 실패: ${error.message}`);
  }

  try {
    // Fflate API 검증
    const fflateAPI = mockManager.getFflateSafe();
    const fflateResult = validateMockCompleteness(fflateAPI, REQUIRED_FFLATE_API);
    if (fflateResult.isValid) {
      validationResults.push('✅ Fflate API 검증 완료');
    } else {
      validationResults.push(
        `❌ Fflate API 검증 실패: 누락된 API - ${fflateResult.missingAPIs.join(', ')}`
      );
    }
  } catch (error) {
    validationResults.push(`❌ Fflate API 검증 실패: ${error.message}`);
  }

  return validationResults;
}

/**
 * Mock 함수들이 올바르게 vi.fn()으로 생성되었는지 검증
 */
export function validateMockFunctions(mockObject, apiName) {
  const invalidMocks = [];

  Object.entries(mockObject).forEach(([key, value]) => {
    if (typeof value === 'function' && !vi.isMockFunction(value)) {
      invalidMocks.push(key);
    }
  });

  if (invalidMocks.length > 0) {
    testLogger.warn(
      `⚠️ ${apiName}에서 다음 함수들이 vi.fn()으로 생성되지 않았습니다: ${invalidMocks.join(', ')}`
    );
  }

  return invalidMocks.length === 0;
}

/**
 * 테스트 실행 전 mock 상태 진단
 */
export function diagnoseMockState(mockManager) {
  testLogger.log('🔍 Vendor Mock 상태 진단 시작...');

  const diagnostics = {
    timestamp: new Date().toISOString(),
    completeness: [],
    mockFunctions: [],
    summary: {
      totalAPIs: 0,
      validAPIs: 0,
      errors: [],
    },
  };

  // 완전성 검증
  try {
    diagnostics.completeness = validateAllVendorMocks(mockManager);
    diagnostics.summary.validAPIs = diagnostics.completeness.filter(result =>
      result.includes('✅')
    ).length;
    diagnostics.summary.totalAPIs = diagnostics.completeness.length;
  } catch (error) {
    diagnostics.summary.errors.push(`Mock 완전성 검증 실패: ${error.message}`);
  }

  // Mock 함수 검증
  const apis = [
    { name: 'Preact', method: 'getPreactSafe' },
    { name: 'PreactHooks', method: 'getPreactHooksSafe' },
    { name: 'PreactSignals', method: 'getPreactSignalsSafe' },
    { name: 'Fflate', method: 'getFflateSafe' },
  ];

  apis.forEach(apiInfo => {
    try {
      if (typeof mockManager[apiInfo.method] === 'function') {
        const mockObject = mockManager[apiInfo.method]();
        const isValid = validateMockFunctions(mockObject, apiInfo.name);
        diagnostics.mockFunctions.push(`${isValid ? '✅' : '⚠️'} ${apiInfo.name} Mock 함수 검증`);
      } else {
        diagnostics.mockFunctions.push(
          `❌ ${apiInfo.name} Mock 함수 검증 실패: mockManager.${apiInfo.method} is not a function`
        );
      }
    } catch (error) {
      diagnostics.mockFunctions.push(`❌ ${apiInfo.name} Mock 함수 검증 실패: ${error.message}`);
    }
  });

  // 결과 출력
  testLogger.log('📊 Mock 완전성 검증 결과:');
  diagnostics.completeness.forEach(result => testLogger.log(`  ${result}`));

  testLogger.log('🔧 Mock 함수 검증 결과:');
  diagnostics.mockFunctions.forEach(result => testLogger.log(`  ${result}`));

  testLogger.log(
    `📈 요약: ${diagnostics.summary.validAPIs}/${diagnostics.summary.totalAPIs} APIs 검증 완료`
  );

  if (diagnostics.summary.errors.length > 0) {
    testLogger.error('❌ 오류 목록:');
    diagnostics.summary.errors.forEach(error => testLogger.error(`  ${error}`));
  }

  return diagnostics;
}

/**
 * Mock 진단 결과를 로깅하는 함수
 */
export function logMockDiagnosticsResults(diagnostics) {
  testLogger.log('📊 Mock 완전성 검증 결과:');
  diagnostics.completeness.forEach(result => testLogger.log(`  ${result}`));

  testLogger.log('🔧 Mock 함수 검증 결과:');
  diagnostics.mockFunctions.forEach(result => testLogger.log(`  ${result}`));

  testLogger.log(
    `📈 요약: ${diagnostics.summary.validAPIs}/${diagnostics.summary.totalAPIs} APIs 검증 완료`
  );

  if (diagnostics.summary.errors.length > 0) {
    testLogger.error('❌ 오류 목록:');
    diagnostics.summary.errors.forEach(error => testLogger.error(`  ${error}`));
  }
}

/**
 * 테스트 전용 Mock 검증 어서션
 */
export function expectValidMocks(mockManager) {
  const results = validateAllVendorMocks(mockManager);
  const failures = results.filter(result => result.includes('❌'));

  if (failures.length > 0) {
    throw new Error(`Mock 검증 실패:\n${failures.join('\n')}`);
  }

  return true;
}
