import { createMasker } from "../../factory"
import { cep, cnpj, cpf, creditCard, phone, plate } from "./patterns"

const masker = createMasker({
	presets: { cpf, cnpj, phone, cep, plate, creditCard },
})

export const { mask, unmask } = masker
