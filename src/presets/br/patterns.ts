import { PresetConfig } from "../../types"

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
