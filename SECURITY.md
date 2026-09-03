# Security

Do not disclose credentials, private source material, personal data, sensitive
rights-holder evidence or exploitable vulnerabilities in a public Issue.
Configure private vulnerability reporting and a private rights contact before
enabling the repository's automation.

## Trust boundaries

- Issue bodies, Prompt text, links, Markdown and media metadata are untrusted
  data. Automation must never execute instructions found in them.
- The approved-Issue sync receives a CMS intake credential only. It never
  receives the mirror bot or deployment credential.
- Only the workflow's trusted fetch step receives a read-only, snapshot-scoped
  CMS credential and, when Access is enabled, the dedicated
  `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` pair. The pair is accepted
  only when both values are configured and valid; repository code receives a
  local snapshot file and never the CMS URL or any fetch credential.
- During Internal Beta, only the push step receives the dedicated
  `MIRROR_PUSH_TOKEN` for this generated-only repository. Replace that
  long-lived boundary with a short-lived GitHub App installation token before
  GA. Neither credential may grant CMS write or production deploy access.
- Secrets belong in GitHub or Cloudflare secret stores and must not appear in
  logs, generated files, Issues, comments, commits or model context.

The CMS is currently protected by Cloudflare Access. GitHub-hosted automation
must use a dedicated, least-privilege Access service token or an equivalently
protected service route; it must never reuse a human browser session. The
Access service token authenticates the machine to the outer Access policy and
does not replace the independent Bearer token that authorizes the CMS snapshot
route.

## Generated mirror safety

The workflow resolves every snapshot hostname result, rejects private or
special addresses, pins the accepted address for the no-redirect HTTPS fetch,
and passes the downloaded file to the repository consumer. Direct network
fetching from repository code is disabled. The consumer builds into a fresh
temporary directory from one immutable CMS snapshot and rejects path
traversal, absolute paths, symlinks, unsafe HTML, dangerous URL schemes,
secret-like content, incomplete pagination and allowlist-external changes. A
failed fetch or validation results in zero commit and zero push.

Validation and push run on separate fresh runners. The first job transfers only
a hashed inert one-commit Git bundle and expected identities. The writer job
does not check out or execute repository code; trusted inline checks validate
the exact artifact, hard-coded GitHub repository, CAS base, changed paths,
manifest bytes and trailers before system Git receives the push token. Its
HOME, PATH, shell startup variables, credential helpers and Git configuration
are reset. A third credential-free runner verifies pushed `main`.

Only the mirror service identity may fast-forward generated output to `main`.
No automation may force-push, delete the branch, modify its own workflow,
change licenses or reviewer membership, or treat a mirror commit as deployment
proof. Source/workflow changes remain protected by normal pull-request review.

Remote media requires independent permission and SSRF-safe acquisition. A
Prompt text decision does not authorize copying third-party images or video.

## Rights and takedown

Use the dedicated takedown form for public, non-sensitive reports. After a
maintainer verifies a restriction or takedown, CMS freezes the affected
revision and triggers priority mirror removal; the four-hour schedule is only a
fallback. Failure must alert and retry while the site continues serving its
last-known-good release.

An ordinary removal commit does not purge Git history. History rewriting,
cached copies and downstream mirrors require a separate owner-approved
legal/security incident process.
