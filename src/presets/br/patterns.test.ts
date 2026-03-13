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
		expect(mask("4111111111111111", { preset: "creditCard" })).toEqual(
			"4111 1111 1111 1111"
		)
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
