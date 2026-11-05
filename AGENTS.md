# Remix Wordle agent guide

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm start
pnpm test
pnpm typecheck
pnpm format
pnpm lint
pnpm check
```

`pnpm check` is `oxfmt --check && oxlint && tsc --noEmit`. `pnpm lint` is `oxlint --fix`. `pnpm format` is `oxfmt`. Do not use `vp check`, `vp fmt`, `vp lint`, `vp test`, or `vp build`. This repo no longer uses Vite+ for those jobs.

`pnpm test` runs `remix test` with Node custom hooks that remap `#app/utils/db.ts`, `bcryptjs`, and Vite asset suffixes (`.css`, `.svg`, `?url`, `?assets=`).

## Remix and Pitlane

This app uses Remix 3.2 and the `pitlane` umbrella. Import Vite and asset helpers from `pitlane/*` so `node_modules/pitlane/INDEX.md` stays the versioned index for the installed release.

Official agent skills live at `.agents/skills/remix` and `.agents/skills/pitlane`.

## Lint and format

Oxlint and oxfmt config is copied from [mcan.sh](https://github.com/mcansh/mcan.sh):

- `oxfmt.config.ts`
- `oxlint.config.ts`
- `tools/oxlint/`
- `oxfmt`, `oxlint`, `oxlint-tsgolint`, and `@oxlint/plugins` versions

This repo also keeps `oxlint-plugins/prefer-import-alias-plugin.ts`, ignores `app/generated/**`, and keeps `useTabs: true` so existing Wordle files stay tab-indented. Anti-slop rules and `typescript/no-non-null-assertion` from mcan.sh stay off here. Remix 3.2 `context.get` is `T | undefined`, so this app uses `!` at those call sites. Tests keep Fetch's lowercase header maps, so `remix-headers/canonical-header-name` is off for `*.test.*` files.
