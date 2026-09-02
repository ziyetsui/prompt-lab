# Contributing

Thank you for helping build OpenLab / PromptLab. Contributions are ordinary Git pull requests so content decisions remain visible in the diff and history.

## Before editing

1. Read `AGENTS.md` and `content/README.md`.
2. Check whether the immutable prompt ID or locale already exists.
3. Confirm that the prompt text, attribution, source URL, and reuse rights are known. Do not copy content merely because it is publicly viewable.
4. Do not include API keys, cookies, personal data, private URLs, generated credentials, or unpublished CMS records.

## Add a prompt

- Create `content/prompts/prm_<stable-id>/<locale>.md`.
- Use JSON-compatible YAML between the two frontmatter delimiters. The repository intentionally parses this as JSON to avoid YAML ambiguity.
- Keep the directory name and frontmatter `id` identical forever.
- Add only canonical content-type/model taxonomy records genuinely needed by the prompt. Do not invent a model, creator, source, metric, result, timestamp, or license.
- Start with `status: draft`, `indexable: false`, and `seo.robots: noindex,nofollow`. Every other required canonical field still needs real input; do not add a record until it can pass the schema without fabricated placeholders.
- Each locale is independently reviewed. Do not silently fall back to another locale or present a translation as the source author's original text.

## Publication requirements

A public/indexable record must have a traceable source, usable evidence, complete publication revision data, and a reviewed translation state. CI rejects attempts to make an incomplete draft indexable. Reviewers also require an explicit content-rights basis in the pull request; the current canonical frontmatter does not yet encode a repository-license decision.

Project-level licensing is currently pending. A contribution's rights explanation does not select a license for the repository.

## Pull requests

Run:

```bash
npm run verify
```

Then describe:

- the prompt ID and locales changed;
- source, evidence, and content-rights basis;
- taxonomy additions or changes;
- actual verification output;
- any missing facts or known risks;
- whether the change remains draft/noindex.

Maintainers may request a smaller diff, stronger provenance, or removal of content whose rights are unclear. Never bypass required checks, force-push over another contributor's work, auto-merge, or claim a downstream deployment completed without evidence.
