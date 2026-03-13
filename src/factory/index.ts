import type { CreateMaskerConfig, Masker, PresetConfig, TokenInput } from "../types"

import { mask as coreMask, unmask } from "../core/masker"

export function createMasker<P extends Record<string, PresetConfig>>(
	config: CreateMaskerConfig<P>
): Masker<Extract<keyof P, string>> {
	type PresetKey = Extract<keyof P, string>

	function maskFn(
		value: string,
		patternOrOptions: string | string[] | { preset: PresetKey; placeholder?: string }
	): string {
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
