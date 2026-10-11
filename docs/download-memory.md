# Download binary ownership

The page realm shares one 512 MiB admission ledger across single downloads,
ZIP workers, demand-driven media cache entries and outstanding Blob handoffs.
The canonical limit and ownership primitives are in
[`live-byte-budget.ts`](../src/shared/services/download/live-byte-budget.ts).
Destroying or reinitializing a gallery service does not reset that ledger.

The ledger conservatively reserves application-owned binary storage and
overlapping copies. It does not measure browser heap or process RSS. Browser
transport buffers, allocator overhead, garbage collection and OS-managed
download storage cannot be measured or controlled by this ledger.
A response chunk rejected on arrival is not accepted into retained storage.

| Stage | Admission and ownership |
| --- | --- |
| HTTP binary response | Reserve twice the admitted response cap before dispatch, for accepted chunks plus the output snapshot/consolidation. Clamp the response cap to currently available capacity. Keep the transport owner through actual transport settlement, even if the caller aborts earlier. |
| Bounded response reader | Check declared length before consumption and actual accumulated bytes on every chunk. Blob responses use accepted chunks directly; array buffers still reserve their distinct contiguous output. |
| Media cache | One fetch and backing allocation per entry. Cache and borrowers hold independent reference-counted leases. Eviction drops the cache owner, while active borrowers and late transports remain charged. |
| ZIP entry | Admit filename/header/directory scratch, body storage and future final-Blob copy capacity before fetching or copying. Unknown responses use serialized worker admission. Committed entry data stays charged after the worker finishes. |
| ZIP finalization | Directory/EOCD and Blob-copy capacity were reserved before reading entries. `createBlob()` transfers ownership and clears writer/part arrays. `dispose()` drops an untransferred result. Source part/scratch leases are released after the snapshot and array clear. Only the final Blob size remains charged through its URL lifetime. |
| MV3 Blob URL | The adapter owns the URL and release callback independently of the caller Promise. Release after native `complete`/`interrupted` or a proven never-started outcome, plus the cleanup delay. Exact-URL status queries recover the relationship after a worker restart. Empty, failed or mismatched searches remain unknown. |
| MV3 direct single | A validated media URL is handed once to the browser downloads API. The page does not fetch or reserve a whole binary response. The worker waits for `complete` or `interrupted`; an allocated ID alone is not success. A bounded request record keeps the originating tab, URL digest, native ID, cancellation intent and a short terminal result, without storing the media URL or request headers. |
| Userscript anchor | An anchor click has no native completion observer. Its Blob URL and owner remain until genuine page teardown; synthetic lifecycle events and entering the back/forward cache do not release them. This preserves the existing filename behavior. |

`OwnedBlob` input promises and providers must reserve storage before starting
their producer. A cached input keeps its own lease; ZIP workers borrow it and
reserve the separate `arrayBuffer()` copy. Releasing a lease means its owner
has stopped using that backing storage. Sharing an existing lease does not
charge the same backing allocation twice.

Download caching and ZIP planning use the preferred save URL from the
[media source policy](media-sources.md), rather than the observed display URL.
An unverified original photo fails before provider dispatch or entry admission;
it never falls back to the displayed thumbnail. Mixed original-source and
resource-limit failures retain both causes in the user guidance.

Per-response, entry and serialized-archive limits are additional ceilings.
The effective admitted size can be lower when another operation or cache owns
part of the page budget. The ledger deliberately rejects admission instead of
waiting indefinitely for memory retained by the same archive. Resource-limit
errors do not retry or start an alternate whole-body download. A resource-limit
partial ZIP reports the exact successful/failed counts and retains the resource-limit
code; an archive with no accepted files is a failure.

For ordinary completed extension Blob downloads, terminal observation returns
the reservation and permits subsequent downloads in the same page. A direct
single never acquired that reservation. An unknown Blob handoff, a userscript
anchor, or an opaque transport that never reports a terminal callback retains
its reservation conservatively for the page lifetime.

Direct single downloads reconcile a lost worker reply by the original request
ID, owner tab, URL digest and assigned browser ID. A matching native `complete`
is success; `interrupted` is failure. A confirmed active transfer keeps the
gallery operation pending and cancellable while the adapter checks the same
request, up to the five-minute download timeout. A response with no confirmed
active state remains unknown after the initial bounded checks. If the active
transfer becomes unobservable before a terminal result, the timeout requests
cancellation of the original ID, reports unknown and retains a bounded
cancellation handoff; it cannot prove that a
retry is safe. A restart before the ID was persisted cannot recover ownership
from a URL search, even if one matching URL appears in browser history. The same URL
could belong to another request or tab. While the originating worker is still
awaiting a native ID, the pending record is protected from TTL pruning; a new
worker has no such live allocation and eventually expires the unassigned record.
No automatic Blob replacement is enabled:
there is currently no demonstrated compatibility error category that proves a
replacement is safe. Browser-managed redirects and safety prompts remain under
browser control; the initial media URL validation does not prove the final URL.
The [browser downloads API](https://developer.chrome.com/docs/extensions/reference/api/downloads)
defines a persistent ID, an initial `url`, a separate `finalUrl`, and lifecycle
states. Worker memory can disappear between events, so the relationship lives in
extension storage as described by the
[service-worker lifecycle guidance](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle).

| Direct attempt outcome | Reported result | Replacement |
| --- | --- | --- |
| Invalid media URL or sender; user cancellation | Reject or cancel the original request | None |
| Browser rejects before assigning an ID | Known never started | None until a specific compatibility route is demonstrated |
| Assigned ID reaches `complete` | Success for that browser download | None |
| Assigned ID reaches `interrupted` | Failure, with cancellation distinguished from browser interruption | None |
| Lost reply with confirmed active transfer | Keep pending until terminal state, cancellation or timeout; retain the same request identity | None |
| Failed search or restart before ID persistence | Unknown after bounded checks or timeout; retain request identity and bounded cancellation handoff | None |
| Supplied or generated Blob, including ZIP output | Existing bounded Blob URL ownership | Not a direct URL attempt |

If admission fails, wait for active downloads to finish. If none are active and
the limit remains, reload the page to release conservative page-lifetime holds,
then retry fewer files. Reloading while a native download still reads a
page-owned Blob URL can interrupt it. The ledger does not infer terminal status
from elapsed time.

The allowance is shared by the whole page, not granted separately to each file.
Closing and reopening the gallery does not release userscript anchor ownership.
Wait for the browser to finish active saves before reloading or closing the page.

Regression tests use small injected `LiveByteBudget` instances and the production
reader, writer, HTTP service and download adapters. Installed Edge acceptance
must separately verify routed fixture rejection, direct single and ZIP file bytes
and subsequent recovery; it cannot establish browser heap/RSS measurements.
