# Maskot v2.0 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign maskot with custom tokens (with transform), `createMasker` factory pattern, and subpath BR presets with full type-safe autocomplete.

**Architecture:** Core masking logic extracted to `src/core/masker.ts` with pluggable token system. Factory (`createMasker`) creates configured instances that support `{ preset: "name" }` with TypeScript-inferred autocomplete. BR presets exported via `maskot/br` subpath using pre-configured factory instance. Drop `unMask` alias (v2 breaking change). Drop UMD (modern ESM+CJS only).

**Tech Stack:** TypeScript 5.5+, Vite 6 (library mode, multi-entry), Vitest 3

---

## File Structure

```
src/
  types.ts                          — TokenConfig, PresetConfig, MaskOptions, Masker interface
  core/
    masker.ts                       — mask(), unmask(), masker() with custom token + transform support
    masker.test.ts                  — all pattern masking tests (migrated + new edge cases)
  currency/
    index.ts                        — currency mask/unmask (kept, minor edge case fixes)
    index.test.ts                   — currency tests (kept + new edge cases)
  factory/
    index.ts                        — createMasker() factory function
    index.test.ts                   — factory tests (tokens, presets, autocomplete)
  presets/
    br/
      index.ts                      — pre-configured masker, exports { mask, unmask }
      patterns.ts                   — cpf, cnpj, phone, cep, plate, creditCard definitions
      patterns.test.ts              — BR preset mask/unmask tests
  index.ts                          — barrel: { mask, unmask, createMasker, currency }
```

## Chunk 1: Types + Core Masker

### Task 1: Shared Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write types file**

```ts
export interface TokenConfig {
	pattern: RegExp
	transform?: (char: string) => string
}

export type TokenInput = RegExp | TokenConfig

export interface PresetConfig {
	pattern: string | string[]
	tokens?: Record<string, TokenInput>
}

export interface MaskOptions {
	placeholder?: string
	tokens?: Record<string, TokenInput>
}

export interface Masker<PresetKey extends string = never> {
	mask(value: string, pattern: string | string[]): string
	mask(value: string, options: { preset: PresetKey; placeholder?: string }): string
	unmask(value: string): string
}

export interface CreateMaskerConfig<P extends Record<string, PresetConfig> = Record<string, PresetConfig>> {
	tokens?: Record<string, TokenInput>
	presets?: P
}
```

- [ ] **Step 2: Verify no type errors**

Run: `pnpm exec tsc --noEmit src/types.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared types for v2 token and preset system"
```

---

### Task 2: Core Masker (refactored with custom tokens + transform)

**Files:**
- Create: `src/core/masker.ts`
- Create: `src/core/masker.test.ts`

- [ ] **Step 1: Write failing tests for core masker**

Migrate all existing tests from `src/masker/index.test.ts` plus new tests:

```ts
import { mask, unmask } from "./masker"

describe("mask", () => {
	test("should mask digits", () => {
		expect(mask("123", "9.9.9")).toEqual("1.2.3")
	})

	test("should mask alphanumeric chars", () => {
		expect(mask("ABC82739T", "AAA-99.99/SS")).toEqual("ABC-82.73/9T")
	})

	test("should apply placeholder", () => {
		expect(mask("AB3891", "AA.99-99/SS.S", { placeholder: "_" })).toEqual("AB.38-91/__._")
	})

	test("should use first mask from multi-pattern", () => {
		expect(mask("123", ["9.9.9", "99-99"])).toEqual("1.2.3")
	})

	test("should use second mask from multi-pattern", () => {
		expect(mask("1234", ["9.9.9", "99-99"])).toEqual("12-34")
	})

	test("should stop when char does not match and avoid trailing symbol", () => {
		expect(mask("1234", "9-9.AA")).toEqual("1-2")
	})

	test("should keep literal chars from pattern in value", () => {
		expect(mask("+55 (48) 888-8", "+55 (99) 999-9999")).toEqual("+55 (48) 888-8")
	})

	test("should return empty string for empty pattern", () => {
		expect(mask("+55 (48) 888-8", "")).toEqual("")
	})

	test("should return empty string for empty value", () => {
		expect(mask("", "9.9.9")).toEqual("")
	})

	test("should return empty string for empty multi-pattern array", () => {
		expect(mask("123", [])).toEqual("")
	})
})

describe("unmask", () => {
	test("should remove mask", () => {
		expect(unmask(mask("123", "9.9.9"))).toEqual("123")
	})

	test("should remove mask and placeholder chars", () => {
		expect(unmask("+55 (99) 999-99__")).toEqual("559999999")
	})
})

describe("custom tokens", () => {
	test("should accept custom token as RegExp", () => {
		expect(mask("ff00ab", "HH:HH:HH", { tokens: { H: /[0-9a-fA-F]/ } })).toEqual("ff:00:ab")
	})

	test("should accept custom token with transform", () => {
		expect(
			mask("abc1234", "UUU-9999", {
				tokens: { U: { pattern: /[a-zA-Z]/, transform: (c) => c.toUpperCase() } },
			})
		).toEqual("ABC-1234")
	})

	test("should allow custom token to override built-in", () => {
		expect(
			mask("abc", "999", {
				tokens: { "9": /[a-z]/ },
			})
		).toEqual("abc")
	})

	test("custom tokens should coexist with built-in tokens", () => {
		expect(
			mask("A1f", "A9H", {
				tokens: { H: /[0-9a-fA-F]/ },
			})
		).toEqual("A1f")
	})
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/core/masker.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Write core masker implementation**

```ts
import type { MaskOptions, TokenConfig, TokenInput } from "../types"

const DEFAULT_TOKENS: Record<string, TokenConfig> = {
	"9": { pattern: /[0-9]/ },
	A: { pattern: /[a-zA-Z]/ },
	S: { pattern: /[0-9a-zA-Z]/ },
}

function resolveToken(input: TokenInput): TokenConfig {
	return input instanceof RegExp ? { pattern: input } : input
}

function buildTokens(custom?: Record<string, TokenInput>): Record<string, TokenConfig> {
	if (!custom) return DEFAULT_TOKENS

	const merged = { ...DEFAULT_TOKENS }
	for (const [key, value] of Object.entries(custom)) {
		merged[key] = resolveToken(value)
	}
	return merged
}

export function unmask(value: string): string {
	return value.replace(/[^0-9a-zA-Z]/g, "")
}

export function masker(value: string, pattern: string, options?: MaskOptions): string {
	const tokens = buildTokens(options?.tokens)
	const patternChars = pattern.split("")
	const unmaskedValue = unmask(String(value))
	const output: string[] = []

	let valueIndex = 0

	for (let i = 0; i < patternChars.length; i++) {
		const patternChar = patternChars[i]
		const valueChar = unmaskedValue[valueIndex]
		const token = tokens[patternChar]

		if (valueChar === patternChar) {
			output.push(valueChar)
			valueIndex++
			continue
		}

		if (!token) {
			output.push(patternChar)
			continue
		}

		if (valueChar && token.pattern.test(valueChar)) {
			output.push(token.transform ? token.transform(valueChar) : valueChar)
			valueIndex++
			continue
		}

		if (options?.placeholder) {
			output.push(options.placeholder)
			continue
		}

		if (output.length > 0 && /\W/.test(output[output.length - 1])) {
			output.pop()
		}

		break
	}

	return output.join("")
}

function selectPattern(value: string, patterns: string[]): string {
	return patterns.reduce(
		(memo, pattern) => (value.length <= unmask(memo).length ? memo : pattern),
		patterns[0]
	)
}

export function mask(value: string, pattern: string | string[], options?: MaskOptions): string {
	if (Array.isArray(pattern)) {
		if (pattern.length === 0) return ""
		return masker(value, selectPattern(value, pattern), options)
	}
	return masker(value, pattern || "", options)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/core/masker.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/core/masker.ts src/core/masker.test.ts
git commit -m "feat: core masker with custom token and transform support"
```

---

## Chunk 2: Factory + Presets

### Task 3: createMasker Factory

**Files:**
- Create: `src/factory/index.ts`
- Create: `src/factory/index.test.ts`

- [ ] **Step 1: Write failing tests for factory**

```ts
import { createMasker } from "./"

describe("createMasker", () => {
	test("should mask with pattern string", () => {
		const masker = createMasker({})
		expect(masker.mask("123", "9.9.9")).toEqual("1.2.3")
	})

	test("should mask with multi-pattern", () => {
		const masker = createMasker({})
		expect(masker.mask("1234", ["9.9.9", "99-99"])).toEqual("12-34")
	})

	test("should unmask", () => {
		const masker = createMasker({})
		expect(masker.unmask("1.2.3")).toEqual("123")
	})

	test("should use global custom tokens", () => {
		const masker = createMasker({
			tokens: { H: /[0-9a-fA-F]/ },
		})
		expect(masker.mask("ff00ab", "HH:HH:HH")).toEqual("ff:00:ab")
	})

	test("should use global token transform", () => {
		const masker = createMasker({
			tokens: {
				U: { pattern: /[a-zA-Z]/, transform: (c) => c.toUpperCase() },
			},
		})
		expect(masker.mask("abc", "UUU")).toEqual("ABC")
	})

	test("should mask with preset", () => {
		const masker = createMasker({
			presets: {
				zip: { pattern: "99999-999" },
			},
		})
		expect(masker.mask("12345678", { preset: "zip" })).toEqual("12345-678")
	})

	test("should use preset-level tokens", () => {
		const masker = createMasker({
			presets: {
				upper: {
					pattern: "UUU-9999",
					tokens: { U: { pattern: /[a-zA-Z]/, transform: (c) => c.toUpperCase() } },
				},
			},
		})
		expect(masker.mask("abc1234", { preset: "upper" })).toEqual("ABC-1234")
	})

	test("should merge preset tokens with global tokens", () => {
		const masker = createMasker({
			tokens: { H: /[0-9a-fA-F]/ },
			presets: {
				code: {
					pattern: "HH-UU",
					tokens: { U: { pattern: /[a-zA-Z]/, transform: (c) => c.toUpperCase() } },
				},
			},
		})
		expect(masker.mask("ffab", { preset: "code" })).toEqual("ff-AB")
	})

	test("should throw for unknown preset", () => {
		const masker = createMasker({
			presets: { zip: { pattern: "99999-999" } },
		})
		// @ts-expect-error testing runtime behavior with invalid preset
		expect(() => masker.mask("123", { preset: "unknown" })).toThrow()
	})
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/factory/index.test.ts`
Expected: FAIL

- [ ] **Step 3: Write factory implementation**

```ts
import type { CreateMaskerConfig, Masker, MaskOptions, PresetConfig, TokenInput } from "../types"
import { mask as coreMask, unmask } from "../core/masker"

export function createMasker<P extends Record<string, PresetConfig>>(
	config: CreateMaskerConfig<P>
): Masker<Extract<keyof P, string>> {
	type PresetKey = Extract<keyof P, string>

	function maskFn(value: string, patternOrOptions: string | string[] | { preset: PresetKey; placeholder?: string }): string {
		if (typeof patternOrOptions === "string" || Array.isArray(patternOrOptions)) {
			return coreMask(value, patternOrOptions, { tokens: config.tokens })
		}

		const presetName = patternOrOptions.preset
		const preset = config.presets?.[presetName]

		if (!preset) {
			throw new Error(`Unknown preset: "${String(presetName)}"`)
		}

		const mergedTokens: Record<string, TokenInput> = {
			...config.tokens,
			...preset.tokens,
		}

		return coreMask(value, preset.pattern, {
			placeholder: patternOrOptions.placeholder,
			tokens: Object.keys(mergedTokens).length > 0 ? mergedTokens : undefined,
		})
	}

	return { mask: maskFn, unmask } as Masker<PresetKey>
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/factory/index.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/factory/index.ts src/factory/index.test.ts
git commit -m "feat: createMasker factory with preset and token support"
```

---

### Task 4: BR Presets

**Files:**
- Create: `src/presets/br/patterns.ts`
- Create: `src/presets/br/index.ts`
- Create: `src/presets/br/patterns.test.ts`

- [ ] **Step 1: Write BR pattern definitions**

```ts
import type { PresetConfig } from "../../types"

export const cpf: PresetConfig = {
	pattern: "999.999.999-99",
}

export const cnpj: PresetConfig = {
	pattern: "SS.SSS.SSS/SSSS-99",
	tokens: {
		S: { pattern: /[0-9a-zA-Z]/, transform: (c) => c.toUpperCase() },
	},
}

export const phone: PresetConfig = {
	pattern: ["(99) 9999-9999", "(99) 99999-9999"],
}

export const cep: PresetConfig = {
	pattern: "99999-999",
}

export const plate: PresetConfig = {
	pattern: ["AAA-9999", "AAA9A99"],
	tokens: {
		A: { pattern: /[a-zA-Z]/, transform: (c) => c.toUpperCase() },
	},
}

export const creditCard: PresetConfig = {
	pattern: "9999 9999 9999 9999",
}
```

- [ ] **Step 2: Write BR preset entry point**

```ts
import { createMasker } from "../../factory"
import { cpf, cnpj, phone, cep, plate, creditCard } from "./patterns"

const masker = createMasker({
	presets: { cpf, cnpj, phone, cep, plate, creditCard },
})

export const { mask, unmask } = masker
```

- [ ] **Step 3: Write failing tests for BR presets**

```ts
import { mask, unmask } from "./"

describe("cpf", () => {
	test("should mask cpf", () => {
		expect(mask("12345678901", { preset: "cpf" })).toEqual("123.456.789-01")
	})

	test("should mask partial cpf", () => {
		expect(mask("1234", { preset: "cpf" })).toEqual("123.4")
	})
})

describe("cnpj", () => {
	test("should mask numeric cnpj", () => {
		expect(mask("11222333000181", { preset: "cnpj" })).toEqual("11.222.333/0001-81")
	})

	test("should mask alphanumeric cnpj (new format)", () => {
		expect(mask("11AAABBB000199", { preset: "cnpj" })).toEqual("11.AAA.BBB/0001-99")
	})

	test("should force uppercase on alphanumeric cnpj", () => {
		expect(mask("11aaabbb000199", { preset: "cnpj" })).toEqual("11.AAA.BBB/0001-99")
	})
})

describe("phone", () => {
	test("should mask landline (10 digits)", () => {
		expect(mask("1133334444", { preset: "phone" })).toEqual("(11) 3333-4444")
	})

	test("should mask mobile (11 digits)", () => {
		expect(mask("11999887766", { preset: "phone" })).toEqual("(11) 99988-7766")
	})
})

describe("cep", () => {
	test("should mask cep", () => {
		expect(mask("12345678", { preset: "cep" })).toEqual("12345-678")
	})
})

describe("plate", () => {
	test("should mask old plate format", () => {
		expect(mask("ABC1234", { preset: "plate" })).toEqual("ABC-1234")
	})

	test("should mask mercosul plate format", () => {
		expect(mask("ABC1D23", { preset: "plate" })).toEqual("ABC1D23")
	})

	test("should force uppercase on plate", () => {
		expect(mask("abc1234", { preset: "plate" })).toEqual("ABC-1234")
	})
})

describe("creditCard", () => {
	test("should mask credit card", () => {
		expect(mask("4111111111111111", { preset: "creditCard" })).toEqual("4111 1111 1111 1111")
	})
})

describe("unmask", () => {
	test("should unmask cpf", () => {
		expect(unmask("123.456.789-01")).toEqual("12345678901")
	})

	test("should unmask cnpj", () => {
		expect(unmask("11.AAA.BBB/0001-99")).toEqual("11AAABBB000199")
	})
})

describe("pattern string fallback", () => {
	test("should accept pattern string directly", () => {
		expect(mask("12345678", "99.999-999")).toEqual("12.345-678")
	})
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm vitest run src/presets/br/patterns.test.ts`
Expected: FAIL

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/presets/br/patterns.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/presets/br/
git commit -m "feat: BR presets (cpf, cnpj, phone, cep, plate, creditCard)"
```

---

## Chunk 3: Barrel Export, Build Config, Edge Cases, Cleanup

### Task 5: Barrel Export + Build Config

**Files:**
- Modify: `src/index.ts`
- Modify: `vite.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Update barrel export**

```ts
import * as currency from "./currency"

export { currency }
export { mask, unmask } from "./core/masker"
export { createMasker } from "./factory"
export type { TokenConfig, TokenInput, PresetConfig, MaskOptions, Masker, CreateMaskerConfig } from "./types"
```

- [ ] **Step 2: Update vite.config.ts for multi-entry**

```ts
import { defineConfig } from "vitest/config"
import dts from "vite-plugin-dts"

export default defineConfig({
	plugins: [dts({ include: ["src"], exclude: ["**/*.test.ts"] })],
	build: {
		lib: {
			entry: {
				index: "src/index.ts",
				"presets/br/index": "src/presets/br/index.ts",
			},
			formats: ["es", "cjs"],
		},
	},
	test: {
		globals: true,
	},
})
```

- [ ] **Step 3: Update package.json exports and entry points**

Replace `main`, `module`, `browser`, `types`, `exports` with:

```json
{
	"main": "dist/index.cjs",
	"module": "dist/index.js",
	"types": "dist/index.d.ts",
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
			"import": "./dist/index.js",
			"require": "./dist/index.cjs"
		},
		"./br": {
			"types": "./dist/presets/br/index.d.ts",
			"import": "./dist/presets/br/index.js",
			"require": "./dist/presets/br/index.cjs"
		}
	}
}
```

Remove `"browser"` field (UMD dropped in v2).

- [ ] **Step 4: Build and verify output**

Run: `pnpm build`
Expected: dist/ contains index.js, index.cjs, index.d.ts, presets/br/index.js, presets/br/index.cjs, presets/br/index.d.ts

- [ ] **Step 5: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/index.ts vite.config.ts package.json
git commit -m "feat: multi-entry build with maskot/br subpath export"
```

---

### Task 6: Currency Edge Cases

**Files:**
- Modify: `src/currency/index.test.ts`

- [ ] **Step 1: Add edge case tests to currency**

Append to existing test file:

```ts
describe("edge cases", () => {
	test("should handle empty string in unmask", () => {
		const result = unmask({ locale: "pt-BR", currency: "BRL", value: "" })
		expect(result).toEqual(0)
	})

	test("should handle string with no digits in unmask", () => {
		const result = unmask({ locale: "pt-BR", currency: "BRL", value: "abc" })
		expect(result).toEqual(0)
	})
})
```

- [ ] **Step 2: Run tests to see which fail**

Run: `pnpm vitest run src/currency/index.test.ts`
Expected: edge case tests may FAIL (NaN instead of 0)

- [ ] **Step 3: Fix currency unmask to handle NaN**

In `src/currency/index.ts`, update unmask to return 0 for NaN:

```ts
export const unmask = ({ locale, currency, value }: CurrencyUnmaskProps) => {
	const formatter = new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	})

	const unformatted = `${value}`.replace(/[^0-9-]/g, "")

	if (!unformatted || unformatted === "-") return 0

	const parts = formatter.formatToParts(1.1)
	const fractionPart = parts.find((item) => item.type === "fraction")

	return fractionPart
		? parseInt(unformatted) / (parseInt(fractionPart.value) * 10)
		: parseInt(unformatted)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/currency/index.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/currency/index.ts src/currency/index.test.ts
git commit -m "fix: currency unmask returns 0 for empty or non-numeric input"
```

---

### Task 7: Cleanup + Final Verification

**Files:**
- Delete: `src/masker/index.ts`
- Delete: `src/masker/index.test.ts`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Delete old masker directory**

```bash
rm -rf src/masker/
```

- [ ] **Step 2: Update CLAUDE.md architecture section**

Update the Architecture section to reflect the new file structure.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 4: Run build**

Run: `pnpm build`
Expected: clean build with all entry points

- [ ] **Step 5: Run lint**

Run: `pnpm lint`
Expected: zero errors

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove legacy masker, update docs for v2"
```
