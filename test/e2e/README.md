# E2E 테스트 실행 가이드

## 설정 확인

1. VS Code에서 MCP 서버 설정이 되어 있는지 확인
2. test/e2e/playwright-mcp.config.json의 설정 확인

## 테스트 실행 방법

### 개발 환경에서 테스트

```bash
# 브라우저가 보이는 상태로 테스트
npx @playwright/mcp@latest --browser chrome --user-data-dir ./test-profile
```

### CI 환경에서 테스트

```bash
# headless 모드로 테스트
npx @playwright/mcp@latest --browser chrome --headless
```

### 비주얼 테스트

```bash
# 스크린샷 기반 테스트
npx @playwright/mcp@latest --browser chrome --vision --user-data-dir ./test-profile
```

## 개별 테스트 실행

- 갤러리 열기/닫기: `gallery-open-close.mcp.js`
- 네비게이션: `gallery-navigation.mcp.js`
- 이벤트 차단: `event-blocking.mcp.js`

## 주의사항

- X.com 로그인이 필요한 경우 test-profile 디렉터리에 로그인 정보가 저장됩니다
- 첫 실행 시 Chrome 브라우저 설치가 필요할 수 있습니다
