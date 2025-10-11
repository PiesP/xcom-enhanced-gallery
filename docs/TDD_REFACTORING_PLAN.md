# TDD 리팩토링 활성 계획

현재 상태: Phase 19 계획 수립  
최종 업데이트: 2025-01-11

---

## 📊 현재 상태

Phase 18 (수동 스크롤 방해 제거) 완료 → COMPLETED.md로 이관 완료

프로젝트 상태:

- ✅ 빌드: 성공 (dev: 728.24 KB, prod: 329.03 KB, gzip: 89.47 KB)
- ✅ 테스트: 587/587 passing (24 skipped, 1 todo)
- ✅ 의존성: 0 violations (265 modules, 727 dependencies)

---

## 📚 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-18 완료 내역
- `docs/ARCHITECTURE.md`: 프로젝트 아키텍처
- `docs/CODING_GUIDELINES.md`: 코딩 규칙 및 품질 기준

---

## � Phase 19: 테스트 console.log 제거

**목표**: 프로덕션 코드에 남아있는 테스트용 console.log 제거

**배경**:

- 코드 점검 결과 `main.ts`, `event-wiring.ts` 등에 `[TEST]` 태그가 있는
  console.log가 발견됨
- 이들은 개발/디버깅 중 추가된 것으로 프로덕션에는 불필요
- logger 시스템을 통한 로깅으로 대체하거나 제거 필요

**문제 코드 위치**:

1. `src/main.ts` (line 183, 281)
   - `[TEST][cleanup:before]` 로그
   - `[TEST][cleanup:after]` 로그
2. `src/bootstrap/event-wiring.ts` (line 19, 28)
   - `[TEST] wired global events` 로그
   - `[TEST] unwired global events` 로그

**작업 계획**:

### 19.1: console.log 제거 ⏳

**목표**: 테스트용 console.log를 logger.debug로 변경 또는 제거

**작업**:

1. `main.ts`의 `[TEST]` console.log
   - `logger.debug`로 변경하거나 완전 제거
   - cleanup 로직이 정상 작동하는지 확인
2. `event-wiring.ts`의 `[TEST]` console.log
   - `logger.debug`로 변경
   - 이벤트 연결/해제 로그는 디버깅에 유용하므로 유지

**예상 변경**:

```typescript
// Before (제거 대상)
console.log('[TEST][cleanup:before]', { ... });

// After (Option 1: logger 사용)
logger.debug('Cleanup before', { ... });

// After (Option 2: 제거)
// (로그 없음)
```

### 19.2: 테스트 추가 ⏳

**목표**: console.log 제거 확인

**테스트 파일**: `test/unit/lint/test-console-logs.red.test.ts`

**테스트 케이스**:

1. 소스 코드에 `[TEST]` 태그가 있는 console.log 없음
2. main.ts와 event-wiring.ts에 테스트용 로그 없음
3. logger 시스템이 정상 작동

### 19.3: 빌드 검증 ⏳

**목표**: 변경 사항 검증

**작업**:

1. `npm run typecheck` - 타입 체크
2. `npm run lint:fix` - 린트 검사
3. `npm test` - 전체 테스트
4. `Clear-Host && npm run build` - 빌드 검증

**예상 결과**:

- 번들 크기 미세 감소 (console.log 제거로 인한)
- 모든 테스트 통과
- 로깅 기능 정상 작동

---

## 🎯 우선순위

1. ✅ Phase 18: 수동 스크롤 방해 제거 (완료)
2. ⏳ Phase 19: 테스트 console.log 제거 (진행 예정)
