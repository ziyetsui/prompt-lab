# Git-native prompt content

The default branch's validated files in this directory are the durable content record. The contract preserves the application project's core model—immutable identity, one Markdown file per locale, explicit classification, provenance, SEO, publication, and translation state—while making the public OpenLab repository self-contained.

## Prompt path

```text
prompts/<immutable-id>/<locale>.md
```

- IDs match `^prm_[a-z0-9_]{8,64}$` and never change after publication.
- Frontmatter is JSON-compatible YAML enclosed by `---` lines.
- The directory name, `id`, locale filename, and frontmatter locale must agree.
- Prompt source text is not automatically translated. `prompt.language` records its language; localized explanation belongs in the Markdown body.
- A source locale must exist as its own file. There is no silent locale fallback.

## Classifications

Each prompt declares canonical classification values on every axis:

| Axis | Frontmatter field | Stable ID prefix | Purpose |
| --- | --- | --- | --- |
| `content-type` | `contentType` | `cty_` | text, image, video, or another output family |
| `model` | `models` | `mdl_` | compatible or model-agnostic grouping |
| use case | `useCases` | — | user task or intended outcome |
| technique | `techniques` | — | reusable prompt construction technique |
| style | `styles` | — | output style or tone |
| subject | `subjects` | — | subject-matter grouping |

Content-type/model relationships must resolve through exact-locale canonical taxonomy files. The other four fields remain controlled slug vocabularies in schema version 1; adding localized JSON for them requires a schema migration. Membership counts are computed by `npm run build`; source JSON never stores derived counts.

## State gates

- New or incomplete records: `draft` + `indexable: false` + `noindex,nofollow`.
- `published` records require traceable source/evidence, reviewed locale status, controlled timestamps, and a SHA-256 source revision; human review separately checks reuse rights.
- Only `published` + `indexable: true` + `index,follow` + `translation.ready` records with an exact human entry in `governance/rights-clearances.json` enter the generated catalog.

This repository intentionally starts without a sample Prompt so no fabricated source/evidence can masquerade as canonical content.
