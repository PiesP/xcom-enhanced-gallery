# Phase E: Service Contracts

이 디렉터리는 MediaService의 공개 계약을 보호하는 테스트를 포함합니다.

- media-service.contract.test.ts: 공개 메서드 목록과 기본 동작 가드
- media-service.download-result.test.ts: 다운로드 성공/실패 시 Result shape 가드

이 테스트들은 구현 세부사항에 의존하지 않고, API의 형태와 오류 처리 일관성을
보장합니다.
