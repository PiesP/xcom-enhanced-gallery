# test/unit 구조 가이드 (Phase 178)

## 📊 개요

활성 유닛 테스트: **247개 파일** (Phase 181: events 정책 통합, lint +1)

### 최근 변경 (Phase 181, 2025-10-25)

- ✅ `test/unit/events/` 디렉토리 정리 및 통합
  - `wheel-listener.policy.red.test.ts` →
    `test/unit/lint/wheel-listener-direct-use.policy.red.test.ts` (wheel 이벤트
    정책)
  - `event-lifecycle.abort-signal.integration.test.ts` →
    `test/archive/unit/events/` (중복: events-coverage.test.ts에 이미 포함)
  - 이유: 이벤트 정책을 lint로 중앙화, AbortSignal 테스트 중복 제거
  - 결과: test/unit/lint는 28개로 증가, test/unit/events는 삭제

### 이전 변경 (Phase 180, 2025-10-25)

- ✅ `test/unit/deps/` 디렉토리 통합 및 삭제
  - `icon-libraries-no-static-imports.red.test.ts` → `test/unit/lint/`
    (vendor/import 정책)
  - `mediabunny.not-imported.scan.red.test.ts` → `test/archive/unit/lint/` (폐기
    대상)
  - 이유: "deps" 범주 불명확, 파일들은 실제 lint/정책 테스트
  - 결과: test/unit/lint는 27개로 증가, test/unit/deps는 삭제

---

## 🗂️ 디렉터리 구조

### 공유 계층 (test/unit/shared/)

| 디렉터리             | 파일 | 역할                                                          |
| -------------------- | ---- | ------------------------------------------------------------- |
| **services/**        | 27   | **핵심 서비스 로직** (MediaService, BulkDownloadService, etc) |
| ├─ impl/             | 6    | 기본 구현 테스트 (base class)                                 |
| ├─ media/            | 4    | 미디어 서비스                                                 |
| ├─ media-extraction/ | 6    | 미디어 추출 서비스                                            |
| ├─ storage/          | 1    | 저장소 어댑터                                                 |
| ├─ input/            | 1    | 입력 처리                                                     |
| **utils/**           | 21   | **공유 유틸리티** (DOM, error, helpers)                       |
| ├─ accessibility/    | 3    | 접근성 (Live Region, 포커스 복원)                             |
| ├─ animation/        | 1    | 애니메이션                                                    |
| **state/**           | -    | 신호/상태 모듈 (state/ 루트에 위치)                           |
| **external/**        | 4    | 외부 어댑터 (vendors, userscript, zip)                        |

### 기능 계층 (test/unit/features/)

| 디렉터리          | 파일 | 역할                 |
| ----------------- | ---- | -------------------- |
| features/         | 13   | **UI 컴포넌트 기능** |
| ├─ gallery/       | 5    | 갤러리 컴포넌트      |
| ├─ gallery/hooks/ | 6    | 갤러리 커스텀 훅     |

### UI 컴포넌트 계층

| 디렉터리        | 파일 | 역할                                             |
| --------------- | ---- | ------------------------------------------------ |
| **components/** | 7    | **UI 컴포넌트 기능** (Button, Settings, Toolbar) |

### 정책/검증 계층

| 디렉터리      | 파일 | 역할                                                       |
| ------------- | ---- | ---------------------------------------------------------- |
| **lint/**     | 28   | **코딩 정책 검증** (vendor getter, PC/wheel events, icons) |
| **policies/** | 3    | **Solid.js/성능 정책 검증** (반응성, memoization)          |
| **styles/**   | 12   | **디자인 토큰/스타일 검증**                                |
| **guards/**   | 1    | **프로젝트 상태 가드** (현황 검증)                         |
| patterns/     | 4    | 코드 패턴 검증                                             |

### 기타 계층

| 디렉터리               | 파일 | 역할                                          |
| ---------------------- | ---- | --------------------------------------------- |
| **state/**             | 11   | Solid 신호/상태 (gallery, focus, scroll, etc) |
| **media/**             | 10   | 미디어 처리 (추출, 다운로드)                  |
| **core/**              | 4    | 핵심 기능 (selectors, service manager)        |
| performance/           | 6    | 성능/벤치마크 테스트                          |
| refactoring/           | 5    | 진행 중 리팩토링                              |
| types/                 | 2    | 타입 검증                                     |
| components/            | 2    | UI 컴포넌트                                   |
| hooks/                 | 5    | 기타 훅 테스트                                |
| ui/                    | 4    | UI 구성                                       |
| vendors/               | 2    | 벤더 검증                                     |
| **accessibility/**     | 3    | **접근성 유틸** (Live Region, 포커스 복원)    |
| alias/                 | 2    | 경로 별칭                                     |
| bootstrap/             | 2    | 부트스트랩                                    |
| core/                  | 4    | 핵심                                          |
| i18n/                  | 1    | 국제화                                        |
| integration/           | 1    | 통합 테스트                                   |
| lifecycle/             | 2    | 생명주기                                      |
| loader/                | 2    | 로더                                          |
| main/                  | 3    | 메인 애플리케이션                             |
| policies/              | 3    | 정책                                          |
| setup/                 | 2    | 테스트 설정                                   |
| viewport-utils.test.ts | -    | 뷰포트 유틸리티                               |

---

## 🎯 작업 가이드

### 새 테스트 파일 배치

**1. 서비스 로직**

```
새 서비스 테스트 → test/unit/shared/services/
- 기본 구현 → test/unit/shared/services/impl/
- 도메인 테스트 → test/unit/shared/services/<domain>/
```

**2. 유틸리티 함수**

```
공유 유틸 → test/unit/shared/utils/
- 접근성 → test/unit/shared/utils/accessibility/
- 애니메이션 → test/unit/shared/utils/animation/
```

**3. UI 컴포넌트**

```
기능 컴포넌트 → test/unit/features/<feature>/
- 갤러리 → test/unit/features/gallery/
- 갤러리 훅 → test/unit/features/gallery/hooks/
```

**4. 정책 검증**

```
린트/정책 → test/unit/lint/
스타일/토큰 → test/unit/styles/
```

---

## 📝 파일 명명 규칙

```
✅ 올바른 예
- media-service.test.ts              # 서비스
- keyboard-navigator.test.ts         # 서비스 구현
- unified-download-service.test.ts   # 서비스
- media-url.policy.test.ts           # 정책
- vendor-getter.strict.test.ts       # 검증
- design-token-coverage.test.ts      # 커버리지

❌ 잘못된 예
- MediaService.test.ts           # PascalCase 금지
- media_service.test.ts          # snake_case 금지
- test-media-service.ts          # 확장명 위치 오류
```

---

## 🔍 파일 크기 기준

| 범위       | 평가             |
| ---------- | ---------------- |
| 50-80줄    | ⭐⭐⭐ 매우 좋음 |
| 80-150줄   | ⭐⭐ 좋음        |
| 150-210줄  | ⭐ 경계          |
| 210줄 이상 | ❌ 분할 권장     |

---

## 📊 통계

```
활성 테스트: 247개
- shared/services/: 27개
- lint/: 28개 (Phase 181 +1)
- shared/utils/: 21개
- features/: 13개
- 기타: 158개

Phase 파일 (아카이브): 28개 (Phase 181 +1)
중복 파일: 0개
```

---

## 🔗 관련 문서

- **[test/archive/unit/README.md](../archive/unit/README.md)**: 아카이브된 Phase
  테스트
- **[test/archive/unit/events/README.md](../archive/unit/events/README.md)**:
  아카이브된 이벤트 테스트
- **[test/archive/unit/shared/services/impl/README.md](./shared/services/impl/README.md)**:
  기본 구현 테스트
- **[test/README.md](../README.md)**: 전체 테스트 가이드
- **[docs/TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md)**: 테스트 전략
- **[docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)**: 아키텍처

---

**마지막 업데이트**: 2025-10-25 (Phase 181 - test/unit/events 정책 통합)
