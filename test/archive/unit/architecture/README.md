# test/archive/unit/architecture - 아키텍처 테스트 아카이브

> 📦 **상태**: 아카이브됨 | CI/로컬 테스트에서 제외 | 참고용 보관

## 개요

이 디렉토리는 과거 프로젝트 아키텍처 구조에 맞춰 작성된 테스트들을 보관합니다.

## 보관 파일

### domcache-initialization.test.ts

- **상태**: 🗃️ 아카이브됨 (Phase 177)
- **이유**: 구체적 구현(DOMCache 클래스)에 의존하는 아키텍처 테스트
- **문제점**:
  - 아키텍처 검증이라기보다는 구현 검증에 가까움
  - 현재 프로젝트 정책(3계층 구조: Features → Shared → External)과 무관
  - 부트스트랩 레이어의 내부 구현에 의존

### dependency-rules.test.ts

- **상태**: 🗃️ 아카이브됨 (Phase 177)
- **이유**: 구식 4-5계층 아키텍처 기준 (core, infrastructure 미사용)
- **문제점**:
  - 현재 프로젝트는 3계층 구조(Features → Shared → External) 사용
  - 의존성 검증은 `dependency-cruiser`로 대체됨 (`npm run deps:all`)
  - 배럴 export 검증은 유효하나, 계층 검증은 구식

### vendor-dependency-rules.design.test.ts

- **상태**: 🗃️ 설계 문서 (Phase 177)
- **이유**: 미래 vendor getter 강제 정책 설계
- **용도**:
  - 현재 프로젝트 vendor import 패턴 분석 기준
  - 향후 리팩토링 시 참고 자료
  - 기존 `vendor-getter.strict.scan.red.test.ts`와 통합 가능

## 대체 방안

### 아키텍처 검증

✅ **현재 권장 방식**:

1. **Dependency-Cruiser** (의존성 경계)
   - `npm run deps:all`: 순환 의존, 계층 위반 자동 검출
   - CI: `.github/workflows/ci.yml`에 포함

2. **Lint 정책 테스트** (코딩 규칙)
   - `test/unit/lint/vendor-getter.strict.scan.red.test.ts`
   - PC-only 이벤트, CSS 토큰 사용 강제

3. **Guards 테스트** (프로젝트 건강도)
   - `test/guards/project-health.test.ts`
   - 빌드 크기, 의존성 위반 회귀 방지

### 부트스트랩/초기화 검증

✅ **E2E + 통합 테스트**:

- `test/integration/` 또는 `test/browser/`에서 실제 마운팅 검증
- 부트스트랩 시점의 신호/상태 초기화 검증

## 복원 방법

아카이브 파일을 다시 활용하려면:

```bash
# 1. 파일을 원래 위치로 복사
cp test/archive/unit/architecture/dependency-rules.test.ts \
   test/unit/architecture/dependency-rules.test.ts

# 2. vitest.config.ts에서 exclude 제거 (필요시)

# 3. 파일 내용 검토 후 현대적 패턴으로 리팩토링
```

## 참고

- **TESTING_STRATEGY.md**: 아카이브 정책, 테스트 분류
- **TDD_REFACTORING_PLAN.md**: Phase 177 아키텍처 정리
- **ARCHITECTURE.md**: 현재 3계층 구조 (Features → Shared → External)

---

**마지막 업데이트**: 2025-10-25 (Phase 177)
