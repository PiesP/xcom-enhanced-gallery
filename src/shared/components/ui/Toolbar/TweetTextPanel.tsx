import { getLanguageService } from "@shared/container/service-accessors";
import type { JSXElement } from "@shared/external/vendors";
import { getSolid } from "@shared/external/vendors";
import { formatTweetText, shortenUrl } from "@shared/utils/text/formatting";
import { sanitizeHTML } from "@shared/utils/text/html-sanitizer";
import styles from "./Toolbar.module.css";

const solid = getSolid();
const { For, Switch, Match } = solid;

interface TweetTextPanelProps {
  tweetText: string | undefined;
  tweetTextHTML: string | undefined;
}

type TweetAnchorKind = "url" | "mention" | "hashtag" | "cashtag";
type TweetTokenAccessor = () => { content: string; href: string };

function renderTweetAnchor(
  accessor: TweetTokenAccessor,
  kind: TweetAnchorKind,
  displayText?: string,
): JSXElement {
  const token = accessor();

  return (
    <a
      href={token.href}
      target="_blank"
      rel="noopener noreferrer"
      class={styles.tweetLink}
      data-kind={kind}
      onClick={(e) => e.stopPropagation()}
    >
      {displayText ?? token.content}
    </a>
  );
}

export default function TweetTextPanel(props: TweetTextPanelProps) {
  return (
    <div class={styles.tweetPanelBody}>
      <div class={styles.tweetTextHeader}>
        <span class={styles.tweetTextLabel}>
          {getLanguageService().translate("toolbar.tweetText") || "Tweet text"}
        </span>
      </div>
      <div
        class={styles.tweetContent}
        data-gallery-element="tweet-content"
        data-gallery-scrollable="true"
      >
        {props.tweetTextHTML ? (
          /*
            Security Note: tweetTextHTML is sanitized via @shared/utils/html-sanitizer
            before being passed here. It only allows safe tags (a, span, etc.) and attributes.
            Links are checked for safe protocols (http/https) and target="_blank" is secured.
            Double-sanitization here ensures safety even if the prop source changes.
          */
          <div innerHTML={sanitizeHTML(props.tweetTextHTML)} />
        ) : (
          <For each={formatTweetText(props.tweetText ?? "")}>
            {(token) => (
              <Switch>
                <Match when={token.type === "link" && token}>
                  {(linkToken) =>
                    renderTweetAnchor(
                      linkToken,
                      "url",
                      shortenUrl(linkToken().content, 40),
                    )
                  }
                </Match>
                <Match when={token.type === "mention" && token}>
                  {(mentionToken) => renderTweetAnchor(mentionToken, "mention")}
                </Match>
                <Match when={token.type === "hashtag" && token}>
                  {(hashtagToken) => renderTweetAnchor(hashtagToken, "hashtag")}
                </Match>
                <Match when={token.type === "cashtag" && token}>
                  {(cashtagToken) => renderTweetAnchor(cashtagToken, "cashtag")}
                </Match>
                <Match when={token.type === "break"}>
                  <br />
                </Match>
                <Match when={token.type === "text" && token}>
                  {(textToken) => <span>{textToken().content}</span>}
                </Match>
              </Switch>
            )}
          </For>
        )}
      </div>
    </div>
  );
}
