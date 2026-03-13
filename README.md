# Maskot

> A lightweight, zero-dependency, framework-agnostic input masking library with TypeScript support.

## Install

```
pnpm add maskot
```

## Usage

### Basic masking

```ts
import { mask, unmask } from "maskot"

mask("ABC1C83", "AAA - 9S99")
// => "ABC - 1C83"

unmask("ABC - 1C83")
// => "ABC1C83"
```

### Multi-pattern

Pattern can be an array — maskot picks the best match based on value length:

```ts
const patterns = ["999.999.999-99", "99.999.999/9999-99"]

mask("12345678901", patterns)
// => "123.456.789-01"

mask("12345678000106", patterns)
// => "12.345.678/0001-06"
```

### Custom tokens

Built-in tokens: `9` (digit), `A` (letter), `S` (alphanumeric). You can extend or override them:

```ts
mask("ff00ab", "HH:HH:HH", {
	tokens: { H: /[0-9a-fA-F]/ },
})
// => "ff:00:ab"

mask("abc1234", "UUU-9999", {
	tokens: { U: { pattern: /[a-zA-Z]/, transform: (c) => c.toUpperCase() } },
})
// => "ABC-1234"
```

### Factory pattern

Use `createMasker` to create configured instances with type-safe presets:

```ts
import { createMasker } from "maskot"

const masker = createMasker({
	presets: {
		zip: { pattern: "99999-999" },
		plate: {
			pattern: ["AAA-9999", "AAA9A99"],
			tokens: { A: { pattern: /[a-zA-Z]/, transform: (c) => c.toUpperCase() } },
		},
	},
})

masker.mask("12345678", { preset: "zip" })
// => "12345-678"

masker.mask("abc1d23", { preset: "plate" })
// => "ABC1D23"
```

### BR presets

Pre-configured masker for Brazilian formats — CPF, CNPJ, phone, CEP, plate, credit card:

```ts
import { mask } from "maskot/br"

mask("12345678901", { preset: "cpf" })
// => "123.456.789-01"

mask("11999887766", { preset: "phone" })
// => "(11) 99988-7766"

mask("12345678", { preset: "cep" })
// => "12345-678"
```

### Currency

Uses `Intl.NumberFormat` for locale-aware currency formatting:

```ts
import { currency } from "maskot"

currency.mask({ locale: "pt-BR", currency: "BRL", value: 123456.78 })
// => "R$ 123.456,78"

currency.unmask({ locale: "pt-BR", currency: "BRL", value: "R$ 123.456,78" })
// => 123456.78
```

## Contributing

This project uses [Changesets](https://github.com/changesets/changesets) for versioning.

When making changes, create a changeset to describe what changed:

```
pnpm changeset
```

## License

MIT
