# Integration Surface Roadmap

This page is the shortest honest matrix for readers who want to know:

- what Shopflow exposes today
- what is moving into current-scope now
- what is still later
- what stays no-go
- what needs owner decision before it becomes a public commitment

## Today

- typed store-adapter contracts and verified-scope boundaries
- read-only provider-runtime seam contract for external acquisition boundaries
- read-only runtime truth for detection, latest output, recent activity, and
  evidence queue state
- workflow decision briefs and workflow-copilot briefs
- builder snapshots assembled from existing runtime truth
- review-bundle and submission-readiness artifacts

## Current-scope now

- keep the builder-facing integration substrate machine-readable and stable
- keep AI inside the operator workflow instead of bolting on a generic chat
  surface
- keep public copy English-first
- keep product UI English-default with `zh-CN` support through shared locale
  catalogs
- keep new user-visible strings out of scattered bilingual literals
- move package / plugin / skills / catalog / marketplace distribution work into
  current-scope execution instead of prep-only wording
- give Codex and Claude Code a plugin-level public-distribution bundle story
- move OpenClaw from comparison-only into a public-ready install / discovery /
  proof route
- improve front door, discoverability, plug-and-play, and SEO for those
  distribution paths

## Later

- read-only public API transport
- generated client or thin SDK
- hosted runtime product

## No-go

- write-capable MCP
- hosted SaaS control plane
- generic autonomous shopping assistant
- public wording that outruns reviewed live evidence

## Surface-dependent publication boundary

- official-listing language where an ecosystem really has an official public
  surface
- publisher / namespace / irreversible channel choices
- public API publication beyond the current repo-owned substrate

## Ecosystem Binding Matrix

| Target | Placement | Truthful wording now | Must not claim now |
| :--- | :--- | :--- | :--- |
| `Codex` | front-door primary + public-distribution current-scope | strong builder fit through typed contracts, workflow briefs, read-only builder snapshots, and a plugin-level distribution bundle story | official integration or official listing where no official Codex public surface exists |
| `Claude Code` | front-door primary + public-distribution current-scope | strong builder fit for the same builder-facing reasons, now with stronger skills-facing and plugin-level distribution routing | official integration or official listing where no official Claude Code public surface exists |
| `MCP` | repo-local read-only stdio now; public transport later | a truthful capability packet exists and the core four repo-truth surfaces are now attachable through stdio, even though public transport still does not | current public HTTP MCP product or write-capable MCP |
| `OpenCode` | ecosystem secondary | comparison or later-facing integration candidate | main hero placement or official package |
| `OpenHands` | ecosystem secondary | comparison context for agentic coding and automation | main hero placement or official package |
| `OpenClaw` | public-ready target | current-scope install, discovery, and proof work are now in play | fake official listing or overclaiming first-party integration without the real external surface |
