/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

// DOM API가 global에서 사용 가능하도록 설정
declare global {
  interface Window {
    document: Document;
  }
}

export {};
