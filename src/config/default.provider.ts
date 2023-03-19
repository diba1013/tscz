import type { IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";
import type { MaybePromise } from "@/global.types";

export class StandardIntermediateConfigResolver implements IntermediateConfigResolver {
	constructor(private readonly file: string) {}

	public get(): MaybePromise<IntermediateConfig> {
		return {
			output: "dist",
			target: "esnext",
			entries: [
				{
					name: this.file,
					input: `src/${this.file}.ts`,
					output: ["cjs", "esm", "dts"],
				},
			],
		};
	}
}
