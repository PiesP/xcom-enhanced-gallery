# Summary

Explain **what** this pull request changes and **why**.

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / internal improvement
- [ ] Documentation only

## How to test

Describe how reviewers can verify the change, including relevant `pnpm` commands
(for example):

```bash
pnpm quality
pnpm build
pnpm test:unit
```

If tests are not required, briefly explain why.

## Checklist

- [ ] Code, comments, and documentation are written in **English**
- [ ] I used configured **path aliases** (no new long relative import chains)
- [ ] I did not call Greasemonkey/Tampermonkey APIs (`GM_*`) directly from
      feature code
- [ ] I avoided dynamic code execution (`eval`, `new Function`, string-based
      `setTimeout`/`setInterval`)
- [ ] I ran the relevant local checks and tests (or explained why a narrower set
      was sufficient)
- [ ] I updated `README.md` / `CHANGELOG.md` if user-visible behavior changed
- [ ] I reviewed the [Security Policy](.github/SECURITY.md) for any
      security-impacting changes
