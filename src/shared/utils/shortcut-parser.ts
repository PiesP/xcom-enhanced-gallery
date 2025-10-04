/**
 * 단축키 텍스트 파싱 유틸리티
 *
 * "이전 미디어 (←)" → { text: "이전 미디어 ", shortcuts: ["←"] }
 * "현재 파일 다운로드 (Ctrl+D)" → { text: "현재 파일 다운로드 ", shortcuts: ["Ctrl", "D"] }
 */

export interface ParsedShortcut {
  readonly text: string;
  readonly shortcuts: readonly string[];
}

/**
 * 괄호 안의 단축키를 파싱합니다
 *
 * 지원 형식:
 * - (키) - 단일 키
 * - (Ctrl+D) - 복합 키
 * - (Esc) - 단어 키
 */
export function parseShortcutText(fullText: string): ParsedShortcut {
  // 괄호로 감싸진 부분 찾기: (내용)
  const match = fullText.match(/^(.+?)\s*\(([^)]+)\)\s*$/);

  if (!match) {
    // 괄호가 없으면 전체 텍스트만 반환
    return { text: fullText, shortcuts: [] };
  }

  const [, text = '', shortcutStr = ''] = match;

  // + 또는 공백으로 구분된 키들 분리
  const shortcuts = shortcutStr
    .split(/[\s+]+/)
    .map(key => key.trim())
    .filter(key => key.length > 0);

  return {
    text: `${text.trim()} `,
    shortcuts,
  };
}
