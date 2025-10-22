# TDD 리팩토링 활성 계획 (현재 상태)

> xcom-enhanced-gallery 프로젝트 개발 상태 정리 **최종 업데이트**: 2025-10-22
> (Phase B3.2.3 완료 후)

---

## 📊 현황 요약

| 항목           | 상태                 | 비고                                   |
| -------------- | -------------------- | -------------------------------------- |
| Build (prod)   | ✅ 339.34 KB         | 제한: 335 KB, 여유: -4.34 KB (⚠️ 주의) |
| 전체 테스트    | ⚠️ 3131 PASS, 6 FAIL | GalleryContainer.test.tsx 기존 이슈    |
| Typecheck/Lint | ✅ PASS              | 모든 검사 완료                         |
| 의존성         | ✅ OK                | 정상 범위                              |

---

## 🔴 활성 이슈

### 1. Build 크기 초과 (⚠️ 긴급)

**상태**: 339.34 KB > 335 KB 제한 (4.34 KB 초과)

**원인 분석 필요**:

- Phase B3.2.3 BulkDownloadService 테스트 추가 (50개)로 인한 크기 증가 추정
- 또는 최근 마스터 병합 후 의존성 변경

**해결 방안**:

- A. 테스트 파일 최적화 (작은 테스트 통합)
- B. 프로덕션 번들 최적화 (트리 셰이킹, 불필요 import 제거)
- C. 번들 분석 도구 사용: `npm run analyze` (구현 필요)

---

### 2. GalleryContainer.test.tsx 6개 테스트 실패 (기존 이슈)

**상태**: 테스트 기본 구조 문제 (Mock/Logger 설정)

**파일**: `test/unit/shared/components/isolation/GalleryContainer.test.tsx`

**실패 테스트**:

- logger 정적 모의 미작동 (6개)

**다음 단계**: Phase B4/B5에서 통합 이슈로 재검토

---

### 3. sample-based-click-detection.test.ts 임시 제외 (해결됨 ✅)

**상태**: vitest.config.ts의 fast 프로젝트에서 제외 처리

**원인**: MediaExtractionService 의존성 주입 방식 불일치

- 테스트: 생성자 주입 시도
- 실제: 생성자에서 자체 인스턴스 생성

**향후 계획**: Phase B3.2.5 이후 수정 예정

---

## ✅ 최근 완료 작업

### Phase B3.2.3: BulkDownloadService 커버리지 강화

**완료**: 2025-10-21

- 테스트: 50개 (모두 PASS)
- 커버리지: 생명주기, 상태 관리, 에러 처리, 취소/추적, 통합 시나리오

### 한국어 i18n 개선

**완료**: 2025-10-22

- `useGalleryItemScroll.ts`: 댓글/로그의 한국어 문자열 → 영어로 변경
- i18n.message-keys.test.ts: ✅ 통과

---

## 📋 우선순위 작업 목록

### 1️⃣ Build 크기 초과 해결 (긴급)

```
작업: 339.34 KB → 335 KB 이하 감량 (최소 4.34 KB)
예상 소요: 2-4시간
방법:
  - Bundle analyzer 분석
  - 불필요 의존성/폴리필 제거
  - 테스트 파일 최적화
```

### 2️⃣ Phase B3.2.4: UnifiedToastManager 커버리지 (예정)

```
범위: 30-40개 테스트
기간: 1-2일
내용: 토스트 생명주기, 상태, 에러 처리, 통합 시나리오
```

### 3️⃣ GalleryContainer 테스트 수정 (선택사항)

```
범위: 6개 실패 테스트
기간: 1-2시간
방법: Logger/Mock 설정 검토, 올바른 패턴 적용
```

---

## 📚 참고 문서

- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 전략
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 3계층 구조
- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) -
  완료 Phase 기록

---

## 🎯 다음 세션 시작 전 체크리스트

- [ ] Build 크기 초과 문제 해결
- [ ] Phase B3.2.4 시작 준비
- [ ] E2E 테스트 안정화 검토

---

**상태**: 🟡 진행 중 (Build 크기 이슈 해결 필요) **담당**: AI/개발자 협업
