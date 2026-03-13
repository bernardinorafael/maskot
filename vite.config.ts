import { defineConfig } from "vitest/config"
import dts from "vite-plugin-dts"

export default defineConfig({
	plugins: [dts({ include: ["src"], exclude: ["**/*.test.ts"] })],
	build: {
		lib: {
			entry: {
				index: "src/index.ts",
				"presets/br/index": "src/presets/br/index.ts",
			},
			formats: ["es", "cjs"],
		},
	},
	test: {
		globals: true,
	},
})
