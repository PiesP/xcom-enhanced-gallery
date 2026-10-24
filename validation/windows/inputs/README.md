# Optional Windows artifact fixture selector

To run only the built userscript settings-persistence fixture, create the ignored
`settings-persistence.json` file in this directory with this exact content:

```json
{"scenario":"settings-persistence"}
```

The shared VM controller packages this directory with the source-bound artifact.
Remove the selector after the attempt. The fixture intercepts GM storage and
localStorage on an owned X.com page. It does not install a userscript manager or
exercise extension storage.

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
