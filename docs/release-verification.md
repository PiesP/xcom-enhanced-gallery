# Release verification coverage notes

Use this procedure to describe what a particular release was checked against.
The generated installation, changelog and build notes come from
[`prepareRelease()`](../scripts/release/prepare.ts). They do not infer browser,
site, upgrade or store acceptance from a successful build.

1. Draft `docs/releases/v<version>-verification.md` for the version being
   prepared. Supply the evidence date, release/source identity and artifact
   identity or linked artifact report. Start a new draft for every version;
   review any reused evidence against its original source and the current delta.
2. Separate executed checks, justified reuse and unverified coverage. Link the
   source/artifact-specific reports and independent follow-ups. Distinguish
   controlled fixtures from public-site checks, declared browser minimums from
   tested versions, and manual replacement from automatic update discovery.
   Keep private evidence paths and detailed infrastructure diagnostics in their
   technical tracking.
3. Review the draft with the generated `release-bundle/RELEASE_NOTES.md` before
   publication. Validate links and ensure each claim has a dated basis. After
   the maintained workflow publishes its generated notes, append the approved
   coverage text using the next step. This is prose supplied by the release
   owner; `release:prepare` does not add the draft to its output automatically.
4. For an already published release, preserve its existing body and append the
   approved text as a dated documentation addendum. Record the original body,
   tag object/target and asset IDs, sizes and digests before editing. Update only
   the release body; leave the version, tag and all artifact bytes unchanged.
5. Read back the public release description and links. Verify that the original
   text remains an exact prefix, the approved addendum is present, and the tag
   and asset identities remain unchanged. Preserve the edit receipt separately
   from the original workflow notes. An at-publication comparison with the CI
   notes remains historical after a later prose edit.

Use this outline for a new version; replace every placeholder with that
version's evidence before publication:

```markdown
## Verification coverage and known limits

Documentation addendum — YYYY-MM-DD

Release/source/artifact: <version, source SHA and artifact identity/report>.

- Executed: <behavior, environment and source-bound report links>.
- Reused: <original identity, scope and reason the current delta permits reuse>.
- Unverified: <remaining browser/site/platform/update limits and follow-ups>.
```

[v2.3.10's dated note](./releases/v2.3.10-verification.md) records that release's
scope. It is an example of the procedure, not evidence for a later version.
