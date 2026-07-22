# Codex Git workflow

Codex changes must be made on a work branch, never directly on `master` or `main`.

```bash
git switch master
git pull --ff-only
git switch -c codex/<short-description>
# edit, test, and commit on the work branch

git switch master
git pull --ff-only
git merge --no-ff codex/<short-description>
git push origin master
```

The versioned hooks in `.githooks/` reject direct default-branch commits and
default-branch pushes that are not based on a no-fast-forward merge commit.
Do not bypass them with `--no-verify`.

