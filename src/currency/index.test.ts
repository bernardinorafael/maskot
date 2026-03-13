import { mask, unmask } from "./"

describe("mask", () => {
	test("should format 0.01 (number) to R$ 0,01", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: 0.01 })
		expect(result).toEqual("R$ 0,01")
	})

	test("should format 0.1 (number) to R$ 0,10", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: 0.1 })
		expect(result).toEqual("R$ 0,10")
	})

	test("should format 1 (number) to R$ 1,00", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: 1 })
		expect(result).toEqual("R$ 1,00")
	})

	test("should format 1.0 (number) to R$ 1,00", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: 1.0 })
		expect(result).toEqual("R$ 1,00")
	})

	test("should format -0.01 (number) to -R$ 0,01", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: -0.01 })
		expect(result).toEqual("-R$ 0,01")
	})

	test("should format -0.1 (number) to -R$ 0,10", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: -0.1 })
		expect(result).toEqual("-R$ 0,10")
	})

	test("should format -1 (number) to -R$ 1,00", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: -1 })
		expect(result).toEqual("-R$ 1,00")
	})

	test("should format -1.0 (number) to -R$ 1,00", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: -1.0 })
		expect(result).toEqual("-R$ 1,00")
	})

	test("should format 1234567.89 (number) to R$ 1.234.567,89", () => {
		const result = mask({ locale: "pt-BR", currency: "BRL", value: 1234567.89 })
		expect(result).toEqual("R$ 1.234.567,89")
	})

	test("should format 1234.56 (number) to $1,234.56", () => {
		const result = mask({ locale: "en-US", currency: "USD", value: 1234.56 })
		expect(result).toEqual("$1,234.56")
	})

	test("should format 1234.56 (number) to 1.234,56 €", () => {
		const result = mask({ locale: "de-DE", currency: "EUR", value: 1234.56 })
		expect(result).toEqual("1.234,56 €")
	})

	test("should format 1234 (number) to JPY ￥1234", () => {
		const result = mask({ locale: "ja-JP", currency: "JPY", value: 1234.56 })
		expect(result).toEqual("￥1,235")
	})
})

describe("unmask", () => {
	test("should remove format 0.01 (number) to R$ 0,01", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "R$ 0,01",
		})

		expect(result).toEqual(0.01)
	})

	test("should remove format 0.1 (number) to R$ 0,10", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "R$ 0,10",
		})

		expect(result).toEqual(0.1)
	})

	test("should remove format 1 (number) to R$ 1,00", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "R$ 1,00",
		})

		expect(result).toEqual(1)
	})

	test("should remove format 1.0 (number) to R$ 1,00", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "R$ 1,00",
		})

		expect(result).toEqual(1.0)
	})

	test("should remove format -0.01 (number) to -R$ 0,01", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "-R$ 0,01",
		})

		expect(result).toEqual(-0.01)
	})

	test("should remove format -0.1 (number) to -R$ 0,10", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "-R$ 0,10",
		})

		expect(result).toEqual(-0.1)
	})

	test("should remove format -1 (number) to -R$ 1,00", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "-R$ 1,00",
		})

		expect(result).toEqual(-1)
	})

	test("should remove format -1.0 (number) to -R$ 1,00", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "-R$ 1,00",
		})

		expect(result).toEqual(-1.0)
	})

	test("should remove format 1234567.89 (number) to R$ 1.234.567,89", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: "R$ 1.234.567,89",
		})

		expect(result).toEqual(1234567.89)
	})

	test("should remove format 1234.56 (number) to $1,234.56", () => {
		const result = unmask({
			locale: "en-US",
			currency: "USD",
			value: "$1,234.56",
		})

		expect(result).toEqual(1234.56)
	})

	test("should remove format 1234.56 (number) to 1.234,56 €", () => {
		const result = unmask({
			locale: "de-DE",
			currency: "EUR",
			value: "1.234,56 €",
		})

		expect(result).toEqual(1234.56)
	})

	test("should remove format 1234 (number) to JPY ￥1234", () => {
		const result = unmask({
			locale: "ja-JP",
			currency: "JPY",
			value: "￥1,234",
		})

		expect(result).toEqual(1234)
	})

	test("should remove format 1.234,567 (number) to KWD 1234.567", () => {
		const result = unmask({
			locale: "pt-BR",
			currency: "KWD",
			value: "KWD 1.234,567",
		})

		expect(result).toEqual(1234.567)
	})
})

describe("edge cases", () => {
	test("should return 0 for empty string", () => {
		const result = unmask({ locale: "pt-BR", currency: "BRL", value: "" })
		expect(result).toEqual(0)
	})

	test("should return 0 for string with no digits", () => {
		const result = unmask({ locale: "pt-BR", currency: "BRL", value: "abc" })
		expect(result).toEqual(0)
	})

	test("should return 0 for lone minus sign", () => {
		const result = unmask({ locale: "pt-BR", currency: "BRL", value: "-" })
		expect(result).toEqual(0)
	})
})

describe("display: value (without currency symbol)", () => {
	test("should format BRL without symbol (prefix currency)", () => {
		const result = mask({
			locale: "pt-BR",
			currency: "BRL",
			value: 1234.56,
			display: "value",
		})
		expect(result).toEqual("1.234,56")
	})

	test("should format USD without symbol", () => {
		const result = mask({
			locale: "en-US",
			currency: "USD",
			value: 1234.56,
			display: "value",
		})
		expect(result).toEqual("1,234.56")
	})

	test("should format EUR without symbol (suffix currency)", () => {
		const result = mask({
			locale: "de-DE",
			currency: "EUR",
			value: 1234.56,
			display: "value",
		})
		expect(result).toEqual("1.234,56")
	})

	test("should format JPY without symbol (zero decimals)", () => {
		const result = mask({
			locale: "ja-JP",
			currency: "JPY",
			value: 1234,
			display: "value",
		})
		expect(result).toEqual("1,234")
	})

	test("should default to full display", () => {
		const full = mask({ locale: "pt-BR", currency: "BRL", value: 100 })
		expect(full).toEqual("R$\u00a0100,00")
	})

	test("should allow unmask to work on value-only format", () => {
		const formatted = mask({
			locale: "pt-BR",
			currency: "BRL",
			value: 1234.56,
			display: "value",
		})
		const result = unmask({
			locale: "pt-BR",
			currency: "BRL",
			value: formatted,
		})
		expect(result).toEqual(1234.56)
	})
})
