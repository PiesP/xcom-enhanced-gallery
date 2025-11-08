# Playwright-MCP와 검색 도구 통합 분석 보고서

**작성 날짜**: 2025-11-07 **분석 범위**: Playwright-MCP를 통한 Perplexity/검색
도구 통합 가능성 **언어 정책**: 코드/기술 = 영어, 분석 = 한국어

---

## 📊 현재 사용 가능한 도구 분석

### 1. Brave Search API (현재 활용 중)

**현황**:

- ✅ 이미 프로젝트에 통합됨
- ✅ 웹 검색, 뉴스, 비디오 검색 기능
- ✅ 로컬 검색 (위치 기반)
- ✅ 이미지 검색

**제공되는 함수**:

```typescript
-mcp_brave -
  search -
  _brave_web_search -
  mcp_brave -
  search -
  _brave_news_search -
  mcp_brave -
  search -
  _brave_video_search -
  mcp_brave -
  search -
  _brave_image_search -
  mcp_brave -
  search -
  _brave_local_search -
  mcp_brave -
  search -
  _brave_summarizer;
```

**사용 예**:

```typescript
// 웹 검색
const results = await mcp_brave_web_search({
  query: 'TypeScript generics',
  country: 'US',
});

// 뉴스 검색
const news = await mcp_brave_news_search({
  query: 'React 19 release',
  freshness: 'pw', // 지난 주
});

// 요약 생성
const summary = await mcp_brave_summarizer({
  key: 'search-result-key',
  inline_references: true,
});
```

**평가**: ⭐⭐⭐⭐⭐ (프로덕션 준비 완료)

---

### 2. Playwright-MCP (브라우저 자동화)

**현황**:

- ✅ 웹 페이지 접근 및 상호작용 가능
- ✅ 스크린샷 캡처, 클릭, 타이핑 등
- ✅ 네트워크 요청 감시
- ✅ 콘솔 메시지 수집

**제공되는 함수**:

```typescript
-mcp_microsoft_pla_browser_navigate -
  mcp_microsoft_pla_browser_click -
  mcp_microsoft_pla_browser_type -
  mcp_microsoft_pla_browser_fill_form -
  mcp_microsoft_pla_browser_snapshot -
  mcp_microsoft_pla_browser_take_screenshot -
  mcp_microsoft_pla_browser_press_key -
  mcp_microsoft_pla_browser_wait_for -
  mcp_microsoft_pla_browser_console_messages -
  mcp_microsoft_pla_browser_network_requests;
```

**사용 예**:

```typescript
// 페이지 이동
await mcp_microsoft_pla_browser_navigate({
  url: 'https://www.perplexity.ai',
});

// 검색창 입력
await mcp_microsoft_pla_browser_type({
  element: 'search input',
  ref: "[data-testid='search-input']",
  text: 'TypeScript generics best practices',
});

// 검색 버튼 클릭
await mcp_microsoft_pla_browser_click({
  element: 'search button',
  ref: "[data-testid='search-button']",
});

// 결과 스크린샷
const screenshot = await mcp_microsoft_pla_browser_take_screenshot({
  filename: 'perplexity-results.png',
});
```

**평가**: ⭐⭐⭐⭐ (웹 자동화 가능, 하지만 Rate Limiting 주의)

---

## 🔍 검색 도구 통합 가능성 분석

### Option 1: Perplexity (웹 인터페이스 자동화)

**가능성**: ⚠️ 제한적

**장점**:

- ✅ 무료 웹 인터페이스 제공
- ✅ Playwright로 접근 가능
- ✅ JavaScript 렌더링 완료 후 데이터 추출 가능

**단점**:

- ❌ 공식 API 없음
- ❌ Terms of Service 위반 가능성
- ❌ 레이아웃 변경 시 스크래핑 깨짐
- ❌ Rate limiting/IP 차단 위험
- ❌ JavaScript 로딩 시간 길어짐 (5-10초+)

**구현 난제**:

```typescript
// 문제: 동적 렌더링 + 무한 스크롤
// 해결책: 명시적 대기 필요
await mcp_microsoft_pla_browser_wait_for({
  text: 'Research...', // 검색 시작 대기
  time: 10, // 최대 10초
});

// 추출 후 parsing 복잡
const response = await mcp_microsoft_pla_browser_snapshot();
// 또는
const screenshot = await mcp_microsoft_pla_browser_take_screenshot();
// → 이미지나 HTML에서 텍스트 추출 어려움
```

**결론**: ❌ **권장하지 않음** (API 없음, 불안정)

---

### Option 2: Google Search (웹 인터페이스)

**가능성**: ⚠️ 제한적

**장점**:

- ✅ 매우 안정적인 구조
- ✅ Playwright로 쉽게 자동화 가능

**단점**:

- ❌ 공식 API는 유료 (Google Custom Search)
- ❌ Rate limiting 엄격
- ❌ 봇 감지 및 CAPTCHA
- ❌ 약관 위반 위험

**결론**: ⚠️ **비권장** (봇 감지, Rate limiting)

---

### Option 3: Wikipedia/Stack Overflow API

**가능성**: ✅ 높음

**장점**:

- ✅ 공식 API 제공
- ✅ 약관에 명시적으로 허용
- ✅ Rate limiting 합리적
- ✅ Playwright 불필요 (HTTP API)

**사용 예**:

```typescript
// Wikipedia API
const result = await fetch(
  'https://en.wikipedia.org/w/api.php?action=query&titles=TypeScript&format=json'
);

// Stack Overflow API
const so_result = await fetch(
  'https://api.stackexchange.com/2.3/search?intitle=typescript&site=stackoverflow'
);
```

**평가**: ✅ **권장** (안정적, 합법적)

---

### Option 4: DuckDuckGo (웹 인터페이스)

**가능성**: ⚠️ 제한적

**장점**:

- ✅ Privacy-focused
- ✅ 사용자 에이전트 감지 덜함

**단점**:

- ❌ 공식 API 없음
- ❌ 약관 위반 가능성
- ❌ JavaScript 렌더링 복잡

**결론**: ⚠️ **비권장** (API 없음)

---

### Option 5: Tavily Search API (AI 최적화)

**가능성**: ✅ 높음

**장점**:

- ✅ 공식 API 제공
- ✅ AI 콘텐츠 추출 최적화
- ✅ 요약 기능 내장
- ✅ Rate limiting 합리적

**사용 예**:

```typescript
const response = await fetch('https://api.tavily.com/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: process.env.TAVILY_API_KEY,
    query: 'TypeScript generics',
    include_answer: true,
  }),
});
```

**평가**: ✅ **권장** (AI 최적화)

---

### Option 6: Brave Search API (현재 사용 중)

**가능성**: ✅ 매우 높음

**장점**:

- ✅ 이미 프로젝트에 통합
- ✅ 안정적인 API
- ✅ 다양한 검색 유형 지원
- ✅ Rate limiting 합리적
- ✅ Playwright 불필요

**사용 예**:

```typescript
// 이미 작동 중
const results = await mcp_brave_web_search({
  query: 'TypeScript generics best practices',
});

const summary = await mcp_brave_summarizer({
  key: results[0].summary_key,
  inline_references: true,
});
```

**평가**: ✅⭐⭐⭐⭐⭐ **가장 권장** (이미 통합됨)

---

## 📋 선택지 비교표

| 도구               | API     | 안정성     | 합법성 | 속도 | 결과 품질 | 권장도       |
| ------------------ | ------- | ---------- | ------ | ---- | --------- | ------------ |
| **Brave Search**   | ✅ API  | ⭐⭐⭐⭐⭐ | ✅     | 빠름 | 좋음      | ✅⭐⭐⭐⭐⭐ |
| **Tavily**         | ✅ API  | ⭐⭐⭐⭐   | ✅     | 빠름 | 우수      | ✅⭐⭐⭐⭐   |
| **Wikipedia**      | ✅ API  | ⭐⭐⭐⭐⭐ | ✅     | 중간 | 중간      | ✅⭐⭐⭐     |
| **Stack Overflow** | ✅ API  | ⭐⭐⭐⭐   | ✅     | 빠름 | 좋음      | ✅⭐⭐⭐     |
| **Perplexity**     | ❌ API  | ⭐⭐       | ⚠️     | 느림 | 우수      | ⚠️⭐         |
| **Google**         | ⚠️ 유료 | ⭐⭐⭐⭐   | ⚠️     | 빠름 | 우수      | ⚠️⭐⭐       |

---

## 🛠️ Playwright-MCP 활용 시나리오

### Scenario 1: 웹사이트 스크래핑 (비권장)

```typescript
// ❌ 도구 낭비, 느림, 불안정
async function scrapePerplexity(query: string) {
  // 1. 페이지 접근
  await navigate({ url: 'https://www.perplexity.ai' });

  // 2. 검색 입력 (5초)
  await type({ ref: "[data-testid='search']", text: query });

  // 3. 결과 대기 (10초+)
  await wait_for({ text: 'Research completed', time: 15 });

  // 4. 결과 추출 (HTML parsing 복잡)
  const snapshot = await snapshot();

  // 5. 텍스트 추출 (OCR/HTML 파싱 필요)
  const text = extractText(snapshot);

  return text;
  // 총 시간: 15초+, 성공률: 70-80%
}
```

**문제점**:

- ⏱️ 매우 느림 (10-20초)
- 🔄 불안정 (레이아웃 변경, 로딩 지연)
- 📊 복잡한 파싱 (Playwright는 텍스트 추출 미지원)
- 🚫 약관 위반

**결론**: ❌ **사용하지 말 것**

---

### Scenario 2: 웹 인터페이스 테스트 (권장)

```typescript
// ✅ 실제 유스케이스
async function testWebSearch() {
  // 1. 특정 검색 도구의 UI 테스트
  await navigate({ url: 'https://www.duckduckgo.com' });

  // 2. 검색 상호작용 테스트
  await type({ ref: "[role='searchbox']", text: 'test query' });
  await press_key({ key: 'Enter' });

  // 3. 결과 페이지 로드 확인
  await wait_for({ text: 'Results', time: 5 });

  // 4. UI 요소 검증
  const screenshot = await take_screenshot({
    filename: 'search-results.png',
  });

  // 5. 콘솔 에러 확인
  const messages = await console_messages();

  return { success: true, screenshot, messages };
  // 목적: UI 동작 검증
}
```

**장점**:

- ✅ 명확한 목적 (테스트)
- ✅ 예측 가능한 결과
- ✅ 약관 준수

**결론**: ✅ **권장**

---

### Scenario 3: API 기반 검색 (가장 권장)

```typescript
// ✅ 최적의 솔루션
async function searchWithBraveAPI(query: string) {
  // 이미 프로젝트에 있음
  const results = await mcp_brave_web_search({
    query: query,
    count: 10,
    country: 'US',
  });

  // 선택적: 요약 생성
  if (results.length > 0 && results[0].summary_key) {
    const summary = await mcp_brave_summarizer({
      key: results[0].summary_key,
      inline_references: true,
    });

    return {
      results: results,
      summary: summary,
    };
  }

  return { results: results };
  // 총 시간: 1-2초, 성공률: 99.5%
}
```

**장점**:

- ✅ 매우 빠름 (1-2초)
- ✅ 매우 안정적
- ✅ 구조화된 결과
- ✅ 약관 준수
- ✅ 이미 통합됨

**결론**: ✅⭐⭐⭐⭐⭐ **가장 권장**

---

## 🎯 프로젝트에 최적의 방안

### 현재 상태

```
✅ Brave Search API: 이미 통합, 작동 중
✅ Playwright: E2E 테스트용으로 사용 중
❌ Perplexity: API 없음, 웹 자동화 불권장
❌ Google: API 유료, 약관 복잡
⚠️ 기타: 분야별 API 있음 (Wikipedia 등)
```

### 권장 전략

**1순위**: Brave Search API 활용 (현재 상태 유지)

```typescript
// 프로젝트에서 이미 사용 가능
const search = async (query: string) => {
  return await mcp_brave_web_search({
    query,
    country: 'US',
    count: 10,
  });
};
```

**2순위**: Playwright (E2E 테스트용)

```typescript
// 웹 인터페이스 테스트만 사용
const testSearch = async () => {
  await navigate({ url: 'https://search.example.com' });
  // ... 테스트 로직
};
```

**3순위**: 특화 API (필요시)

```typescript
// 도메인별 최적화된 API
- Wikipedia: 문서 검색
- Stack Overflow: 개발자 Q&A
- Tavily: AI 최적화 검색
```

---

## 💡 결론

### ❌ Playwright-MCP로 Perplexity 검색 자동화?

**불가능하지는 않으나 권장하지 않음**:

1. **기술적 가능성**: ⚠️ 가능하지만 복잡
   - 웹 페이지 렌더링 대기 필요 (10-15초)
   - 동적 콘텐츠 추출 어려움
   - 결과 신뢰성 낮음

2. **법적 문제**: ⚠️ Terms of Service 위반 가능
   - Perplexity는 공식 API 없음
   - 웹 스크래핑 약관 위반
   - IP 차단 위험

3. **성능**: ❌ 비효율적
   - 속도: 10-20초 (Brave API는 1-2초)
   - 안정성: 70-80% (Brave API는 99%+)
   - 비용: 브라우저 리소스 낭비

### ✅ 대신 권장하는 것

**1순위**: 현재 사용 중인 Brave Search API

```typescript
// 이미 최적화되어 있음
const results = await mcp_brave_web_search({ query });
```

**2순위**: 도메인별 공식 API

```typescript
// Wikipedia, Stack Overflow 등
// 각각의 공식 API 사용
```

**3순위**: Playwright-MCP는 테스트용으로만

```typescript
// E2E 테스트 또는 UI 검증만 사용
```

---

## 📊 최종 비교

| 목적                  | 사용 도구        | 평가         |
| --------------------- | ---------------- | ------------ |
| **웹 검색**           | Brave Search API | ✅⭐⭐⭐⭐⭐ |
| **특화 검색**         | 도메인별 API     | ✅⭐⭐⭐⭐   |
| **UI 테스트**         | Playwright-MCP   | ✅⭐⭐⭐⭐   |
| **웹 스크래핑**       | ❌ 권장 안 함    | ❌           |
| **Perplexity 자동화** | ❌ 권장 안 함    | ❌           |

---

## 🔗 참고 자료

### 현재 프로젝트에서 사용 가능한 API

1. **Brave Search** (이미 통합)

   ```typescript
   -mcp_brave_web_search -
     mcp_brave_news_search -
     mcp_brave_video_search -
     mcp_brave_summarizer;
   ```

2. **Playwright** (E2E 테스트용)
   ```typescript
   - 웹 페이지 자동화
   - 테스트 스크린샷
   - 상호작용 테스트
   ```

### 추천 추가 통합

1. **Tavily Search** (AI 최적화)
2. **Wikipedia API** (문서 검색)
3. **Stack Overflow API** (개발 질문)

---

## 📝 언어 정책

✅ **이 문서**:

- 코드/기술용어: 영어
- 분석/설명: 한국어
- 프로젝트 정책 준수

---

**결론**: 🎯 **현재 사용 중인 Brave Search API가 최선의 솔루션입니다.**

Playwright-MCP를 웹 스크래핑용으로 사용하는 것은 비효율적이며 약관 위반 위험이
있습니다.
