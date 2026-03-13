/** @type {import("prettier").Config} */
const config = {
	printWidth: 90,
	tabWidth: 2,
	useTabs: true,
	semi: false,
	singleQuote: false,
	trailingComma: "es5",
	bracketSpacing: true,
	arrowParens: "always",
	endOfLine: "auto",
	plugins: ["@ianvs/prettier-plugin-sort-imports"],
	importOrder: ["", "<THIRD_PARTY_MODULES>", "", "<TYPES>", "", "^[.]"],
}

module.exports = config
