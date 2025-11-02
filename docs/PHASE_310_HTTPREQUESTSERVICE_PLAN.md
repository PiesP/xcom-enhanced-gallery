# Phase 310: HttpRequestService 구현 계획

**Project**: X.com Enhanced Gallery | **Date**: 2025-11-02 | **Status**: Planning | **Phase**: 310

---

## 📌 Overview

**Phase 309** Tampermonkey Service Layer 패턴을 확장하여 네트워크 요청을 `GM_xmlHttpRequest`로 이관합니다.

**목표**:
- Fetch API 제거 및 `GM_xmlHttpRequest` 직접 사용
- 타입 안전한 HTTP 서비스 래퍼 제공
- 기존 네트워크 요청 레이어 통합
- 에러 처리 및 타임아웃 관리 표준화
- 예상 코드 감소: **40%** (약 120-150줄)

---

## 🎯 Objectives

- [ ] 현재 HTTP 레이어 분석 (fetch 사용처, 타입 정의)
- [ ] `GM_xmlHttpRequest` 호출 패턴 설계
- [ ] Singleton 서비스 클래스 구현
- [ ] TypeScript 타입 정의 (Request/Response/Error)
- [ ] 기존 fetch 래퍼 제거 및 통합
- [ ] 단위 테스트 작성
- [ ] E2E 검증 (twitter API 호출 흐름)
- [ ] 문서 업데이트 (ARCHITECTURE.md, CODING_GUIDELINES.md)

---

## 📊 Analysis / Current State

### 기존 HTTP 사용 패턴

**파일 검색 (예상)**:
- `src/shared/services/media/twitter-video-extractor.ts` - Twitter API 호출
- `src/shared/services/token-extraction/twitter-token-extractor.ts` - 토큰 추출
- 기타 fetch() 직접 호출 지점

### 현재 문제점

1. **중복 코드**: 각 서비스에서 fetch 래핑 로직 반복
2. **타입 안전성**: fetch Response 타입 변환 미흡
3. **에러 처리**: 일관되지 않은 에러 처리
4. **타임아웃**: 무한 대기 가능성
5. **보안**: 직접 fetch 사용 시 CSP 제약 회피 불가

### Tampermonkey GM_xmlHttpRequest 특징

**강점**:
- 크로스 오리진 요청 가능
- HTTP 헤더 커스터마이징 가능
- 요청/응답 바이너리 처리 가능
- 타임아웃 설정 가능

**제약사항**:
- 콜백 기반 API (Promise 화)
- 응답 데이터 타입 제한 (text, blob만)
- 컨텍스트 스코핑

---

## 💡 Solution / Implementation

### 1. HttpRequestService 클래스 설계

**위치**: `src/shared/services/http-request-service.ts`

**인터페이스**:

```typescript
export class HttpRequestService {
  static getInstance(): HttpRequestService;

  async get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  async post<T = unknown>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  async put<T = unknown>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  async delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
}

// 타입 정의
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number; // ms, default: 10000
  responseType?: 'json' | 'text' | 'blob';
}

export interface HttpResponse<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message);
  }
}
```

### 2. 구현 전략

**Step 1**: GM_xmlHttpRequest Getter 함수

```typescript
function getGMXmlHttpRequest(): typeof GM_xmlHttpRequest | undefined {
  const gm = globalThis as Record<string, unknown> & { GM_xmlHttpRequest?: typeof GM_xmlHttpRequest };
  return gm.GM_xmlHttpRequest;
}
```

**Step 2**: Promise 래핑

```typescript
private request<T>(
  method: string,
  url: string,
  data?: unknown,
  options?: HttpRequestOptions,
): Promise<HttpResponse<T>> {
  return new Promise((resolve, reject) => {
    const gmXhr = getGMXmlHttpRequest();
    if (!gmXhr) {
      reject(new Error('GM_xmlHttpRequest not available'));
      return;
    }

    const timer = setTimeout(
      () => reject(new Error('Request timeout')),
      options?.timeout ?? 10000,
    );

    gmXhr({
      method,
      url,
      headers: options?.headers,
      data: data ? JSON.stringify(data) : undefined,
      responseType: options?.responseType ?? 'json',
      onload: (response) => {
        clearTimeout(timer);
        if (response.status >= 200 && response.status < 300) {
          resolve({
            status: response.status,
            statusText: response.statusText,
            data: this.parseResponse(response.response, options?.responseType),
            headers: this.parseHeaders(response.responseHeaders),
          });
        } else {
          reject(new HttpError(response.statusText, response.status, response.statusText));
        }
      },
      onerror: (error) => {
        clearTimeout(timer);
        reject(new Error(`Network error: ${error}`));
      },
      ontimeout: () => {
        clearTimeout(timer);
        reject(new Error('Request timeout'));
      },
    });
  });
}
```

### 3. 기존 코드 통합

**제거 대상**:
- `src/shared/external/userscript/adapter.ts` - fetch 래퍼 (있으면)
- 개별 서비스의 HTTP 헬퍼 함수
- 중복 fetch 로직

**통합 대상**:
- `TwitterVideoExtractor` HTTP 호출 → `HttpRequestService.get()`
- `TwitterTokenExtractor` API 호출 → `HttpRequestService.post()`
- 기타 API 호출 → Service로 통합

---

## 📋 Implementation Checklist

### Phase 310-1: 서비스 구현

- [ ] 현재 HTTP 사용처 분석 (grep 검색)
- [ ] `HttpRequestService` 클래스 작성 (200줄)
  - [ ] Singleton 패턴
  - [ ] GM_xmlHttpRequest 래핑
  - [ ] Promise 기반 API
  - [ ] 타입 정의 (Request/Response/Error)
- [ ] `src/shared/services/index.ts` export 추가
- [ ] 단위 테스트 작성 (JSDOM)
  - [ ] HTTP GET 요청 시뮬레이션
  - [ ] 타임아웃 처리
  - [ ] 에러 처리
- [ ] 검증: `npm run validate`
- [ ] 빌드: `npm run build:only`

### Phase 310-2: 기존 코드 통합

- [ ] TwitterVideoExtractor fetch 제거 → HttpRequestService 사용
- [ ] TwitterTokenExtractor 통합
- [ ] 기타 네트워크 요청 서비스 통합
- [ ] 불필요한 HTTP 헬퍼 제거
- [ ] 검증: `npm run validate`
- [ ] 테스트: `npm run test:unit`
- [ ] E2E 검증: `npm run e2e:smoke`

### Phase 310-3: 정리 및 문서화

- [ ] ARCHITECTURE.md 업데이트 (HttpRequestService 섹션)
- [ ] CODING_GUIDELINES.md 업데이트 (HTTP 요청 패턴)
- [ ] .github/copilot-instructions.md 업데이트
- [ ] 최종 검증: `npm run build`
- [ ] 커밋: `feat: add HttpRequestService - Phase 310`

---

## 🔍 Success Criteria

- ✅ HttpRequestService 구현 (200줄 ±30줄)
- ✅ 기존 fetch 코드 통합 (코드 감소 40%)
- ✅ 타입 안전성 유지 (strictNullChecks 준수)
- ✅ 모든 HTTP 호출 Service 사용
- ✅ 단위 테스트 추가 (4-6개)
- ✅ E2E 검증 통과 (89/92 이상)
- ✅ npm run validate ✅
- ✅ npm run build ✅

---

## 📈 Expected Outcomes

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| HTTP 헬퍼 함수 수 | 5-7개 | 1개 (HttpRequestService) | 70-80% ↓ |
| 코드 라인 수 | ~200줄 | ~120-150줄 | 40% ↓ |
| 타입 안전성 | 부분적 | 완전 | 100% ✅ |
| 에러 처리 | 불일관 | 일관됨 | 100% ✅ |

---

## 🔗 Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Service Layer 개요
- [TAMPERMONKEY_API_PRIORITY_POLICY.md](./TAMPERMONKEY_API_PRIORITY_POLICY.md) - 정책 문서
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 코딩 규칙
- [Phase 309 완료 기록](./PHASE_308_PHASE_2B_COMPLETION_REPORT.md)

---

## 📅 Timeline

- **Design**: 2025-11-02 (현재)
- **Implementation**: 2025-11-02 ~ 2025-11-03
- **Testing & Integration**: 2025-11-03
- **Documentation**: 2025-11-03
- **Completion**: 2025-11-03

---

**Status**: 🔄 Planning | **Next**: HttpRequestService 구현 시작
