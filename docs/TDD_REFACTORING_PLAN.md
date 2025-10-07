# TDD 리팩토링 활성 계획: Preact → Solid.js 전환

> **상태**: Phase 6 완료 ✅ (2025-10-07)  
> **다음**: 문서 갱신 및 라이선스 정리

---

## ✅ Phase 0-6 완료: Preact → Solid.js 전환 완료

### 최종 결과 (Phase 6.12 기준)

**빌드**:

- Dev: 1,027 KB (이전 1,173 KB 대비 -146 KB / -12%)
- Prod: 327 KB (이전 366 KB 대비 -39 KB / -11%)
- Gzip: 87 KB

**품질**:

- ✅ TypeScript strict 100%, 0 에러
- ✅ ESLint 0 any 경고 (38개 → 0개 달성)
- ✅ 의존성 0 순환, 2 orphan infos (Solid primitives, 정상)
- ✅ 테스트 전체 스위트 GREEN

**변경 사항**:

- 삭제: 20개 파일 (~3,400 줄) + 22 packages (Preact 전체)
- 수정: 35개 파일 (Phase 6.1-6.12 누적)
- 추가: KeyboardHelpOverlay Solid 버전, test 인프라

---

## 🔄 남은 작업 (Phase 6.13)

### 문서 갱신

1. ✅ **TDD_REFACTORING_PLAN_COMPLETED.md** (완료)
   - Phase 6.10-6.12 추가

2. ✅ **TDD_REFACTORING_PLAN.md** (진행 중)
   - 간소화 및 최신 정보 반영

3. ⏸️ **ARCHITECTURE.md**
   - Solid.js 계층 구조 반영
   - Preact 언급 제거

4. ⏸️ **CODING_GUIDELINES.md**
   - Solid 컴포넌트 패턴 추가
   - Preact hooks 제거

5. ⏸️ **.github/copilot-instructions.md**
   - Solid.js 전용 가이드로 재작성

### 라이선스 정리

1. ⏸️ **LICENSES 폴더 정리**
   - Preact 라이선스 제거 (preact-MIT.txt, preact-signals-MIT.txt)
   - Solid.js 라이선스 추가 (solid-js-MIT.txt)
   - README.md 라이선스 섹션 업데이트

---

## 📖 참고 문서

- **완료 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (Phase 0-6.12)
- **프로젝트 가이드**: `AGENTS.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`
- **Copilot 가이드**: `.github/copilot-instructions.md`

---

## 🎉 프로젝트 현황

**기술 스택**:

- 프레임워크: **Solid.js 1.9.9** (Preact 완전 제거)
- 상태 관리: Solid Signals (createSignal, createEffect, createMemo)
- 빌드: Vite 7 + vite-plugin-solid
- 테스트: Vitest 3 + JSDOM + @solidjs/testing-library

**아키텍처**:

- 3계층: Features → Shared → External
- Vendors: getSolid(), getSolidWeb() (getter 패턴)
- 입력: PC 전용 이벤트만
- 스타일: CSS Modules + 디자인 토큰

**품질 정책**:

- TypeScript strict 모드 100%
- ESLint any 타입 0건
- 의존성 순환 0건
- TDD 우선 개발
