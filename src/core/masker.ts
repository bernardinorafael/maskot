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

		while (output.length > 0 && /\W/.test(output[output.length - 1])) {
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

export function mask(
	value: string,
	pattern: string | string[],
	options?: MaskOptions
): string {
	if (Array.isArray(pattern)) {
		if (pattern.length === 0) return ""

		const selected = selectPattern(value, pattern)
		const result = masker(value, selected, options)

		const sameLengthPatterns = pattern.filter(
			(p) => unmask(p).length === unmask(selected).length && p !== selected
		)

		if (sameLengthPatterns.length === 0) return result

		let best = result
		for (const p of sameLengthPatterns) {
			const candidate = masker(value, p, options)
			if (candidate.length > best.length) {
				best = candidate
			}
		}

		return best
	}
	return masker(value, pattern || "", options)
}
