import { version } from "./package.json";
import { defineConfig } from "@/index";

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
			output: ["cjs"],
		},
	],
	define: {
		__NAME__: NAME,
		__VERSION__: version,
	},
});
