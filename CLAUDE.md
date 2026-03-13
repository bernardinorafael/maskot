# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Maskot is a zero-dependency, framework-agnostic TypeScript library for input masking. It provides pattern-based masking (single and multi-pattern) with custom tokens, a factory pattern (`createMasker`) for configured instances with type-safe presets, and locale-aware currency masking via the `Intl.NumberFormat` API.

## Commands

- `pnpm test` — run all tests (Vitest)
- `pnpm test:watch` — run tests in watch mode
- `pnpm build` — build ESM + CJS bundles via Vite (library mode, multi-entry)
- `pnpm lint` — lint src/ with ESLint
- `pnpm format` — format src/ with Prettier
- `pnpm prerelease` — run tests then build (used before publishing)

Run a single test file: `pnpm vitest run src/core/masker.test.ts`

## Architecture

```
src/
  types.ts                  — shared types (TokenConfig, PresetConfig, MaskOptions, Masker, etc.)
  core/masker.ts            — core mask/unmask with pluggable token system (9=digit, A=letter, S=alphanumeric + custom)
  currency/index.ts         — Intl.NumberFormat currency mask/unmask
  factory/index.ts          — createMasker() factory for configured instances with presets
  presets/br/patterns.ts    — BR preset definitions (cpf, cnpj, phone, cep, plate, creditCard)
  presets/br/index.ts       — pre-configured masker for BR, exports { mask, unmask }
  index.ts                  — barrel: { mask, unmask, createMasker, currency }
```

**Entry points:**
- `maskot` — core functions (mask, unmask, createMasker, currency namespace)
- `maskot/br` — pre-configured BR masker with preset autocomplete

**Token system:** Built-in tokens (9, A, S) can be extended or overridden via `MaskOptions.tokens`. Tokens accept `RegExp` or `{ pattern: RegExp, transform?: (c) => string }`.

**Factory pattern:** `createMasker({ presets, tokens })` returns a typed `Masker` instance. Preset keys are inferred by TypeScript for autocomplete on `{ preset: "name" }`.

## Build Output

Vite (library mode) produces two formats per entry point:
- `dist/index.js` / `dist/index.cjs` (main entry)
- `dist/presets/br/index.js` / `dist/presets/br/index.cjs` (BR preset entry)

TypeScript declarations generated via `vite-plugin-dts`.

## Code Style

- Prettier: tabs, no semicolons, double quotes, trailing comma es5, 90 print width
- ESLint: flat config with typescript-eslint
- Conventional commits enforced via commitlint (husky commit-msg hook)
- Pre-commit: lint-staged runs ESLint + Prettier
- Pre-push: runs tests

## Release

Automated via `release-please` GitHub Action on push to `master`. It manages versioning, CHANGELOG.md, and npm publish.
