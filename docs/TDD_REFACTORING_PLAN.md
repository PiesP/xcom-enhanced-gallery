# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-27 | **상태**: Phase 195 완료 ✅

## 📊 현황 요약

| 항목      | 상태             | 비고              |
| --------- | ---------------- | ----------------- |
| 빌드      | ✅ 341 KB        | 안정적 (5KB 여유) |
| 테스트    | ✅ GREEN         | 89/97 E2E 통과    |
| 타입/린트 | ✅ 0 errors      | 모두 통과         |
| 의존성    | ✅ 0 violations  | 정책 준수         |
| 상태      | ✅ 배포 준비완료 | 모든 지표 정상    |

---

## 🎯 활성 작업

### Phase 196 🔄 (2025-10-27)

**Gallery Hooks 리팩토링 - 복잡도 감소 및 유지보수성 개선**

#### 결정 (Option B 선택)

**선택 이유**:

- 기술부채 높음 (Phase 주석 7개, 복잡도 688줄)
- 유지보수성 개선으로 향후 작업 가속화
- 기존 코드 품질 유지하면서 구조 개선 가능

#### 세부 계획

**1️⃣ useGalleryFocusTracker.ts 분할** (~4-6시간)

**현황**: 688줄, Phase 주석 7개, 프로젝트 최대 규모 훅

**분할 전략**:

- `useGalleryFocusState.ts` (100-120줄): 상태 관리 + Signal 정의
- `useGalleryFocusHelpers.ts` (150-180줄): 7개 helper 함수 이동
- `useGalleryFocusTracker.ts` (300-350줄): 정제된 핵심 로직 유지

**예상 효과**:

- 각 파일 <350줄 (권장 범위)
- Phase 주석 제거 (명확한 파일 구조로 대체)
- 테스트 작성 용이 (helper 함수 단위 테스트 가능)

**2️⃣ useGalleryItemScroll.ts 검토** (~2-3시간)

**현황**: 442줄, 일부 최적화 가능

**개선 포인트**:

- Event handler 분리 검토
- 유틸 함수 추출 검토
- 불필요한 wrapping 제거

**3️⃣ 테스트 검증 및 추가** (~1-2시간)

- 기존 테스트 모두 GREEN 확인
- 분할된 모듈별 단위 테스트 추가 (필요시)
- E2E 스모크 테스트 재검증

#### 수용 기준

✅ **성공 조건**:

- npm run typecheck → 0 errors
- npm run lint → 0 errors
- npm run test:smoke → 모두 통과
- npm run build → ≤346KB (현재 341KB 유지)
- 모든 git hooks 통과 (pre-commit, pre-push)

⏳ **예상 소요 시간**: 7-11시간 (검증 포함)

📌 **상세 분석**: `docs/temp/GALLERY_HOOKS_AUDIT_REPORT.md` 및
`docs/temp/GALLERY_COMPONENTS_OPTIONS_REVIEW.md` 참고

---

## ✅ 최근 완료

### Phase 195 ✅ (2025-10-27)

**프로젝트 소스 코드 정리**

- ✅ 백업 파일 6개 제거
- ✅ src/shared/state/machines/ 신규 생성
- ✅ src/shared/state/signals/index.ts 생성
- ✅ 모든 검증 통과 (typecheck/lint/test/build)

**상세**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`

---

## 📚 참고 문서

- **완료 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`
- **테스트 전략**: `docs/TESTING_STRATEGY.md`
- **유지보수**: `docs/MAINTENANCE.md`
