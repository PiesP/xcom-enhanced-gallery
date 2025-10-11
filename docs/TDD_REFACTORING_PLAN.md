# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 12 완료 - 모든 E2E 테스트 안정화 및 CI 통합 완료
>
> **최종 업데이트**: 2025-10-11
>
> **빌드**: ✅ dev (727.39 KB) / prod (325.05 KB gzip: 88.24 KB)
>
> **테스트**: ✅ Vitest 538/538 (100%, 23 skipped) | ✅ E2E 8/8 (100%)

---

## 활성 작업

### 라이선스 표기 개선 (우선순위: 높음)

#### 목표

- 빌드된 유저스크립트에 외부 라이브러리 라이선스 정보 자동 포함
- 프로덕션 빌드에만 적용 (개발 빌드는 제외)

#### 구현

- vite.config.ts에 `generateLicenseNotices()` 함수 추가
- LICENSES/ 폴더의 라이선스 파일을 읽어 주석으로 변환
- userscriptPlugin에서 프로덕션 빌드 시 헤더 다음에 라이선스 정보 삽입

#### 검증

```powershell
npm run build:prod
# dist/xcom-enhanced-gallery.user.js 확인
```

---

## 다음 단계 제안

### 문서 정리 (우선순위: 중간)

- [x] CODING_GUIDELINES.md 간결화 (1552줄 → ~300줄)
- [x] TDD_REFACTORING_PLAN_COMPLETED.md 요약 (4441줄 → ~100줄)
- [ ] 백업 파일 제거 (.backup 파일들)

#### 성능 최적화 (우선순위: 낮음)

- 번들 크기 분석 및 최적화
- 런타임 성능 프로파일링
- 메모리 사용량 모니터링

#### Vitest Skipped 테스트 정리 (우선순위: 중간)

- E2E로 대체 완료된 8개 skip 테스트 제거 또는 참조 주석 추가
- 나머지 15개 skipped 테스트 검토 및 정리

---

## 완료된 Phase

모든 완료된 Phase는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록되어
있습니다:

- **Phase 12**: E2E 테스트 안정화 및 CI 통합 ✅ - 2025-10-11
- **Phase 11**: E2E 회귀 커버리지 구축 (Playwright) ✅ - 2025-10-11
- **Phase 10**: 테스트 안정화 (Solid.js 마이그레이션 대응) ✅ - 2025-01-10
- **Phase 9**: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 ✅
- **Phase 8**: Fast 테스트 안정화 (우선순위 1-2) ✅ - 2025-01-10
- 이전 Phase들... (COMPLETED 문서 참조)

---

## 개발 가이드라인

### TDD 접근

- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서
- RED → GREEN → REFACTOR 사이클 준수
- 테스트 우선 작성으로 명확한 수용 기준 설정

### 코딩 규칙 준수

- **SolidJS 반응성**: `createSignal`, `createMemo`, `createEffect` 적절히 활용
- **Vendor getter 경유**: `getSolid()`, `getSolidStore()` 사용, 직접 import 금지
- **PC 전용 이벤트**: click, keydown/up, wheel, contextmenu, mouse\* 만 사용
- **CSS Modules + 디자인 토큰**: 하드코딩 금지, `--xeg-*` 토큰만 사용
- **경로 별칭 사용**: `@`, `@features`, `@shared`, `@assets`

### 검증 절차

각 작업 완료 후:

```powershell
npm run typecheck  # TypeScript 타입 체크
npm run lint:fix   # ESLint 자동 수정
npm test:smoke     # 핵심 기능 스모크 테스트
npm test:fast      # 빠른 단위 테스트
npm run build      # dev/prod 빌드 검증
```

---

## 코드 품질 현황

### 마이그레이션 완료 현황

- ✅ **Phase 1-12**: Solid.js 전환, 테스트 인프라, Import/ARIA 수정, UX 가드,
  E2E 통합 완료
- ✅ **빌드**: dev 727.39 KB / prod 325.05 KB (gzip: 88.24 KB)
- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)
- ✅ **린트**: 0 warnings, 0 errors
- ✅ **의존성 그래프**: 0 위배

### 현재 테스트 상황

- ✅ **Smoke 테스트**: 15/15 통과 (100%)
- ✅ **Fast 테스트**: 538/538 통과 (100%, 23 skipped)
- ✅ **E2E 테스트**: 8/8 통과 (100%)
- 🔵 **Skip된 테스트**: 23개 (정리 권장)

### 기술 스택

- **UI 프레임워크**: Solid.js 1.9.9
- **상태 관리**: Solid Signals (내장, 경량 반응형)
- **번들러**: Vite 7
- **타입**: TypeScript strict
- **테스트**: Vitest 3 + JSDOM, Playwright (E2E)

- **디자인 시스템**: CSS Modules + 디자인 토큰

---

## 품질 게이트

모든 PR은 다음 기준을 충족해야 합니다:

- [ ] TypeScript: 0 에러 (src/)
- [ ] ESLint: 0 에러, 0 경고
- [ ] Smoke 테스트: 100% 통과
- [ ] Fast 테스트: 100% 통과 (skip 제외)
- [ ] 빌드: dev/prod 성공
- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수
- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수
- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영

---

## 참고 문서

- **아키텍처**: `docs/ARCHITECTURE.md` - 3계층 구조, 의존성 경계
- **코딩 가이드**: `docs/CODING_GUIDELINES.md` - 스타일, 토큰, 테스트 정책
- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` - 의존성 가드 규칙
- **에이전트 가이드**: `AGENTS.md` - 로컬/CI 워크플로, 스크립트 사용법
- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 이전 Phase 상세 내역

---

**마지막 업데이트**: 2025-01-10

**다음 단계**: E2E 테스트 프레임워크 도입 (Playwright/Cypress 선택)
