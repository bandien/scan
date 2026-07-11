# Hapulico CMMS — Visual Reference

This project is a **visual reference only** — static Bootstrap 5 HTML mockups of the CMMS webapp's UI components and design tokens, synced from `design-system/` in the `02_Source` repo (no build system, no React/JS source, no compiled component bundle in that repo).

Use these as the look-and-feel reference (colors, typography, buttons, cards, badges, forms, feedback states) when designing screens for this app. They are not live/functional components — there is no props API or `.d.ts` contract to bind against.

## Groups

- **Tokens** — color palette (`--brand`, `--brand-2`, `--warn`, `--danger`, `--surface`, `--ink`, `--muted`, `--line`) and typography scale
- **Forms** — buttons, form elements, person chip
- **Badges & Status** — badge, chip
- **Cards** — log card, metric, plan card, week item
- **Layout** — header, panel
- **Feedback** — empty state, toast

## Stack referenced

Bootstrap 5.3.3 + Bootstrap Icons 1.11.3 (loaded via CDN in each preview), Vietnamese UI copy, system font stack (`-apple-system, "Segoe UI", Roboto, Arial`).
