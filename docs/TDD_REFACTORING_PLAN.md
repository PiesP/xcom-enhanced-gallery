# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 7 UX 개선 작업 완료, 테스트 타입 안정화 진행 중
>
> **최종 업데이트**: 2025-10-12

---

## 현재 작업 중인 Phase

> **Phase 7 완료**: 4개 핵심 UX 회귀 복원 완료 (툴바 인디케이터, 휠 스크롤, 설정
> 모달, 이미지 크기 버튼)
>
> 상세 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-12 항목) 참조

---

## 작업 우선순위 정리

### 즉시 착수 (P0)

✅ **Phase 7 우선순위 1-4 완료** (2025-10-12)

### 2순위 (P1)

- Phase 5-5: 테스트 타입 안정화 지속 (현재 1,383개 오류)
- Phase 5-6: Fast 테스트 통과율 100% 달성 (현재 97.3%)

### 이후 작업 (P2)

- 성능 최적화 및 번들 크기 감소 검토
- 추가 UX 개선 사항 수집

---

## 개발 가이드라인

### TDD 접근

- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서
- RED → GREEN → REFACTOR 사이클 준수

### 코딩 규칙 준수

- Solid.js Signals 사용: `getSolid()`, `getSolidStore()` getter 경유
- PC 전용 이벤트만 사용: click, keydown/up, wheel, contextmenu, mouse\*
- CSS Modules + 디자인 토큰만 사용 (하드코딩 금지)
- 경로 별칭 사용: `@`, `@features`, `@shared`, `@assets`

### 검증 절차

각 작업 완료 후:

```powershell
npm run typecheck  # TypeScript 타입 체크
npm run lint:fix   # ESLint 자동 수정
npm test:smoke     # 핵심 기능 스모크 테스트
npm run build      # dev/prod 빌드 검증
```

---

## 코드 품질 현황

### 마이그레이션 완료 현황

- ✅ **Phase 1-6**: Solid.js 전환, 테스트 인프라, 문서 정비 완료
- ✅ **빌드**: dev 711.28 KB / prod 성공
- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)
- ✅ **린트**: 0 warnings, 0 errors
- ✅ **의존성 그래프**: 1개 정보 메시지 (비크리티컬)

### 현재 테스트 상황

- ✅ Smoke 테스트: **15/15 통과** (100%)
- 🟡 Fast 테스트: **516/543 통과** (95.0%)
- 🟡 테스트 타입: 1,383개 오류 (테스트 파일만, src/ 코드는 0 오류)

### 기술 스택

- **UI**: Solid.js 1.9.9
- **상태**: Solid Signals (내장)
- **번들러**: Vite 7
- **타입**: TypeScript strict
- **테스트**: Vitest 3 + JSDOM

---

## 품질 게이트
