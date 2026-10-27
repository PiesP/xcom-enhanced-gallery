# Settings persistence contract

Gallery settings use the existing `xeg-app-settings` record as their legacy
baseline. The canonical leaf list is
[`SETTINGS_LEAF_KEYS`](../src/features/settings/services/settings-validation.ts).
New edits are stored under `xeg-app-settings:field:<group>.<name>`;
each key contains the usual persistent-storage envelope. A load validates the
baseline and overlays valid field values. A verified missing record starts from
defaults. Legacy migration and normalization still apply to the baseline, but
normalization never writes a snapshot derived from an unavailable read. The
[`loadState` and `saveChanges` methods](../src/features/settings/services/settings-repository.ts)
own composition and field writes; [`getState`](../src/shared/services/persistent-storage.ts)
reports whether both storage layers were readable.

An edit records only the leaves the caller changed, including differences in a
parent-object setter. Before writing, the repository must read the baseline and
all field keys successfully. A failed primary or fallback read leaves explicit
edits in memory with unsaved feedback; a readable fallback alone does not prove
that an inaccessible primary has no newer value. Retry re-reads and writes only
pending leaves. If no edit was made, retry just reloads the recovered settings
and notifies listeners, including the theme owner. Pending edits survive a
same-document service restart after queued work settles. A document reload
creates a new service, so its unsaved in-memory edits do not survive.

Independent documents writing different leaves cannot replace one another's
leaves, even if their writes overlap or storage-change notifications are late.
For the same leaf, the effective value follows the existing primary/fallback
envelope selection: a fallback with a strictly newer timestamp wins; a tie
selects primary. The repository reads each written leaf back and reports the
edit saved only if that immediate read returns the requested value with both
stores readable. A conflicting or unreadable readback leaves the edit pending
and unsaved for retry. This is an observation at readback, not an atomic
compare-and-swap or a promise that a later competing write cannot replace it.

Keeping a single full-record writer and adding a document-local queue would
still lose edits from independently initialized documents. Reading the whole
record immediately before a full-record write would fix sequential stale
snapshots but still race overlapping read-modify-write cycles. The adapters do
not provide a cross-document transaction, so individual durable leaf keys
provide the narrowest independent-write boundary without a new coordinator.

Older builds read only the legacy record and will not display edits stored in
field keys. Returning to this version restores those edits while the field
keys remain. There is no built-in export or downgrade migration for this
representation. To retain effective preferences in an older build, back up
the raw baseline and field keys, explicitly compose and validate their values
into an older-build-compatible legacy record, and verify that record with the
target build. Reverting source alone is not a data rollback.
