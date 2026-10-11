# ZIP input admission

ZIP planning records the input that a worker can actually use. A cached owned
Blob takes precedence over a provider. A provider with `supports(media)` is
selected only when that pure capability check succeeds; a provider without the
hook remains available to every media type for compatibility. The gallery's
image cache supports photos only, so video and GIF ZIP entries use their direct
URLs. Planning preserves selected order and source-derived filenames without
starting a fetch or creating a Blob.

The ZIP worker infers `owned-blob`, `blob-provider`, or `direct-url` from its
actual `blob` and `getBlob` fields. The optional `inputKind` label is diagnostic
and cannot reduce the worker's memory charge. An owned Blob retains its input
lease while the worker reserves a separate `arrayBuffer()` copy. A provider
needs that copy capacity plus room for its response; a direct URL does not
reserve the Blob-to-buffer copy. Every accepted entry also reserves filename,
header and directory overhead, a response/body allocation, and a future final
ZIP Blob copy. The worker checks known sizes before invoking the provider or
transport. `onEntryAdmission` exposes only the entry index, inferred input
kind, admitted response cap and optional known size for bounded diagnostics.

Unknown-size providers and direct responses take the full worker reservation
and are serialized so their whole responses cannot overlap. A provider that
**resolves** to `null` or `undefined` reports a cache miss and permits a direct
URL fetch within the same entry cap. A provider **rejection** retains its
error, including denied or rate-limited HTTP responses, resource limits and
cancellation; it does not start a second URL request. Cancellation stops queued
work and waits for active worker cleanup before ZIP storage is released. These
reservations account for application-owned binary bytes and overlapping copies,
not total browser heap or process memory; see [download binary ownership](download-memory.md).

## Optional follow-ups

Retrying only failed entries is deferred. A partial ZIP is already assembled
from successful entries; a retry must preserve the original selection and
filenames, keep successful entries available without charging or downloading
them twice, and distinguish a resolved cache miss from a failed request. It
also needs cancellation and partial-result ownership rules across a second
assembly. A new button alone would hide these byte and lifecycle decisions.

For a partial result, keep the saved archive, review its entry inventory and
the reported included/omitted counts, and save missing items individually from
the gallery. Wait for active saves before retrying or reloading. If the page
allowance remains exhausted with no active save, reload and select fewer items;
gallery close/reopen does not release userscript-owned downloads. The existing
failure list retains each failed selected URL and its error for the current
result; no persistent retry queue is added.

A streamed file sink is also deferred. The current extension path hands a
finished Blob URL to the native downloads API and releases its owner only
after a proven terminal download state. The userscript anchor has no terminal
observer and retains its Blob URL until page teardown. A direct file writer
would require a separate output and cleanup contract for each of those paths,
including picker cancellation, write failure and page/worker teardown. The
web `showSaveFilePicker()` API requires a secure context and transient user
activation and has
[limited browser availability](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker);
`createWritable()` is tied to a permitted file handle and its own
[write/close lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable).
Firefox and userscript support therefore need explicit runtime evidence
before a file sink can replace the current save behavior.

An optional sink would open the picker directly from the user's save action,
suggest the planned ZIP filename, and leave existing-file and overwrite consent
to that interaction. A canceled picker would end the operation without a native
save fallback. It would await each write for backpressure, retain each input
lease until its corresponding write settles, and emit the central directory
and end record before closing. The writable stream's successful close is the
commit boundary; writes alone do not prove that the target file changed. Abort,
write/close failure and teardown would require owned stream cleanup and an
explicit partial-output result, without deleting an unrelated user file.

Adoption requires a measured workload that repeatedly exceeds the retained
archive allowance, verified picker access in each intended execution context,
and a tested writer/output-ownership contract with cancellation and close
failures. Small bounded fixtures establish the current admission correction;
they do not demonstrate a need for this separate output architecture. Retain
the stored-entry writer and serialized unknown-size admission until such
evidence justifies another approved change.
