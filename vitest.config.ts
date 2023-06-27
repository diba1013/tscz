import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": "/src",
		},
	},
	test: {
		environment: "node",
		restoreMocks: true,
		coverage: {
			enabled: true,
			provider: "v8",
			all: true,
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.types.ts"],
			reporter: ["html", "text-summary", "lcovonly"],
		},
	},
});
