# xcom-enhanced-gallery 문서 안내서

> 프로젝트 문서의 마스터 색인 (Master Index)

이 폴더는 프로젝트의 단일 소스 오브 트루스(SSOT)로, 각 문서는 하나의 책임만
갖도록 구성했습니다. 상세 규칙은 중복 없이 한 곳에서만 정의하고, 나머지는 링크로
연결합니다.

---

## 📚 핵심 문서 (Core Documents)

### 1. 아키텍처 설계서 (ARCHITECTURE.md)

**목적**: 프로젝트 구조, 레이어 책임, 경계, 핵심 유스케이스 정의

**주요 내용**:

- 3-Layer 구조 (Features → Shared → External)
- vDOM/Light DOM 전략
- Bootstrap 흐름
- 외부 통합 계약 (Vendors/Userscript/ZIP)
- **NEW**: Extension Points (새 피처/서비스 추가 패턴)
- **NEW**: Migration Patterns (레거시 → 신규 전환)
- **NEW**: Advanced Patterns (Lazy Loading, Memoization, Error Boundaries)
- **NEW**: Performance Monitoring (번들 크기, 메모리 누수 감지)

**대상 독자**: 아키텍트, 신규 개발자

**관련 문서**: [코딩 가이드라인](#2-코딩-가이드라인-coding_guidelinesmd),
[벤더 API 가이드](#4-벤더-안전-api-가이드-vendors-safe-apimd)

### 2. 코딩 가이드라인 (CODING_GUIDELINES.md)

**목적**: 집행 가능한 규칙 (포맷팅, 네이밍, 레이어 경계, PC 전용 입력 등)

**주요 내용**:

- **NEW**: Quick Reference (자주 사용하는 패턴 모음)
- **NEW**: Decision Trees (언제 어떤 패턴 사용?)
- **NEW**: Common Pitfalls (흔한 함정과 해결책)
- 레이어 & 의존성 규칙
- 외부 의존성 (Vendor Getters, Userscript Adapter)
- 보안 (URL 검증, Prototype Pollution 방지)
- 스타일 (디자인 토큰, 접근성)
- UI 컴포넌트 (아이콘 고유성, ContextMenu ARIA, Tooltip)
- 스크롤 & 이벤트 (Body Scroll, Reactive Accessor, Singleton Listener)

**대상 독자**: 모든 개발자

**관련 문서**: [아키텍처](#1-아키텍처-설계서-architecturemd),
[테스트 가이드](#5-테스트-가이드-testing_guidemd--new),
[성능 가이드](#6-성능-가이드-performance_guidemd--new),
[보안 가이드](#7-보안-가이드-security_guidemd--new)

### 3. 실행/CI 가이드 (AGENTS.md)

**위치**: `../AGENTS.md` (프로젝트 루트)

**목적**: 로컬 개발 환경, 핵심 스크립트, CI/CD 파이프라인, Git Hooks

**주요 내용**:

- 개발 환경 설정
- 핵심 스크립트 (typecheck, lint, test, build)
- CI/CD (ci.yml, security.yml, release.yml)
- 도구 (의존성 그래프, @connect 동기화, 아이콘 사용 분석, CodeQL)
- Git Hooks (Husky)

**대상 독자**: 모든 개발자, DevOps

**관련 문서**: [CodeQL 로컬 가이드](#8-codeql-로컬-가이드-codeql_local_guidemd)

### 4. 벤더 안전 API 가이드 (vendors-safe-api.md)

**목적**: 외부 라이브러리/Userscript API 접근 규약 (getter/adapter 패턴)

**주요 내용**:

- 핵심 원칙 (직접 import 금지, getter 사용 필수)
- SolidJS Core/Store 사용 (네이티브 패턴)
- Userscript 다운로드
- 네트워크/도메인 정책 (@connect 정합성)
- Feature detection
- 테스트 모킹 패턴

**대상 독자**: 모든 개발자

**관련 문서**: [아키텍처](#1-아키텍처-설계서-architecturemd),
[테스트 가이드](#5-테스트-가이드-testing_guidemd--new)

---

## 🧪 전문 가이드 (Specialized Guides)

### 5. 테스트 가이드 (TESTING_GUIDE.md) ✨ NEW

**목적**: TDD 워크플로, 모킹 패턴, 테스트 전략 심화

**주요 내용**:

- RED → GREEN → REFACTOR 워크플로
- 테스트 종류 (계약, 단위, 통합, 접근성)
- 모킹 패턴 (Vendor Getters, Userscript API, DOM)
- 테스트 구조 가이드 (파일 배치, 네이밍 규칙)
- 커버리지 전략
- 테스트 실패 디버깅

**대상 독자**: 모든 개발자, QA

**관련 문서**: [아키텍처](#1-아키텍처-설계서-architecturemd),
[코딩 가이드라인](#2-코딩-가이드라인-coding_guidelinesmd)

### 6. 성능 가이드 (PERFORMANCE_GUIDE.md) ✨ NEW

**목적**: 번들 최적화, 메모리 관리, 프로파일링 전략

**주요 내용**:

- 성능 목표 (번들 크기, 로딩 시간, 메모리 누수)
- 번들 최적화 (Tree-Shaking, Code Deduplication, Pure Annotations, Dynamic
  Imports)
- 메모리 관리 (Cleanup 패턴, 메모리 누수 감지, ObjectURL 관리)
- 런타임 최적화 (Memoization, Debounce & Throttle, Idle Scheduling, Progressive
  Loading)
- 프로파일링 (번들 분석, Runtime Performance, 메모리 프로파일링)
- 성능 베스트 프랙티스

**대상 독자**: 개발자, 성능 엔지니어

**관련 문서**: [아키텍처](#1-아키텍처-설계서-architecturemd),
[코딩 가이드라인](#2-코딩-가이드라인-coding_guidelinesmd)

### 7. 보안 가이드 (SECURITY_GUIDE.md) ✨ NEW

**목적**: URL 검증, Prototype Pollution 방지, CodeQL 통합

**주요 내용**:

- 보안 원칙 (Zero Trust, Defense in Depth)
- URL 검증 (XSS/Injection 방지)
  - 위협 시나리오 (Path Injection, Subdomain Spoofing, Hostname Spoofing)
  - 보안 함수 (`isTrustedTwitterMediaHostname`, `isTrustedHostname`)
- Prototype Pollution 방지
  - 위협 시나리오 (악의적 JSON)
  - 보안 함수 (`sanitizeSettingsTree`)
- CodeQL 통합 (로컬/CI)
- 보안 테스트 (URL Sanitization, Prototype Pollution)
- 보안 체크리스트

**대상 독자**: 모든 개발자, 보안 팀

**관련 문서**: [아키텍처](#1-아키텍처-설계서-architecturemd),
[코딩 가이드라인](#2-코딩-가이드라인-coding_guidelinesmd),
[테스트 가이드](#5-테스트-가이드-testing_guidemd--new),
[CodeQL 로컬 가이드](#8-codeql-로컬-가이드-codeql_local_guidemd)

### 8. CodeQL 로컬 가이드 (CODEQL_LOCAL_GUIDE.md)

**목적**: 로컬 환경에서 CodeQL 분석 실행 방법 (Fallback 쿼리 팩 사용)

**주요 내용**:

- 환경별 쿼리 팩 차이 (로컬 vs CI)
- Fallback 쿼리 팩 자동 전환
- 로깅 개선
- 트러블슈팅

**대상 독자**: 개발자, 보안 팀

**관련 문서**: [보안 가이드](#7-보안-가이드-security_guidemd--new),
[실행/CI 가이드](#3-실행ci-가이드-agentsmd)

---

## 📋 프로젝트 관리 문서

### 9. TDD 리팩토링 백로그 (TDD_REFACTORING_BACKLOG.md)

**목적**: 활성화되지 않은 향후 후보 저장소

**주요 내용**:

- 우선순위별 후보 목록 (HIGH/MEDIUM/LOW)
- 최근 승격 히스토리
- Parking Lot (보류 중)

**대상 독자**: 프로젝트 관리자, 개발자

### 10. TDD 리팩토링 플랜 (TDD_REFACTORING_PLAN.md)

**목적**: 현재 진행 중인 Epic/작업과 해당 Acceptance

**주요 내용**:

- 활성 스코프
- RED → GREEN → REFACTOR 진행 상황

**대상 독자**: 프로젝트 관리자, 개발자

### 11. TDD 리팩토링 완료 로그 (TDD_REFACTORING_PLAN_COMPLETED.md)

**목적**: 완료된 Epic/작업 아카이브

**주요 내용**:

- 완료된 Epic별 상세 로그
- 달성 성과
- 교훈

**대상 독자**: 프로젝트 관리자, 개발자

---

## 📊 산출물 및 보조 문서

### 의존성 그래프

- **파일**: `dependency-graph.(svg|json|dot|html)`
- **생성**: `npm run deps:all`
- **목적**: 코드베이스 의존성 시각화

### 변경 이력

- **파일**: `CHANGELOG.md`
- **목적**: 버전별 변경 사항 추적

---

## 🗺️ 문서 네비게이션 맵

```text
신규 개발자 온보딩 경로:
1. AGENTS.md (환경 설정)
   ↓
2. ARCHITECTURE.md (프로젝트 구조 이해)
   ↓
3. CODING_GUIDELINES.md (코딩 규칙 숙지)
   ↓
4. TESTING_GUIDE.md (TDD 워크플로)
   ↓
5. 구현 시작

기능 개발 경로:
1. TDD_REFACTORING_BACKLOG.md (작업 선택)
   ↓
2. TESTING_GUIDE.md (테스트 작성)
   ↓
3. CODING_GUIDELINES.md (구현 규칙)
   ↓
4. ARCHITECTURE.md (Extension Points 참조)
   ↓
5. PR 생성

버그 수정 경로:
1. TESTING_GUIDE.md (재현 테스트 작성)
   ↓
2. ARCHITECTURE.md (관련 컴포넌트 파악)
   ↓
3. CODING_GUIDELINES.md (수정 규칙)
   ↓
4. 수정 구현 + 회귀 테스트

성능 최적화 경로:
1. PERFORMANCE_GUIDE.md (측정 및 분석)
   ↓
2. ARCHITECTURE.md (병목 지점 파악)
   ↓
3. CODING_GUIDELINES.md (최적화 규칙)
   ↓
4. TESTING_GUIDE.md (회귀 방지 테스트)

보안 강화 경로:
1. SECURITY_GUIDE.md (위협 시나리오 파악)
   ↓
2. ARCHITECTURE.md (보안 정책 확인)
   ↓
3. CODING_GUIDELINES.md (보안 규칙)
   ↓
4. TESTING_GUIDE.md (보안 테스트 작성)
```

---

## 🔍 빠른 검색 (Quick Search)

### 개념 → 문서 매핑

| 개념                | 문서                                  | 섹션                           |
| ------------------- | ------------------------------------- | ------------------------------ |
| SolidJS Signal 생성 | CODING_GUIDELINES.md                  | Quick Reference                |
| 서비스 접근         | CODING_GUIDELINES.md                  | Quick Reference                |
| Userscript 다운로드 | vendors-safe-api.md                   | 예시: Userscript 다운로드      |
| 디자인 토큰         | CODING_GUIDELINES.md                  | 스타일                         |
| PC 전용 이벤트      | CODING_GUIDELINES.md                  | 입력 이벤트 (PC 전용)          |
| TDD 워크플로        | TESTING_GUIDE.md                      | RED → GREEN → REFACTOR         |
| 번들 최적화         | PERFORMANCE_GUIDE.md                  | 번들 최적화                    |
| 메모리 누수 방지    | PERFORMANCE_GUIDE.md                  | 메모리 관리                    |
| URL 검증            | SECURITY_GUIDE.md                     | URL 검증 (XSS/Injection 방지)  |
| Prototype Pollution | SECURITY_GUIDE.md                     | Prototype Pollution 방지       |
| Extension Points    | ARCHITECTURE.md                       | Extension Points               |
| Migration Patterns  | ARCHITECTURE.md                       | Migration Patterns             |
| Error Boundaries    | ARCHITECTURE.md                       | Advanced Patterns              |
| Lazy Loading        | ARCHITECTURE.md, PERFORMANCE_GUIDE.md | Advanced Patterns, 번들 최적화 |
| Memoization         | PERFORMANCE_GUIDE.md                  | 런타임 최적화                  |
| CodeQL 로컬 실행    | CODEQL_LOCAL_GUIDE.md                 | 로컬 분석                      |
| Git Hooks           | AGENTS.md                             | Git Hooks (Husky)              |
| CI/CD               | AGENTS.md                             | CI/CD                          |

---

## 📝 문서 작성 규칙

### 원칙

1. **단일 책임**: 각 문서는 하나의 주제만 다룹니다
2. **중복 금지**: 상세 규칙은 한 곳에서만 정의하고, 나머지는 링크로 연결
3. **예제 포함**: 모든 규칙에는 ✅ Good / ❌ Bad 예제 포함
4. **관련 문서 명시**: 각 문서 상단에 "관련 문서" 섹션 포함
5. **검증 가능**: 가능한 모든 규칙은 테스트로 가드

### 업데이트 시

- [ ] 관련 문서들도 함께 업데이트
- [ ] 링크 유효성 확인
- [ ] 예제 코드 실행 가능 여부 확인
- [ ] 변경 이력 (CHANGELOG.md) 업데이트

---

## 🆘 도움이 필요하신가요?

### 자주 묻는 질문

**Q: 어떤 문서부터 읽어야 하나요?**

A: [문서 네비게이션 맵](#️-문서-네비게이션-맵)을 참조하세요. 역할에 따라 다른
경로를 제공합니다.

**Q: 새로운 기능을 추가하려면?**

A:
[ARCHITECTURE.md의 Extension Points 섹션](#1-아키텍처-설계서-architecturemd)을
참조하세요.

**Q: 테스트를 어떻게 작성하나요?**

A:
[TESTING_GUIDE.md의 RED → GREEN → REFACTOR 섹션](#5-테스트-가이드-testing_guidemd--new)을
참조하세요.

**Q: 번들 크기가 너무 큽니다.**

A:
[PERFORMANCE_GUIDE.md의 번들 최적화 섹션](#6-성능-가이드-performance_guidemd--new)을
참조하세요.

**Q: 보안 취약점을 발견했습니다.**

A:
[SECURITY_GUIDE.md의 보안 이슈 보고 섹션](#7-보안-가이드-security_guidemd--new)을
참조하세요.

---

문서 변경 시에는 관련 테스트/스크립트 링크를 함께 갱신하여 링크 부패를 방지해
주세요.
