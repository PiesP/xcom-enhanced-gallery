# ICN-EVAL-02 — 아이콘 라이브러리 평가/이행 초안

목표

- 현재 내부 Tabler 스타일 아이콘 컴포넌트(Icon/IconButton)를 유지 가능한지 점검.
- 대안: Lucide, Tabler(최신), Remix 등 — 라이선스/사이즈/명확성 비교.

후보 및 메모(요약)

- Tabler (MIT): 경량, 라인 아이콘 가독성 우수, 현행 스타일과 동일 — 유지 시 변경
  없음.
- Lucide (ISC): Feather 후속, 명확한 윤곽선, 개별 임포트 우수 — 스타일 차이 검토
  필요.
- Remix (Apache-2.0): 다양한 스타일, 사이즈 증가 가능 — 보류.

이행 전략(무중단)

1. Icon 어댑터 유지: 내부 ../Icon 에 매핑 레이어를 두고 외부 후보를 내부 API로
   감쌈.
2. 스모크 테스트: deps/iconlib.no-external-imports.red.test.ts 유지 + 신규
   트리셰이킹 가드.
3. 파일 단위 스왑: Toolbar → Toast → Settings 순으로 저위험 경로부터 교체 가능성
   평가.
4. 번들 영향: bundle-analysis.js로 gzip Δ ≤ +3KB 유지, 초과 시 중단.

다음 단계

- 후보별 3개 아이콘(설정/다운로드/확대) 실측 렌더 비교 스냅샷(테스트)
- 번들 사이즈 측정과 접근성 레이블 회귀 테스트
- 적합 시 PR로 활성 계획서에서 제거하고 완료 로그에 요약 등록
