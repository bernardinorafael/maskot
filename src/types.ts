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

export interface CreateMaskerConfig<
	P extends Record<string, PresetConfig> = Record<string, PresetConfig>,
> {
	tokens?: Record<string, TokenInput>
	presets?: P
}
