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
		expect(mask("ff00ab", "HH:HH:HH", { tokens: { H: /[0-9a-fA-F]/ } })).toEqual(
			"ff:00:ab"
		)
	})

	test("should accept custom token with transform", () => {
		expect(
			mask("abc1234", "UUU-9999", {
				tokens: {
					U: { pattern: /[a-zA-Z]/, transform: (c) => c.toUpperCase() },
				},
			})
		).toEqual("ABC-1234")
	})

	test("should allow custom token to override built-in", () => {
		expect(mask("abc", "999", { tokens: { "9": /[a-z]/ } })).toEqual("abc")
	})

	test("custom tokens should coexist with built-in tokens", () => {
		expect(mask("A1f", "A9H", { tokens: { H: /[0-9a-fA-F]/ } })).toEqual("A1f")
	})
})

describe("trailing literals stripping", () => {
	test("should strip all consecutive trailing literals like ') '", () => {
		expect(mask("11", "(99) 99999-9999")).toEqual("(11")
	})

	test("should strip ')' after value in pattern like (99)", () => {
		expect(mask("11", "(99) 9999")).toEqual("(11")
	})

	test("should strip multiple trailing literals like '--'", () => {
		expect(mask("1", "9--9")).toEqual("1")
	})

	test("should strip '...' trailing literals", () => {
		expect(mask("1", "9...9")).toEqual("1")
	})

	test("should allow progressive delete through mask-unmask cycle", () => {
		const pattern = "(99) 99999-9999"

		const step1 = mask("11999", pattern)
		expect(step1).toEqual("(11) 999")

		const step2 = mask(unmask("(11) 99"), pattern)
		expect(step2).toEqual("(11) 99")

		const step3 = mask(unmask("(11) 9"), pattern)
		expect(step3).toEqual("(11) 9")

		const step4 = mask(unmask("(11"), pattern)
		expect(step4).toEqual("(11")

		const step5 = mask(unmask("(1"), pattern)
		expect(step5).toEqual("(1")

		const step6 = mask(unmask("("), pattern)
		expect(step6).toEqual("")
	})
})
