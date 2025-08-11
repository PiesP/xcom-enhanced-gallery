/**
 * 토큰 헬퍼 컴포넌트
 *
 * 사용자 지정 파일명 템플릿에서 사용 가능한 토큰을 아이콘과 함께 표시하고
 * 클릭으로 쉽게 삽입할 수 있도록 하는 컴포넌트
 */

import { createScopedLogger } from '@shared/logging';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { getIcon, type IconName, type IconComponent } from '@shared/services/icon-service';

const logger = createScopedLogger('TokenHelper');

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
export async function getIconForToken(tokenName: string): Promise<IconName> {
  const mapping = getTokenIconMapping();
  return mapping[tokenName] || 'help-circle';
}

/**
 * 사용 가능한 토큰 목록
 */
function getAvailableTokens(): TokenInfo[] {
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
async function createTokenButton(tokenInfo: TokenInfo, onInsert: (token: string) => void) {
  const { h } = getPreact();
  const { useState } = getPreactHooks();

  const [IconComponent, setIconComponent] = useState<IconComponent | null>(null);

  // 아이콘 비동기 로드
  try {
    const icon = await getIcon(tokenInfo.icon);
    setIconComponent(() => icon);
  } catch (error) {
    logger.warn(`Failed to load icon for token ${tokenInfo.token}:`, error);
  }

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
export async function createTokenHelper(props: TokenHelperProps) {
  const { h } = getPreact();
  const tokens = getAvailableTokens();

  const tokenButtons = await Promise.all(
    tokens.map(token => createTokenButton(token, props.onInsertToken))
  );

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
