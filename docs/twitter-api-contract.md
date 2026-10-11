# Tweet media API contract

The gallery's lightweight metadata request uses `TweetResultByRestId`. The
operation/query ID is `zAz9764BcLZOJ0JU2wrd1A` in
`src/shared/core/twitter-api/endpoint.ts`. The complete variables, features,
field toggles, and request headers are maintained by
`src/shared/services/media/twitter-api-client.ts`. Do not update only the ID:
the URL's operation and feature set form one request contract.

The client accepts `data.tweetResult.result` as a direct `Tweet`, up to two
`TweetWithVisibilityResults` wrappers, or a bounded unavailable/tombstone
result. The requested numeric root tweet ID must match. A direct quote may
contribute media only when it has a distinct numeric tweet ID and user result.
Provider errors without usable tweet data are failures. A readable unavailable
tweet without provider errors is a healthy response with no media. Selection of
direct or quoted attachments happens after normalization for every click.

The sanitized response fixtures in `test/fixtures/quoted-video-tweet-response.ts`
and `test/fixtures/mixed-owner-video-response.ts` exercise the accepted direct,
quoted, and HLS-only shapes. Request and owner checks are in
`test/unit/shared/services/media/twitter-api-client.test.ts` and
`test/unit/shared/services/media-extraction/`.

Before changing the operation, capture current, authorized provider evidence
for the same account/context and a representative direct and quoted post. Check
the actual operation name, query ID, variables, feature toggles, response
wrappers, ownership IDs, and media variants. Sanitize it into minimal fixtures
without tokens, cookies, full responses, or private post text. Then update the
request builder, parser expectations, and installed-browser acceptance together.
An operation name copied from another project or a failed test branch alone
does not verify a replacement endpoint.

Successful normalized media is reused within one page service for at most five
seconds, four entries, 32 media items, and 64,000 serialized characters per
entry. At most eight simultaneous requests enter the coalescing map; a further
request is deferred until capacity is available. The cache holds neither raw GraphQL responses nor
binary media. Context changes and explicit refresh invalidate it. Failures,
empty or HLS-only responses, and cancelled requests are never cached. Cache reuse does not
establish live provider access; that requires a separate observed request.
