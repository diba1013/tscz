import { version } from "./package.json";
import { defineConfig } from "@diba1013/tscz";

const NAME = "tscz";
const SOURCE = "src";

function input(name: string): string {
	return `${SOURCE}/${name}`;
}

export default defineConfig({
	name: NAME,
	entries: [
		{
			name: "index",
			input: input("index.ts"),
			output: ["cjs", "esm", "dts"],
		},
		{
			name: "cli",
			input: input("cli.ts"),
			output: ["cjs"],
		},
		{
			name: "worker",
			input: input("worker.ts"),
			output: ["esm"],
		},
	],
	env: {
		NAME: NAME,
		VERSION: version,
		BUNDLED: "production",
	},
});
