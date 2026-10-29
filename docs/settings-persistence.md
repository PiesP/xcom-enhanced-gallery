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

## Schema recognition and preservation

The recognized baseline formats are the legacy record with no `__schemaHash`
property and the current record with hash `"1"`. Existing legacy boolean and
known-field migrations remain supported. A present hash with any other value
(including a malformed identity) is unsupported; a mismatch does not establish
whether a record is newer or safe to migrate.

On encountering an unsupported identity, the repository validates known fields
for session use, preserves the original durable record and closes all settings
writes for that repository owner's lifetime. Initialization, field edits,
normalization and retry cannot replace it or create leaf writes. The existing
unsaved settings status remains visible; explicit edits work in the session and
remain pending across a same-document restart. Retry makes one bounded attempt
and remains unsaved. Use a compatible build or an explicit reviewed data migration
to recover; a fresh document/repository owner re-evaluates the durable format.
Another document replacing the baseline cannot reopen the existing owner.
Language has a separate key and remains independently writable.

Preserving only unknown properties while rewriting the record would assume their
meaning and compatibility. Allowing leaf writes beside an unsupported baseline
would also assume the unknown format still interprets those keys. Closing writes
is proportionate protection for a conditional rollback hazard: no released
incompatible producer is established. This policy does not add downgrade support,
a storage transaction, or atomic detection of a format change between a supported
read and a write in another document. The existing adapters provide no such
cross-document transaction.

## Language save outcomes

`LanguageService` owns `xeg-language` separately from gallery settings. Language
selection updates translations immediately. A rejected primary and fallback write
retains the latest language intent and activates the same unsaved status used by
gallery settings. The existing retry button gives each owner one explicit attempt;
a failure in either owner does not prevent the other from recovering. Repeated
denial keeps feedback visible without an automatic retry loop.

A successfully saved unchanged choice is deduplicated. An unchanged unsaved choice
can retry, and a newer selection supersedes earlier pending intent. Completion of
an older write cannot mark the newer selection saved. Pending intent survives
same-document language-service restart; a fresh document reads durable storage
and cannot recover unsaved memory. Successful primary and fallback writes retain
the existing envelope and fallback ordering.
