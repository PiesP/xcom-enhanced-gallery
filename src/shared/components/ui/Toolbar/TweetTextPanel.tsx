import { LucideIcon } from '@shared/components/ui/Icon/lucide/lucide-icons';
import type { JSXElement } from '@shared/external/vendors';
import { useTranslation } from '@shared/hooks/use-translation';
import { isUrlAllowed } from '@shared/utils/url/safety';
import styles from './Toolbar.module.css';

/**
 * Props for the TweetTextPanel component
 */
interface TweetTextPanelProps {
  readonly tweetText: string | undefined;
  readonly tweetTextHTML: string | undefined;
  readonly tweetUrl: string | undefined;
}

/**
 * Represents a tokenized segment of tweet text
 */
type TweetToken = {
  readonly type: 'text' | 'url' | 'hashtag';
  readonly value: string;
  readonly href?: string;
};

/**
 * URL safety policy for tweet text links
 */
const TWEET_TEXT_URL_POLICY = {
  allowedProtocols: new Set(['http:', 'https:']),
  allowRelative: false,
  allowProtocolRelative: false,
  allowFragments: false,
  allowDataUrls: false,
} as const satisfies Parameters<typeof isUrlAllowed>[1];

/**
 * Pattern to match URLs and hashtags in tweet text
 */
const LINK_PATTERN = /https?:\/\/[^\s]+|(?<![\p{L}\p{N}_])#[\p{L}\p{N}_]+/gu;

/**
 * Pattern to match trailing punctuation in URLs
 */
const URL_TRAILING_PUNCTUATION = /[),.!?:;\]]+$/;

/**
 * Pattern to match protocol prefix in URLs
 */
const PROTOCOL_PREFIX = /^https?:\/\//;

/**
 * Builds a Twitter/X.com hashtag URL
 * @param tag - Hashtag text without the # symbol
 * @returns Full URL to the hashtag page
 */
const buildHashtagUrl = (tag: string): string => `https://x.com/hashtag/${encodeURIComponent(tag)}`;

/**
 * Splits trailing punctuation from a URL
 * @param value - URL string that may contain trailing punctuation
 * @returns Object with separated url and trailing punctuation
 */
const splitUrlTrailingPunctuation = (value: string): { url: string; trailing: string } => {
  const match = value.match(URL_TRAILING_PUNCTUATION);
  if (!match) {
    return { url: value, trailing: '' };
  }

  const trailing = match[0] ?? '';
  const url = value.slice(0, Math.max(0, value.length - trailing.length));

  return { url, trailing };
};

/**
 * Tokenizes tweet text into structured segments (text, URLs, hashtags)
 * @param input - Raw tweet text
 * @returns Array of tokens representing different text segments
 */
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

/**
 * Normalizes and validates a tweet URL
 * @param value - Raw tweet URL string
 * @returns Validated URL string or null if invalid
 */
const normalizeTweetUrl = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!isUrlAllowed(trimmed, TWEET_TEXT_URL_POLICY)) return null;
  return trimmed;
};

/**
 * Formats a tweet URL for display by removing protocol prefix
 * @param url - Full URL string
 * @returns URL without http:// or https:// prefix
 */
const formatTweetUrlLabel = (url: string): string => url.replace(PROTOCOL_PREFIX, '');

/**
 * Renders tweet tokens as JSX elements with proper links
 * @param tokens - Array of tweet tokens
 * @returns JSX element array
 */
const renderTweetTokens = (tokens: readonly TweetToken[]): JSXElement => {
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

/**
 * Tweet URL link component
 * @param props - Component props
 * @returns JSX element
 */
function TweetUrlLink(props: { readonly url: string; readonly label: string }): JSXElement {
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
}

/**
 * TweetTextPanel component - Displays tweet text with parsed links and hashtags
 * @param props - Component props
 * @returns JSX element
 */
export function TweetTextPanel(props: TweetTextPanelProps): JSXElement {
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
