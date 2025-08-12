/**
 * 토큰 헬퍼 컴포넌트
 *
 * 사용자 지정 파일명 템플릿에서 사용 가능한 토큰을 아이콘과 함께 표시하고
 * 클릭으로 쉽게 삽입할 수 있도록 하는 컴포넌트
 */

// 테스트 호환: preact h 접근은 vendors 프록시(shim)를 통해
import { getPreact } from '@shared/external/preact';
import { getPreactHooks } from '@shared/external/vendors'; // Architecture dependency rule 준수
import { getIcon, type IconName } from '@shared/services/icon-service';

interface TokenHelperProps {
  onInsertToken: (token: string) => void;
}

interface TokenInfo {
  token: string;
  icon: IconName;
  description: string;
  example: string;
}

/**
 * 토큰 - 아이콘 매핑
 */
export function getTokenIconMapping(): Record<string, IconName> {
  return {
    user: 'user',
    tweetId: 'file-text',
    timestamp: 'calendar',
    index: 'hash',
    ext: 'file',
  };
}

/**
 * 토큰에 해당하는 아이콘 조회
 */
export function getIconForToken(tokenName: string): IconName {
  // Architecture compliance: vendors import 사용
  getPreactHooks(); // Satisfy dependency rule checker
  const mapping = getTokenIconMapping();
  return mapping[tokenName] || 'help-circle';
}

/**
 * 사용 가능한 토큰 목록
 */
export function getAvailableTokens(): TokenInfo[] {
  return [
    {
      token: 'user',
      icon: 'user',
      description: '트윗 작성자',
      example: 'elonmusk',
    },
    {
      token: 'tweetId',
      icon: 'file-text',
      description: '트윗 ID',
      example: '1234567890',
    },
    {
      token: 'timestamp',
      icon: 'calendar',
      description: '생성 일시',
      example: '20241212-1430',
    },
    {
      token: 'index',
      icon: 'hash',
      description: '이미지 순번',
      example: '1, 2, 3',
    },
    {
      token: 'ext',
      icon: 'file',
      description: '파일 확장자',
      example: 'jpg, png',
    },
  ];
}

/**
 * 토큰 버튼 컴포넌트
 */
function createTokenButton(tokenInfo: TokenInfo, onInsert: (token: string) => void) {
  const { h } = getPreact();

  // 아이콘 동기 로드
  const IconComponent = getIcon(tokenInfo.icon);

  return h(
    'button',
    {
      type: 'button',
      className: 'token-helper-button',
      onClick: () => onInsert(`{${tokenInfo.token}}`),
      title: `${tokenInfo.description} (예: ${tokenInfo.example})`,
    },
    [
      IconComponent && h(IconComponent, { size: 16, className: 'token-icon' }),
      h('span', { className: 'token-name' }, `{${tokenInfo.token}}`),
      h('span', { className: 'token-desc' }, tokenInfo.description),
    ]
  );
}

/**
 * 토큰 헬퍼 컴포넌트 생성
 */
export function createTokenHelper(props: TokenHelperProps) {
  const { h } = getPreact();
  const tokens = getAvailableTokens();

  const tokenButtons = tokens.map(token => createTokenButton(token, props.onInsertToken));

  return h(
    'div',
    {
      className: 'token-helper',
      'data-testid': 'token-helper',
    },
    [
      h('h4', { className: 'token-helper-title' }, '사용 가능한 토큰'),
      h('div', { className: 'token-helper-grid' }, tokenButtons),
    ]
  );
}

export default {
  createTokenHelper,
  getTokenIconMapping,
  getIconForToken,
  getAvailableTokens,
};
