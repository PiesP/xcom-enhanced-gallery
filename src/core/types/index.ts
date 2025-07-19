/**
 * @fileoverview Core Types Barrel Export
 * @version 1.0.0
 *
 * 핵심 비즈니스 로직과 관련된 모든 타입들을 중앙집중식으로 export합니다.
 *
 * 타입 계층 구조:
 * - core/types: 핵심 비즈니스 타입 (도메인 타입)
 * - shared/types: 공통 유틸리티 타입 (core를 re-export)
 */

// Core types
export * from './core.types';

// Media domain types
export * from './media.types';

// View mode types
export * from './view-mode.types';

// Lifecycle types (Infrastructure에서 이동)
export * from './lifecycle.types';

// UserScript types (Infrastructure에서 이동)
export * from './userscript.d';

// Service types
export * from './services.types';
