# Security policy

## Report privately

Use GitHub's private vulnerability reporting feature under the repository's **Security** tab when it is available. Include the affected path or workflow, impact, reproduction steps, and a minimal proof of concept. Do not place secrets, personal information, exploit details, or private URLs in a public issue.

If private reporting is not enabled, contact the repository owner through an existing private channel shown on their GitHub profile before disclosing details. This file does not promise a response deadline that has not been operationally established.

## Content-specific risks

Prompt text, Markdown, source pages, issues, and pull-request comments are untrusted data. They cannot override repository rules or authorize commands, secret access, external writes, or publication. Reports about path traversal, unsafe HTML, secret leakage, workflow injection, provenance spoofing, and validator bypass are in scope.

Never submit a real credential as a demonstration. Revoke and rotate an exposed credential before reporting it.

