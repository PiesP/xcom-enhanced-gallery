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
