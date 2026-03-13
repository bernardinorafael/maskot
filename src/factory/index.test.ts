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
					tokens: {
						U: {
							pattern: /[a-zA-Z]/,
							transform: (c) => c.toUpperCase(),
						},
					},
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
					tokens: {
						U: {
							pattern: /[a-zA-Z]/,
							transform: (c) => c.toUpperCase(),
						},
					},
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
