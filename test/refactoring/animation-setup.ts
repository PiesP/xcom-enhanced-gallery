/**
 * @fileoverview Animation TDD Tests Setup - Isolated DOM mocking
 */

import { vi } from 'vitest';

// Prevent setup.ts from interfering with our DOM mocks
const originalSetup = global.require;
global.require = vi.fn().mockImplementation((path: string) => {
  if (path.includes('setup.ts')) {
    return {}; // Skip setup.ts
  }
  return originalSetup?.(path);
});

// Enhanced DOM mocking for animation tests
const mockElement = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
  style: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    transition: '',
    opacity: '',
    transform: '',
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setAttribute: vi.fn(),
};

global.document = {
  createElement: vi.fn().mockReturnValue(mockElement),
  head: {
    appendChild: vi.fn(),
  },
  getElementById: vi.fn().mockReturnValue(null),
  body: mockElement,
  querySelectorAll: vi.fn().mockReturnValue([]),
  documentElement: {
    scrollHeight: 2000,
  },
} as unknown as Document;

global.window = {
  scrollY: 100,
  innerHeight: 800,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as Window & typeof globalThis;

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

export {};
