# OpenLab / PromptLab

OpenLab / PromptLab is a Git-first public content repository for reusable prompts. Each prompt and each locale lives in its own reviewable Markdown file; classification relationships are explicit and the currently executable content-type/model taxonomies use stable JSON records. Contributors propose normal pull requests, CI validates the content contract, and a deterministic build produces machine-readable indexes.

This repository is a content library, not a production CMS database. Git history on the default branch is the durable record. A merge does not by itself prove that any downstream website has deployed the same commit.

## Repository status

- The repository starts with no Prompt records rather than publishing invented or unverified example data.
- It contains **none** of the unverified CMS seed records from the application project.
- The generated public catalog is initially empty. A prompt enters it only after provenance, review, publication, translation, and indexing gates all pass.
- **License pending:** no repository or content license has been selected. Until the owner adds an explicit license, do not assume permission to reuse repository code or contributed prompt text outside rights granted by law or by the individual source.

## Content layout

```text
content/
├── site.json                         # added when canonical origin is known
├── surfaces.json                     # added by the downstream release integration
├── prompts/<immutable-id>/<locale>.md
└── taxonomies/
    ├── content-type/<id>/<locale>.json
    └── model/<id>/<locale>.json
```

Prompt frontmatter retains all six canonical discovery fields: content type, model, use case, technique, style, and subject. The current canonical localized taxonomy schema is executable for content type and model; the other four remain controlled slug relationships until a reviewed schema migration adds localized records. Counts and public indexes are derived during the build; contributors never hand-edit them.

## Local verification

Node.js 24 or newer is sufficient; the validator has no runtime dependencies.

```bash
npm run validate
npm test
npm run build
```

`npm run build` writes deterministic projections to the ignored `dist/` directory. Running it twice against the same content must produce byte-identical files.

## Compatibility boundary

The canonical Prompt, taxonomy, site, and surface schemas under `schemas/` are byte-for-byte snapshots of the application's contracts, and `lib/json-schema.mjs` is the same dependency-free schema engine. The additional rights-clearance schema is PromptLab governance, not a change to canonical Markdown. The bootstrap `scripts/content.mjs` intentionally implements only the public PromptLab empty-repository/Prompt projection subset. It does not claim that the full application surface compiler, CMS Git Bridge, GitHub publisher, or deployment status synchronization is installed here. Those integrations require a known repository URL, release configuration, credentials, and separate reviewed work.

## Contribution flow

1. Open a content issue or start from a clearly sourced contribution.
2. Create a branch; never write directly to the default branch.
3. Add or edit only the target Markdown and necessary taxonomy records.
4. Keep new content `draft`, `indexable: false`, and `noindex,nofollow`.
5. Run `npm run verify`, inspect the Git diff, and open a pull request.
6. Human reviewers confirm provenance, rights, locale quality, usefulness, and taxonomy before any publication-state change.

See [CONTRIBUTING.md](CONTRIBUTING.md), [content/README.md](content/README.md), and [docs/PUBLICATION.md](docs/PUBLICATION.md) for the full contract.
