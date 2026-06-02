# Desktop Commerce Demo

Standalone Tauri commerce-operations demo for `desktop-foundation`.

This repository is intentionally separate from the foundation monorepo. It demonstrates how a real desktop product consumes foundation packages for:

- Tauri desktop shell backed by `desktop-core-rs`
- app shell, login, session, debug panel
- desktop layout and reusable UI components
- theme presets and product theme overrides
- bridge client, storage, secure storage, files, notification, clipboard, diagnostics
- GitHub Releases update manifest, checksum validation, and desktop artifact packaging

## Repositories

- Foundation: `k2safe/desktop-foundation`
- Demo: `k2safe/desktop-foundation-demo`

## Desktop First

`pnpm dev` launches the Tauri desktop app. `pnpm dev:web` is only a browser preview fallback for quick UI iteration.

The demo is a neutral commerce operations sample, not tied to any existing business or foundation-branded product. It keeps business HTTP mocked so it does not need a backend. In Tauri runtime, desktop capabilities are wired through the foundation Rust command contract:

- window state/title
- external open
- clipboard
- notification
- file dialog/export/download
- session/storage/secure storage

## Foundation Consumption

This repo consumes foundation as an external product project:

- JavaScript packages come from GitHub raw tarballs listed in `desktop-foundation/artifacts/npm/foundation-packages.json`.
- `pnpm.overrides` pins transitive foundation package dependencies to the same tarball URLs.
- `desktop-core-rs` comes from `git@github.com:k2safe/desktop-foundation.git` via SSH and is pinned to a foundation commit.

When the foundation packages are published to npm or GitHub Packages, these URL specs can be replaced with normal semver ranges.

## Product Shape

The sample product is `Commerce Ops`:

- order dashboard
- commerce order table with filters, sorting, density, and detail drawer
- runtime settings and diagnostics
- update center powered by `client.updates`
- local update fixture under `public/updates`

Business names, routes, permissions, and API payloads are intentionally product-owned so downstream projects can replace them without editing foundation internals.

## Scripts

```bash
pnpm install
pnpm dev
pnpm dev:web
pnpm type-check
pnpm build
pnpm check:desktop
pnpm build:desktop
```

## Demo Account

Any account and password works. The default payload uses `store-admin / demo`. The login flow is mocked to show how `DesktopAppShell`, `DesktopLoginPage`, and session state fit together.
