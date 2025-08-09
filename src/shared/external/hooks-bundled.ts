/**
 * Bundled Preact Hooks facade
 *
 * CSP/IIFE 환경에서 동적 import로 인한 TDZ 문제를 방지하기 위해
 * preact/hooks 를 정적으로 번들에 포함해 안정적인 레퍼런스를 제공한다.
 */

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
  useReducer,
  useLayoutEffect,
} from 'preact/hooks';
import type { PreactHooksAPI } from './vendors/vendor-service';

export const preactHooks: PreactHooksAPI = {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
  useReducer,
  useLayoutEffect,
};

export type BundledPreactHooks = typeof preactHooks;
