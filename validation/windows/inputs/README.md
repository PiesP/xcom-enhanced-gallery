# Optional Windows artifact fixture selector

For explicit installed-extension acceptance on public X statuses, create the
ignored `live-acceptance.json` file here with exactly:

```json
{"scenario":"actual-site-acceptance"}
```

Pass up to three public `--live-url` status URLs: a two-to-four-image post, a
mixed image/video post for actual video navigation, and an image post with an
existing preceding status link for the post-close same-document navigation probe. The normal
installed fixture still runs first.
This selector enables bounded real toolbar downloads and settings changes only
in the task-owned profile; failed receipts are retained outside Git. Remove the
selector after the attempt. See `../README.md` for evidence and byte limits.

To run only the built userscript settings-persistence fixture, create the ignored
`settings-persistence.json` file in this directory with this exact content:

```json
{"scenario":"settings-persistence"}
```

The shared VM controller packages this directory with the source-bound artifact.
Remove the selector after the attempt. The artifact fixture intercepts GM
storage and localStorage on an owned X.com page and exercises language denial/retry/reload plus schema preservation. With
`--installation extension`, the same selector runs a focused installed-package
fixture for healthy language persistence/reload and unsupported-schema session
edits/retry/raw preservation. The installed fixture uses real extension storage;
controlled write denial remains an artifact-fixture boundary. Neither mode
establishes live X.com behavior or a userscript-manager installation.

To run only the issue #381 opening-feedback fixture with the installed
Chrome/Edge extension, create the ignored `opening-feedback.json` file here:

```json
{"scenario":"opening-feedback"}
```

Run the VM browser validation with `--installation extension`. The fixture holds
the real provider response for five seconds, records the rendered pending state
and host playback, then checks fast opening, later A completion or failure after
B opens, navigation, and failure recovery. The result is a controlled installed
extension observation; it does not establish live X.com behavior. Remove this
selector after the attempt.

To run only the issue #383 gallery experience baseline in the installed
Chrome/Edge extension, create the ignored `gallery-experience.json` file:

```json
{"scenario":"gallery-experience"}
```

Run the VM browser validation with `--installation extension`. The focused
receipt `gallery-experience.json` separates toolbar keyboard and native save
actions (X02), native host video controls across click modes (X05), and mixed
aspect ratio layout with actual 200% browser tab zoom (X06). The page and media
are deterministic owned fixtures; the observations do not claim live X.com
behavior or a human study. Remove the selector after the attempt.

To run only the issue #382 media and download recovery baseline in the installed
Chrome/Edge extension, create the ignored `media-download-recovery.json` file:

```json
{"scenario":"media-download-recovery"}
```

The focused run uses the three-item source-quality fixture. It records a
one-response display failure, persistent display failures, denied verified
originals, a partial ZIP after an injected byte limit, and a complete ZIP
failure followed by healthy acquisition. Native extension notifications are
suppressed only inside this owned run, so the retained screenshots show what
remains on the page after five seconds. ZIPs are checked against the fixture's
independent entry list and copied into the evidence directory. Remove the
selector after the attempt.

To run only the issue #392 failed-entry ZIP acceptance in the installed Edge
extension, create the ignored `failed-entry-recovery.json` file here:

```json
{"scenario":"failed-entry-recovery"}
```

Run with `--installation extension`. The installed package's gallery saves a
partial ZIP after one bounded fixture response denial. Its visible recovery
button then encounters HTTP 503 and resource-limit failures before native saving;
both explicit failures must retain recovery without a new native download.
The third explicit attempt saves only the omitted item in `-missing-3.zip`. The receipt
checks native download IDs, saved file identity, entry order, CRC, bytes, hashes,
request count, result dismissal, session reopening, and exact cleanup. Retain
failed receipts outside Git and remove the selector after the attempt.

For a focused current-X language/theme check, use the existing ignored
`live-acceptance.json` with exactly:

```json
{"scenario":"actual-site-settings-acceptance"}
```

Run with extension installation and one to three unchanged, currently qualified
public image status URLs. This selector exercises only the affected settings
fixture followed by language/theme selection, durable and fresh-document readback,
and exact prior preference restoration on X. It does not run the previous full
live download, keyboard, video or site-navigation campaign. Login, consent and
challenge prerequisites remain untouched; a missing prerequisite is blocked.
