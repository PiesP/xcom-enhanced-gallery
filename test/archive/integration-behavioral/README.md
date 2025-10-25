# Integration Behavioral Tests Archive

> 완료된 개발 단계의 행위 검증 테스트 모음 (참고용)

**보관 날짜**: 2025-10-25 **보관 이유**: Phase 과거 단계의 기능 검증 테스트
(현재 Phase 170B+ 상태에 비효율) **현재 상태**: 아카이브, CI/로컬 테스트 제외

## 📂 포함 파일

### 1. `user-interactions-fixed.test.ts` (152줄)

**목적**: 사용자와 스크립트 간 상호작용 행위 검증

**테스트 내용**

- 트윗 이미지 클릭 시 갤러리 열기
- D 키 단축키로 미디어 다운로드
- 자동 다운로드 설정 적용
- 네트워크 오류 시 알림 표시

**기술 스택**

- Mock API 연결 (`userscript-api.mock`, `twitter-dom.mock`)
- Vitest + async/await 패턴
- setTimeout 기반 시뮬레이션

**문제점**

- 문자열 기반 테스트 (실제 DOM 동작 검증 불가)
- Mock 의존 높음 → 실제 Solid.js 반응성 미검증
- 거짓 양성(false positive) 위험

### 2. `toolbar-visibility-fix.test.ts` (130줄)

**목적**: 도구모음 가시성 수정 사항 검증

**테스트 내용**

- CSS `!important` 규칙 존재 확인
- JavaScript `setProperty` 패턴 검증
- z-index 높이 값 확인
- CSS 변수 기반 상태 관리

**기술 스택**

- 문자열 기반 assertion (실제 CSS 적용 미검증)
- Vitest describe/test 패턴

**문제점**

- 실제 CSS 파일 변경 미검증 (하드코딩된 문자열만)
- 스타일 실제 적용 여부 확인 불가
- JSDOM 환경의 CSS 계산 미지원

## 🗂️ 아카이브 정책

### 왜 아카이브하나?

1. **완료된 개발 단계**: 두 파일 모두 과거 개발 이슈 해결(트윗 상호작용,
   도구모음 가시성)에 해당
2. **검증 방식 부적절**: Mock + 문자열 기반 테스트로 실제 동작 검증 불가
3. **Phase 170B+ 현황**: 현재 프로젝트는 안정 단계로 이러한 기능 검증 미필요
4. **유지보수 부담**: CI에서 제외되어 있어 개발 흐름에 방해

### 참고 용도

- **과거 이슈 추적**: 도구모음 가시성 문제, 사용자 상호작용 시뮬레이션 방식 참고
- **테스트 패턴 개선**: 앞으로의 행위 테스트는 이전 테스트보다 나은 패턴 적용
- **리팩토링 영감**: 도구모음 가시성 구현 방식 재검토 시 참고

## 🔄 복원 방법

### 아카이브된 테스트를 다시 사용하려면

```bash
# 1. 파일 위치 확인
ls test/archive/integration-behavioral/

# 2. 메인 폴더로 이동 (필요 시)
Move-Item -Path test/archive/integration-behavioral/filename.test.ts `
          -Destination test/integration/behavioral/filename.test.ts

# 3. 해당 프로젝트에 테스트 추가
# vitest.config.ts의 projects에 필요시 추가

# 4. 테스트 실행
npm run test -- test/integration/behavioral/filename.test.ts
```

### 개선 방향 (복원 시)

이 테스트를 다시 활용하려면 아래 개선이 필요합니다:

1. **실제 DOM 검증으로 전환**:
   - Vitest + JSDOM → Browser 모드로 변경
   - Mock 의존도 감소, 실제 Solid.js 반응성 검증

2. **E2E 테스트로 승격 고려**:
   - Playwright 하네스 패턴 적용
   - 실제 갤러리/도구모음 기능 검증

3. **가드 테스트로 재구성**:
   - 현재 상태(Phase 170B+) 검증에 맞춰 가드 테스트 추가
   - `test/guards/` 활용

## 📋 현재 테스트 체계 (Phase 170B+)

### 추천 테스트 레이어

| 레이어        | 도구               | 목적                           |
| ------------- | ------------------ | ------------------------------ |
| **Static**    | TypeScript, ESLint | 타입/규칙 검증                 |
| **Unit**      | Vitest + JSDOM     | 순수 함수, 서비스 로직         |
| **Browser**   | Vitest + Chromium  | Solid.js 반응성, 실제 DOM 동작 |
| **E2E Smoke** | Playwright         | 핵심 사용자 시나리오           |
| **Guards**    | test/guards/       | 프로젝트 건강 상태 모니터링    |

이 파일들의 기능 검증은 **Browser** 또는 **E2E** 레이어로 전환을 권장합니다.

## 📌 참고 문서

- `docs/TESTING_STRATEGY.md`: 테스트 레이어 상세 가이드
- `docs/TDD_REFACTORING_PLAN.md`: Phase 진행 상황
- `test/README.md`: 테스트 디렉토리 구조
- `.github/copilot-instructions.md`: 개발 지침

---

**파일 보관 상태**: 활성 개발에서 제외, 참고용으로만 보관 중입니다.
