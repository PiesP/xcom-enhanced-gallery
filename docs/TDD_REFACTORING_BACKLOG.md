# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 아이디어 저장소 (선정 전까지 여기서만 유지)
>
> 사용 방법:
>
> - 새 사이클 시작 시 이 목록에서 1~3개를 선택하여 `TDD_REFACTORING_PLAN.md`의
>   "활성 스코프"로 승격
> - 선택 기준: 가치(Impact) / 구현 난이도(Effort) / 가드 필요성(Risk of
>   Regression)
> - 승격 후 RED 테스트부터 작성, 완료되면 COMPLETED 로그로 이관
>
> 코멘트 규칙: `상태 | 식별자 | 요약 | 기대 효과 | 난이도(T/S/M/H) | 비고`
>
> 상태 태그: `IDEA`(순수 아이디어), `READY`(바로 착수 가능), `HOLD`(외부 의존),
> `REVIEW`(설계 검토 필요)

---

## Candidate List

- IDEA | RETRY_V2 | BulkDownload 부분 실패 재시도 후 남은 실패 상세 +
  correlationId 노출 + backoff 정책(지수/선형 비교) | 실패 복구 경험 향상 / 지원
  요청시 진단 용이 | M | stage metrics와 독립
- IDEA | I18N_KEYS | 토스트/오류 메시지 키 도입 + 누락 키 가드 테스트 | 메시지
  일관성 및 번역 확장 기반 | S | LanguageService 확장
- IDEA | MP_STAGE_METRICS | MediaProcessor stage duration/elapsed 수집(onStage:
  { stage, count, stageMs, totalMs }) | 성능 병목 가시화 | M | 성능 회귀 분석
  근거
- IDEA | MEM_PROFILE | Memory/GC 경량 프로파일(지원 환경에서 snapshot) + noop
  폴백 | 대량 처리 시 메모리 패턴 가시화 | H | 환경 의존 / 선택적
- REVIEW | PREFETCH_ADV | 고급 프리페치 스케줄 idle→rAF→microtask 계층 & A/B
  벤치 하네스 | 체감 렌더 지연 감소 | M | Phase P 진행 중 (스케줄 옵션 제공,
  벤치 하네스는 후속)
- IDEA | RESULT_STATUS_V2 | SettingsService 등 남은 경로 status 필드 정식 전파
  및 임시 @ts-expect-error 제거 | 상태 모델 일관성 / 테스트 신뢰성 | S | 부분
  적용 여부 재검증 필요

---

## Parking Lot (미보류)

(현재 없음)

---

## Template

```
IDEA | IDENTIFIER | 간단 요약 | 기대 효과 | 난이도(S/M/H) | 비고
```

필요 시 항목을 재정렬(우선순위 높을수록 위) 하며, 제거는 commit 메시지에 사유
명시.
