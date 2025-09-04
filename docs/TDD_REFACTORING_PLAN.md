# TDD 기반 리팩토링 계획 (X.com Enhanced Gallery)

## 1. 목적 & 범위

코드를 **간결 / 현대적 / 일관 / 재실행 안전** 상태로 진화시키되, 기능 회귀 없이
TDD 사이클(RED→GREEN→REFACTOR)로 점진 적용. 범위는 `src/` 전역 구조, vendor
래핑, 스타일 네임스페이스, 서비스 초기화, 테스트 커버리지·안전망, 불필요/중복
코드 제거.

## 2. 현재 완료 항목 (요약)

이미 안정화된 부분은 상세 서술을 제거하고 유지 방침만 명시.

- Vendor Safe Getter (`vendor-api-safe.ts`): 정적 import + TDZ 해결 → 유지, 추가
  복잡화 금지
- Namespaced Styles (`initializeNamespacedStyles`): 중복/불완전 스타일 교체 로직
  포함 → 추가는 유틸/토큰 통합 중심
- Logger: 스코프/성능 타이머/오류 구조화 지원 → 포맷 일관성만 소폭 정리 예정
- Dependency Graph & Dead Token Report 스크립트 존재 → CI 가드 연계 예정
- 서비스 초기화(`registerCoreServices`) 통합 1차 완료 → 잔여 중복 키 제거 예정

## 3. 주요 리팩토링 기회 & 선택 전략

| 영역                          | 문제 요약             | 선택안 (옵션)                                                    | 결정       | 근거 요약                                                                       |
| ----------------------------- | --------------------- | ---------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| A. Vendor 레거시 API 제거     | deprecated 다수       | 1) 즉시 삭제 2) 단계적 soft-fail 3) Codemod 변환 후 제거         | 2 → 1 순차 | 하위 테스트/외부 스니펫 잠재 사용 가능성 → 경고 후 2주(릴리스 2회) 뒤 제거      |
| B. 서비스 등록 중복 키        | 동일 인스턴스 다중 키 | 1) 전면 삭제 2) Alias registry 3) Deprecation map                | 3          | 런타임 경고 + 추후 제거 안전                                                    |
| C. 스타일 시스템 확장         | base + util 분리 미약 | 1) 유지 2) CSS Layer 적용 3) Token build-time flatten            | 2          | Layer(`@layer xeg-base, xeg-components`) 도입으로 충돌 최소화, 빌드 임팩트 적음 |
| D. 테스트 구조 재정돈         | 카테고리 많음/중복    | 1) 그대로 2) 핵심 6그룹 축소 3) All-in-one tag 기반              | 2          | 유지비 절감 + 문서/CI 단순화                                                    |
| E. Signal wrapping 카운터     | Proxy 오버헤드        | 1) 항상 Proxy 2) 플래그 기반 지연 3) 전면 제거                   | 2          | 성능 영향 최소화 + 진단 기능 유지                                               |
| F. Dead Code & Migration 표식 | deprecated 분산       | 1) 주석만 2) `@deprecated` + 중앙 manifest 3) 자동 스캔 스크립트 | 2          | manifest(`docs/deprecations.json`) 기반 제거 추적                               |
| G. 파일명/다운로드 로직       | UI/도메인 결합        | 1) 그대로 2) Pure domain 모듈 추출 3) Hook + adapter 패턴        | 3          | Reactivity/side-effect 분리, 테스트 용이                                        |
| H. 에러 모델                  | 문자열 혼재           | 1) 유지 2) Error subclass 표준 3) Result/Either                  | 2          | 브라우저/사용자스크립트 환경 단순화 고려                                        |
| I. Build Guard                | 수동 스크립트 실행    | 1) 현행 2) prepush hook 3) CI stage 분리                         | 2          | 개발 편의성 + 실패 조기 감지                                                    |
| J. Import 경로 일관화         | 상대 경로 일부 존재   | 1) Lint only 2) Codemod 적용 3) TS paths 재구조                  | 2          | 일괄 변환 후 ESLint 룰 enforce                                                  |

## 4. 선택안 상세 (핵심 5개)

### A. Vendor 레거시 제거

- 단계 1: 모든 `@deprecated` 함수 호출 시 `logger.warn` + 스택 1회 출력 (콜드
  경로)
- 단계 2: 사용 통계(간단한 카운터) 노출 → 보고서
- 단계 3: 제거 PR (테스트 경로 대체 후)
- 완료 기준: 레거시 호출 0, 타입 정의 제거, 테스트 green

### B. 서비스 키 중복

- `aliasServiceKey(original, alias)` 유틸 추가 (읽기 전용 resolve)
- Deprecated 키 resolve 시 경고 1회
- 제거 마이그레이션 안내: `docs/MIGRATION_SERVICE_KEYS.md`

### G. 다운로드/파일명 분리

- New: `@shared/media/filename-domain.ts` (순수 함수 집합)
- Adapter: DOM/Anchor 생성 로직을 `NativeDownloadAPI` 사용 하위 레이어로 이동
- 테스트: 1) pure 함수 → 단위, 2) adapter → mock URL.createObjectURL

### H. 표준화된 Error

- `BaseXegError extends Error { code; details; cause; }`
- 카테고리: `MEDIA`, `NETWORK`, `DOM`, `STYLE`, `SERVICE`
- `logError` 호출 시 shape 감지 → 구조적 출력
- 레거시 문자열 에러는 래핑 후 통과

### J. Import 경로 정리

- Codemod: 상대경로 `../../shared/...` → `@shared/...`
- ESLint rule 활성 (이미 일부 존재) + CI fail on violation
- TDD: 변환 전 snapshot 생성 → 변환 후 diff 0 (기능 영향 없음)

## 5. 실행 파동 (Wave Plan)

| Wave           | 목표               | 주요 작업                                       | 측정 지표                           |
| -------------- | ------------------ | ----------------------------------------------- | ----------------------------------- |
| 0 Stabilize    | 안전망 확립        | Deprecated 경고 삽입, 기본 커버리지 측정        | 커버리지 기준선, deprecated 호출 수 |
| 1 Architecture | 구조 명확화        | 서비스 alias, 도메인 분리, import 정리          | 순환 의존 0, alias 경고 감소        |
| 2 Quality & DX | 테스트/빌드 자동화 | pre-push guard, perf 측정 harness               | 평균 테스트 시간, 실패 감지율       |
| 3 Optimization | 성능/크기 개선     | CSS Layer, signal 래핑 플래그화, dead code 제거 | 번들 크기 감소 %, 실행 초기화 시간  |
| 4 Cleanup      | 레거시 제거        | deprecated 완전 삭제                            | deprecated 0, 문서 반영             |

## 6. TDD 전략 매핑

| 단계         | RED                     | GREEN             | REFACTOR 안전망              |
| ------------ | ----------------------- | ----------------- | ---------------------------- |
| Vendor 제거  | 레거시 호출 존재 테스트 | 경고 출력         | 호출 제거 & 테스트 이름 유지 |
| 서비스 alias | alias 미해결 테스트     | alias resolve     | 중복 키 제거                 |
| 도메인 분리  | UI 결합 실패 테스트     | pure 함수 구현    | adapter 추상화 정리          |
| Error 모델   | 구조 로그 기대 실패     | BaseXegError 도입 | 코드 재배치/메시지 단순화    |
| Import 정리  | lint fail 케이스 추가   | codemod 변환      | dead path 제거               |

## 7. 품질 게이트 (CI/로컬)

- Build: `vite build` 성공 & 사이즈 리포트 비교 (±5% 이상 변화시 경고)
- Type: `tsc --noEmit` 무오류
- Lint: ESLint + 경로/순환 검사
- Test: Vitest 전체 green (핵심 라인 커버리지 ≥ 75% → 목표 85%)
- Deprecation: 호출 카운트 0 (Wave 4 전)

## 8. 메트릭 & 보고

| 메트릭          | 수집 방법                  | 주기    |
| --------------- | -------------------------- | ------- |
| 번들 크기       | build-metrics.js           | PR마다  |
| Dead tokens     | dead-token-reporter.js     | 주간    |
| Deprecated 호출 | global counter → 콘솔 요약 | 로컬/CI |
| 초기화 시간     | measurePerformance wrapper | PR마다  |

## 9. 위험 & 완화

| 위험                  | 영향               | 완화                           |
| --------------------- | ------------------ | ------------------------------ |
| Deprecated 조기 삭제  | 외부 스크립트 깨짐 | 경고 주기 + 2 릴리스 유예      |
| Codemod 오탐          | 빌드 실패          | PR 단계 snapshot 비교          |
| Signal Proxy 오버헤드 | 렌더 지연          | 플래그 비활성 기본             |
| CSS Layer 호환성      | 구형 브라우저      | Feature detect + fallback 유지 |

## 10. 완료 정의 (Definition of Done)

- 문서 갱신 (이 파일 포함)
- 관련 테스트 통과 및 커버리지 기준 유지/향상
- Deprecated 제거 시 마이그레이션 문서 링크
- 로그 레벨/포맷 일관성 (스코프 + ISO timestamp)
- CI 파이프라인 새 규칙 적용

## 11. 즉시 다음 액션 (Wave 0 착수)

1. Deprecated vendor API 경고 유틸 삽입 (1회 로깅) & 호출 카운터 기록
2. Codemod 스크립트 초안 (`scripts/codemod-import-alias.mjs`) 초안 추가 (테스트
   미적용)
3. BaseXegError 골격 + 단위 테스트 추가 (RED)
4. 서비스 alias 유틸 인터페이스 설계 (테스트 RED)

## 12. 부록: 결정 로그 (간결)

- 2025-09-04: 복잡 Vendor 매니저 → 단순 getter 유지 (추가 추상화 금지)
- 2025-09-04: CSS Layer 도입 결정 (Wave 3)
- 2025-09-04: Error 모델은 Result/Either 대신 클래스로 표준화

---

문서는 각 Wave 완료 후 축약/갱신하며, 세부 구현 메모는 PR 설명으로 이동.
