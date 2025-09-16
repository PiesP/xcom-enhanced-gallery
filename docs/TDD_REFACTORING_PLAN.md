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
- GM\_\* 직접 사용: 어댑터/타입 외 직접 사용 금지 스캔 테스트 존재(OK).
- 다운로드/ZIP: ZIP/다운로드는 각각 zip-creator/Userscript
  adapter/NativeDownload 경유(OK), 다만 정리 정책 및 실패 경로 토스트 루틴의
  테스트 보강 여지.
- 문서: CODING_GUIDELINES의 Markdown 코드펜스/섹션 구조는 복구되었고,
  ARCHITECTURE/DEPENDENCY-GOVERNANCE는 CODING_GUIDELINES를 단일 소스로
  참조하도록 정리됨(OK).

리스크/개선 포인트:

- 문서-현행 불일치(코드펜스/단락 섞임)로 독해 난이도 증가 → 문서 수정.
- Postbuild 가드와 소스 수준 스캔 테스트의 허용 목록/메시지 정합성 점검 필요.

---

## 1) 다운로드 에러 복구 UX 가드 강화 (D1.1)

문제: 에러/부분 실패 토스트 정책은 문서화되어 있으나, 경계 테스트(중복 토스트
방지/부분 실패 메시지 정확성)의 존재가 분산되어 있음.

대안:

- A) 서비스 계약 테스트만 보강 (간단, 빠름)
- B) 서비스 + UI 통합 테스트 작성 (더 강함, 유지보수 비용 증가)

선택: A 우선, 필요 시 B 추가.

작업:

- 테스트 추가/보강:
  `test/unit/shared/services/bulk-download.error-recovery.test.ts`
  - 다중 ZIP 전체 실패/부분 실패/성공/취소 시 토스트 라우팅과 메시지 중복 방지
    검증
- 서비스 미세 수정 필요 시 최소 diff로 적용(토스트 라우팅/플래그 일관화)

수용 기준:

- 위 4 케이스 GREEN. prod/dev 빌드 후 postbuild validator GREEN 유지.

장점: 사용자 피드백 일관성 향상. 단점: 서비스 경로 테스트 확장으로 약간의 유지
비용.

---

## 2) PC-only 입력 중앙화 가드 강화 (KBD-NAV-UNIFY)

문제: 문서에 중앙화 원칙이 있으나, 신규 코드 유입 시 document/window 직접 등록
위험.

작업:

- 스캔 테스트 유지 강화:
  `test/unit/lint/keyboard-listener.centralization.policy.test.ts` 규칙에 Window
  listener 패턴 추가 검사.
- `KeyboardNavigator` 계약 테스트: 편집 가능한 요소 무시, preventDefault 동작
  토글 옵션 검증 추가.

수용 기준:

- 스캔 테스트 위반 0. 계약 테스트 GREEN.

장점: 회귀 방지. 단점: 테스트 실행 시간 소폭 증가.

---

## 3) Vendors 정적 경로 단일화 메시지 보강 (VND-LEGACY-MOVE)

문제: 동적 VendorManager는 테스트 전용으로 격리되어 있으나, 메시지/주석/문서 간
표현 상이.

작업:

- vendors index와 vendor-manager.ts에 주석/JsDoc을 일관 표현으로 보정(테스트
  전용 강조, prod 문자열 누출 금지).
- Postbuild validator 설명을 CODING_GUIDELINES에 간단 연결(중복 텍스트 축소).

수용 기준:

- 빌드 산출물 문자열 스캔 시 ‘VendorManager’ 금지 규칙 설명이 문서-코드 주석과
  일치.

장점: 유지보수 가독성. 단점: 문서/주석 정리만.

---

## 4) 의존성/배럴 표면 가드 유지보수 (F1/U4)

문제: features 배럴/아이콘 배럴에서 미사용 export 발생 위험.

작업:

- 스캔 테스트 메시지/허용목록 최신화: Windows 경로 정규화 주석 보강, 예외
  최소화.
- 배럴 표면을 타입/팩토리/UI로 한정하는 가이드 문구 보강.

수용 기준:

- 스캔 RED 테스트들에서 위양성 없음, 실 사용 없는 export 추가 시 즉시 RED.

장점: 번들 표면 축소. 단점: 새 아이콘 추가 시 테스트 동반 필요.

---

## 우선순위/일정 제안

1. 다운로드 에러 복구 UX 가드 강화 (0.5–1d)
2. PC-only 입력 중앙화 가드 강화 (0.5d)
3. Vendors 정적 경로 메시지 보강 (0.25d)
4. 배럴 표면 가드 유지보수 (0.25d)

병렬화: 1–4는 독립적.

---

## 작업 체크리스트(DoD)

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
