import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import styles from './Toolbar.module.css';

interface TweetTextPanelProps {
  tweetText: string | undefined;
  tweetTextHTML: string | undefined;
}

export default function TweetTextPanel(props: TweetTextPanelProps): JSXElement {
  const label = getLanguageService().translate('toolbar.tweetText') || 'Tweet text';

  return (
    <div class={styles.tweetPanelBody}>
      <div class={styles.tweetTextHeader}>
        <span class={styles.tweetTextLabel}>{label}</span>
      </div>
      <div
        class={styles.tweetContent}
        data-gallery-element="tweet-content"
        data-gallery-scrollable="true"
      >
        {props.tweetTextHTML ? (
          // tweetTextHTML is sanitized during extraction.
          <div innerHTML={props.tweetTextHTML} />
        ) : (
          <span>{props.tweetText ?? ''}</span>
        )}
      </div>
    </div>
  );
}
