# Sensitive Surface Incident Response Runbook

Use this runbook when a secret, log, personal detail, host-specific path, or
other sensitive residue reaches Git, GitHub, or a public distribution surface.

In plain language:

> stop the bleeding first, clean the live shelf second, then make the old copy
> unusable even if the platform is slow to forget it.

## 1. Contain first

1. Revoke or rotate the credential immediately if the leak is credential-bearing.
2. Remove the leaked value from the current branch tip, current packet shelf,
   and current release surface.
3. Re-run:
   - `pnpm verify:sensitive-surfaces`
   - `pnpm verify:sensitive-public-surface`
   - `pnpm verify:sensitive-history`

## 2. Decide which layer leaked

### Current worktree only

- fix the file
- re-run `pnpm verify:sensitive-surfaces`

### Reachable private Git history

- treat it as blocker-grade repo-owned residue
- use `pnpm verify:sensitive-history` to confirm the exact commit/file evidence
- include author/committer metadata in that check; personal names, personal
  username-linked noreply emails, and other identity residue count as history
  leaks even when the file contents are already clean
- rewrite pushed history only with explicit owner approval

### Public GitHub repo, public packet, or public release text

1. rotate or revoke first
2. remove the content from the current public tip
3. delete or replace affected public release assets or packet payloads
4. re-run `pnpm verify:sensitive-public-surface`

### Public copy that cannot be directly rewritten

Examples:

- cached GitHub code-search copy
- mirrored or forked public repo outside your control
- copied release note or package description on another platform

Do this in order:

1. revoke or rotate the credential
2. remove the value from every source surface you still control
3. publish the corrected replacement immediately so the live public face is clean
4. open a GitHub Support or platform-support ticket for cache purge or retained-copy removal
5. record the URLs, timestamps, and replacement commit for follow-up
6. assume the leaked credential is compromised even if the platform later confirms deletion
