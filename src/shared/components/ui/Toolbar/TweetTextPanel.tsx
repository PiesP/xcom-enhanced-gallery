import { LucideIcon } from '@shared/components/ui/Icon/lucide/lucide-icons';
import type { JSXElement } from '@shared/external/vendors';
import { useTranslation } from '@shared/hooks/use-translation';
import { isUrlAllowed } from '@shared/utils/url/safety';
import styles from './Toolbar.module.css';

interface TweetTextPanelProps {
  tweetText: string | undefined;
  tweetTextHTML: string | undefined;
  tweetUrl: string | undefined;
}

type TweetToken = {
  readonly type: 'text' | 'url' | 'hashtag';
  readonly value: string;
  readonly href?: string;
};

const TWEET_TEXT_URL_POLICY = {
  allowedProtocols: new Set(['http:', 'https:']),
  allowRelative: false,
  allowProtocolRelative: false,
  allowFragments: false,
  allowDataUrls: false,
} satisfies Parameters<typeof isUrlAllowed>[1];

const LINK_PATTERN = /https?:\/\/[^\s]+|(?<![\p{L}\p{N}_])#[\p{L}\p{N}_]+/gu;
const URL_TRAILING_PUNCTUATION = /[),.!?:;\]]+$/;
const PROTOCOL_PREFIX = /^https?:\/\//;

const buildHashtagUrl = (tag: string): string => `https://x.com/hashtag/${encodeURIComponent(tag)}`;

const splitUrlTrailingPunctuation = (value: string): { url: string; trailing: string } => {
  const match = value.match(URL_TRAILING_PUNCTUATION);
  if (!match) {
    return { url: value, trailing: '' };
  }

  const trailing = match[0] ?? '';
  const url = value.slice(0, Math.max(0, value.length - trailing.length));

  return { url, trailing };
};

const tokenizeTweetText = (input: string): TweetToken[] => {
  const tokens: TweetToken[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(LINK_PATTERN)) {
    const startIndex = match.index ?? 0;
    const rawMatch = match[0] ?? '';

    if (startIndex > lastIndex) {
      tokens.push({ type: 'text', value: input.slice(lastIndex, startIndex) });
    }

    if (rawMatch.startsWith('http://') || rawMatch.startsWith('https://')) {
      const { url, trailing } = splitUrlTrailingPunctuation(rawMatch);
      if (url && isUrlAllowed(url, TWEET_TEXT_URL_POLICY)) {
        tokens.push({ type: 'url', value: url, href: url });
        if (trailing) {
          tokens.push({ type: 'text', value: trailing });
        }
      } else {
        tokens.push({ type: 'text', value: rawMatch });
      }
    } else if (rawMatch.startsWith('#')) {
      const tag = rawMatch.slice(1);
      if (tag) {
        tokens.push({ type: 'hashtag', value: rawMatch, href: buildHashtagUrl(tag) });
      } else {
        tokens.push({ type: 'text', value: rawMatch });
      }
    } else {
      tokens.push({ type: 'text', value: rawMatch });
    }

    lastIndex = startIndex + rawMatch.length;
  }

  if (lastIndex < input.length) {
    tokens.push({ type: 'text', value: input.slice(lastIndex) });
  }

  return tokens;
};

const normalizeTweetUrl = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!isUrlAllowed(trimmed, TWEET_TEXT_URL_POLICY)) return null;
  return trimmed;
};

const formatTweetUrlLabel = (url: string): string => url.replace(PROTOCOL_PREFIX, '');

const renderTweetTokens = (tokens: TweetToken[]): JSXElement => {
  return tokens.map((token) => {
    if ((token.type === 'url' || token.type === 'hashtag') && token.href) {
      return (
        <a href={token.href} target="_blank" rel="noopener noreferrer">
          {token.value}
        </a>
      );
    }
    return token.value;
  });
};

const TweetUrlLink = (props: { url: string; label: string }): JSXElement => {
  const translate = useTranslation();

  return (
    <div class={styles.tweetUrlSection}>
      <a href={props.url} target="_blank" rel="noopener noreferrer" class={styles.tweetUrlLink}>
        <LucideIcon name="external-link" size={14} class={styles.tweetUrlIcon} />
        <span class={styles.tweetUrlLabel}>{translate('tb.twUrl')}</span>
        <span class={styles.tweetUrlValue}>{props.label}</span>
      </a>
    </div>
  );
};

export default function TweetTextPanel(props: TweetTextPanelProps): JSXElement {
  const translate = useTranslation();
  const tweetText = props.tweetTextHTML ?? props.tweetText ?? '';
  const tokens = tweetText ? tokenizeTweetText(tweetText) : [];
  const safeTweetUrl = normalizeTweetUrl(props.tweetUrl);
  const tweetUrlLabel = safeTweetUrl ? formatTweetUrlLabel(safeTweetUrl) : '';

  return (
    <div class={styles.tweetPanelBody}>
      <div class={styles.tweetTextHeader}>
        <span class={styles.tweetTextLabel}>{translate('tb.twTxt')}</span>
      </div>
      <div class={styles.tweetContent} data-gallery-scrollable="true">
        {safeTweetUrl && <TweetUrlLink url={safeTweetUrl} label={tweetUrlLabel} />}
        {safeTweetUrl && tokens.length > 0 && <div class={styles.tweetUrlDivider} />}
        <span>{renderTweetTokens(tokens)}</span>
      </div>
    </div>
  );
}
