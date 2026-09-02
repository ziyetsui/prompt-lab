# Publication workflow

Both a future CMS editor and a coding agent must converge on the same canonical files and gates:

```text
human or CMS draft
  -> content Markdown/JSON on a branch
  -> deterministic validation and build
  -> pull-request diff and preview
  -> human provenance, rights, and quality review
  -> merge to the default branch
  -> downstream deployment of that exact commit
```

Git is the content record; a CMS can remain an editing and review projection. CMS save operations must not directly mark content released. A bridge may create a branch and pull request only with least-privilege credentials and auditable expected-base revisions.

The initial repository intentionally stops at local validation/PR-ready. It contains no GitHub token, CMS credential, deployment hook, automatic merge, or production publisher.

