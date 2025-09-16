# TDD 리팩토링 활성 계획 (2025-09-16 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 환경: Vitest + JSDOM, 기본 URL https://x.com, vendors/userscript는
  getter/adapter로 모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

## 0) 현재 상태 점검 요약

- Vendors/Userscript: 소스 전반이 `@shared/external/vendors`와
  `userscript/adapter`를 사용. 동적 VendorManager는 테스트 한정 파일에만
  존재(OK). `vendor-api.ts`는 정적 매니저를 재노출(OK).
- PC-only 입력: 중앙 `KeyboardNavigator` 서비스가 존재하고, 갤러리 훅에서
  구독(OK). 금지 이벤트 스캔 테스트 존재(OK).

## 현재 활성 계획 없음

2025-09-16 기준, 활성 계획 항목이 없습니다. 남은 4개 항목은 관련 가드/테스트가
이미 존재하거나 기완료 작업으로 충족됨을 재확인했고, 완료 문서에 이관되었습니다.

- 자세한 이력과 근거는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`를 참조하세요.

```
- 타입/린트/포맷: `npm run validate` GREEN
- 테스트: `npm run test:fast`/`unit` GREEN, 필요 시 스캔 테스트 업데이트
- 빌드: `npm run build` GREEN, `scripts/validate-build.js` 통과
- 문서: CODING_GUIDELINES 코드펜스/헤딩 구조 파손 없음,
  ARCHITECTURE/DEPENDENCY-GOVERNANCE 역할 분리 명확

---

## 추적/참고

- 정책 참조: vendors getter, userscript adapter, PC-only 입력, CSS Modules+토큰,
  signals↔services 경계
- 허용 예외: 테스트/타입 정의 파일에 한정된 GM\_\* 및 VendorManager 언급
```
