# Desktop Foundation Demo

Standalone product-style demo for `desktop-foundation`.

This repository is intentionally separate from the foundation monorepo. It demonstrates how a real desktop product consumes foundation packages for:

- app shell, login, session, debug panel
- desktop layout and reusable UI components
- theme presets and product theme overrides
- bridge client, storage, secure storage, files, notification, clipboard, diagnostics

## Repositories

- Foundation: `k2safe/desktop-foundation`
- Demo: `k2safe/desktop-foundation-demo`

## Local Development Before Package Release

The dependencies use normal package versions, for example `@desktop-foundation/ui-react`: `0.1.0`.

For local development before publishing packages, `package.json` includes `pnpm.overrides` that link to a sibling checkout at `../desktop-foundation/packages/*`. After publishing the foundation packages to npm or GitHub Packages, remove the `pnpm.overrides` block and install from the registry.

## Scripts

```bash
pnpm install
pnpm dev
pnpm type-check
pnpm build
```

## Demo Account

Any account and password works. The login flow is mocked to show how `DesktopAppShell`, `DesktopLoginPage`, and session state fit together.
