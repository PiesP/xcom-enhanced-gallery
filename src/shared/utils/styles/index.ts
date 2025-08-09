/**
 * @fileoverview 스타일 유틸리티 export
 * @description CSS 클래스 및 스타일 관련 유틸리티
 * @version 2.0.0
 */

// CSS utilities (배럴 위생 규칙: style-service에 대한 재-export 금지)
// StyleManager 등 핵심 스타일 API는 '@shared/styles'에서 직접 import 하세요.

// Backward compatibility utilities for existing components
export { toggleClass, getCSSVariable, applyTheme } from './style-utils';
