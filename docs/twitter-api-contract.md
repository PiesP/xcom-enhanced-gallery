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

An absent or unsupported result envelope, unexpected wrapper, conflicting root
IDs, or a root belonging to a different tweet is an invalid provider response.
An explicit null result and known unavailable/tombstone roots remain healthy
absence outcomes. An invalid response fails the physical request once,
including when several clicks share that request, and never enters the
metadata cache. A valid requested root may still yield a healthy request with
no media, HLS-only media, or media that does not match the clicked source; those
outcomes fail local selection without counting as provider outages. Three
consecutive failed physical provider requests open the existing 60-second API circuit.
Local response-capacity rejections do not count as provider failures or apply
server retry guidance. They are not retried or cached.
Cancelled or stale requests and cache hits do not change that failure history.

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

## Displayed quote levels and media ownership

A displayed chain A → B → C does not expand a request into a recursive quote
walk. An A request includes direct B before A and excludes C. A B request includes
direct C before B. When the clicked thumbnail or its overlapping status link
explicitly establishes C as the owner, the gallery requests C directly and
selects the clicked source within C's normalized media. C is never relabeled as
A's direct quote. Missing or contradictory ownership continues to fail local
selection; a nearby credit link alone does not authorize another quote level.

Video click context checks up to 24 ancestors for an enclosing quote or clickable
boundary and stops at the nearest article. A boundary without an owner permalink
remains unconfirmed until a unique exact media identity matches the requested
post or its verified direct quote. Missing or shared identity cannot select an
attachment. Native controls follow the saved video-click policy.

Finding a photo inside a quote does not make its surrounding text, post links
or padding a media action. Those clicks retain the host's native navigation.
The photo and its overlapping media link remain gallery targets, including
keyboard activation of the media link.

Media deduplication includes the actual owning tweet ID as well as media type
and normalized source. Repeated copies within one owner still collapse, while
B and C retain separate entries when they reuse a source. Their selected index,
author, caption, permalink and download filename remain tied to their own post.
This changes neither API traversal nor metadata-cache admission limits.

DOM recovery collects only media with the requested owner. Its caption is used
only when one tweet-text node has that same verified owner. An absent,
ambiguous or conflicting caption is omitted rather than borrowed from the
enclosing article. A compact C thumbnail can therefore recover its observed
source without claiming B's text or a complete API attachment list. A visible
gallery after an API denial is partial recovery, not successful provider
verification.

The compact quote fixture is synthetic markup derived from the observed nested
article, inner quote region and same-status overlay layout. Production-pipeline
tests retain controls for independent B selection, same-source owners, non-first
C photos, native status headers and unavailable API recovery. Installed-fixture
and unchanged live-page observations remain separate evidence.

## Text and response admission

`twitter-response-parser.ts` removes only complete whitespace-delimited media
URL tokens, using a single token scan and a deduplicated URL set. Adjacent
punctuation, literal URL characters, Unicode and the existing whitespace
normalization are preserved. Legacy, note and direct-quote text use the same
normalizer without truncation. X's [English post documentation](https://help.x.com/en/using-x/types-of-posts)
describes longer posts with up to 25,000 characters; this is a content constraint,
not a GraphQL response-byte guarantee.

`MAX_METADATA_RESPONSE_BYTES` in `twitter-api-client.ts` defines the finite
capacity for one root/direct-quote response. Its 2 MiB allowance accommodates two
full notes (up to approximately 600,000 escaped bytes for 25,000 Unicode code points each)
plus user records, entities, media variants and envelopes. Ordinary, mixed-owner
and full multilingual note/quote fixtures exercise compatibility. Unexpected
provider expansions can still exceed this product policy and fail with a
localized capacity message; text is never silently truncated.

The MV3 adapter counts actual streamed bytes before decoding and JSON parsing.
`Content-Length` can reject early but cannot authorize an oversized actual body.
The GM adapter requests `arraybuffer` for bounded JSON, measures the native
buffer before decoding/parsing, and rejects a manager returning another type.
Progress can stop a transfer early; missing or late progress still leaves the
callback byte gate in place. There is no fallback to manager-parsed JSON.

[Tampermonkey](https://www.tampermonkey.net/documentation.php?ext=d2&q=GM_xmlhttpRequest)
and [Violentmonkey](https://violentmonkey.github.io/api/gm/) document binary
response types, but control their own network buffering. The application gate
does not bound those manager allocations, decompression buffers, parsed-object
expansion or total browser memory. Cache admission remains a separate bound.
