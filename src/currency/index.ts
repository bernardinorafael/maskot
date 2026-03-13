interface CurrencyMaskProps {
	locale: string | string[]
	currency: string
	value: number | bigint
	display?: "full" | "value"
}

interface CurrencyUnmaskProps {
	locale: string | string[]
	currency: string
	value: string
}

export const mask = ({
	locale,
	currency,
	value,
	display = "full",
}: CurrencyMaskProps): string => {
	const formatter = new Intl.NumberFormat(`${locale}`, {
		style: "currency",
		currency,
	})

	if (display === "full") {
		return formatter.format(value)
	}

	return formatter
		.formatToParts(value)
		.filter((part) => part.type !== "currency")
		.map((part) => part.value)
		.join("")
		.trim()
}

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
