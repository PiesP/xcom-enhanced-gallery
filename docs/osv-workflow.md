# OSV workflow ownership and validation

`.github/workflows/security.yaml` runs the `consumer` profile of the pinned
`PiesP/browser-core/automation/actions/prepare-osv` action. The action copies
its fixed TypeScript helper closure to a private runner directory. The
`packages/core` gitlink remains the product runtime dependency and does not
provide the security workflow helper. The scanner image is resolved independently
from the reviewed tool-metadata source by the `pin-metadata` job; failed metadata
preparation fails both OSV jobs even when the changed-path scan would be skipped.

The PR diff and full scanners publish distinct job names. `pr-gate/osv / osv-scan`
is the sole stable OSV decision: it requires successful classification and pin
resolution, a digest-pinned image, success from the event-selected scanner, and
an expected skip from the alternate scanner. A valid unaffected-path route is
an explicit no-op in the selected job. The required `Security scan summary`
also requires successful CodeQL and Semgrep jobs, valid routing outputs, and
reviewed scanner images. CodeQL job success means analysis completed for the
selected languages; it does not assert that the alert inventory is empty.

For pull requests, the workflow checks out the target history, switches to the
trusted PR base, initializes that base's submodule, sets up Node without a
dependency install, and prepares the helper. It scans the base, restores the
target and its submodule, scans the target, then reports introduced findings.
For merge groups, the Node setup and helper preparation use the merge-group
base manifest before restoring the target for a full scan. Push, schedule, and
manual runs verify the checked-out SHA against the event SHA before setup.
The helper remains in private runner storage across the target checkout.

The retired consumer Python validator and workflow execution fixtures map to
the provider's tests as follows. The provider tests exercise the real CLI with
fake Docker; this repository's `osv-workflow-composition.test.ts` exercises the
actual workflow wiring, conditions, trust order, helper output path, and CLI
modes without loading code from another checkout.

| Retired consumer coverage | Provider fixture coverage |
| --- | --- |
| Valid findings, nullable aliases, vulnerability summaries, and unknown metadata are preserved | `test/scripts/osv-validator.test.ts`: `preserves consumer findings with nullable aliases and unknown metadata`, `preserves unknown metadata integer lexemes exactly` |
| Malformed JSON, duplicate keys, non-finite values, overflowing numbers, missing or wrong-shaped results, and stale output removal | `test/scripts/osv-validator.test.ts`: strict JSON parser cases and `removes stale output on invalid input`, including the retired exact invalid-result shape |
| Missing source, invalid package fields, missing vulnerability ID, invalid groups and aliases | `test/scripts/osv-validator.test.ts`: consumer schema, malformed nested package records, and exact retired shapes in `removes stale output on invalid input` |
| Input/output same-path and hardlink alias protection | `test/scripts/osv-validator.test.ts`: same, relative, hardlink, symlink, and parent-symlink alias matrix |
| Trusted validator materialization at PR base and merge-group base | `test/scripts/prepare-osv-helper.test.ts`: fixed private closure, byte equality, symlink rejection, partial-copy cleanup; local composition test checks base-before-action order |
| Scanner status 0 or 1, stale raw/normalized output, missing or malformed raw output, reporter parse diagnostics, and nonzero or signaled Docker | `test/scripts/consumer-workflow.test.ts`: scan mode argv, stale output, scanner/raw-reporter failures, parse diagnostics, signal propagation, and log replacement |
| PR diff and full reporter argv, valid SARIF, vulnerability exit 1, malformed SARIF, reporter failures, and upload authorization | `test/scripts/consumer-workflow.test.ts`: report-pr/report-full argv, SARIF and status cases, invalid inputs, output-write failure, and replaced-log cases; local composition test checks upload condition |

The retired workflow test also had optional real-container reporter cases gated
by `OSV_TEST_CONTAINER_RUNTIME`. Those are runtime evidence, separate from the
unit and workflow-composition checks above; do not count a fake-Docker test as
a real-container run.

## Independent pins and rollback

At this revision the runtime gitlink is
`068b57a6a37c0d8a0af8e151d0c160250ce3d105`. The security workflow pins
`setup-project` to `38cd1cb18c9c37e57e8b53a98e811450bb1a18fc` and
`prepare-osv` to `9a9471ad301e439bcd1ebc52334cf6b4399510e7`.
The original provider adoption replaced a base-checkout Python validator and
inline scan/report policy; it did not change the product runtime gitlink.

Rollback of that original adoption requires a protected PR reverting the adoption
commit, restoring its Python validator, callers and tests together. Leave the
runtime gitlink, setup Action and separately adopted tool-metadata pin intact.
Once a later provider pin is adopted, restore the previously verified full SHA
in both `prepare-osv` calls and run the same workflow gates before landing.
Never substitute a candidate branch, mutable tag or runtime gitlink for the
trusted helper source. Rollback instructions are a recovery procedure; they do
not claim that a rollback has been deployed.
