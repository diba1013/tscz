import type { IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";

import type { MaybePromise } from "@/global.types";

export class StandardIntermediateConfigResolver implements IntermediateConfigResolver {
	private readonly $files: string[];

	constructor(...files: string[]) {
		this.$files = files;
	}

	public get(): MaybePromise<IntermediateConfig> {
		return this.$files.map((file) => {
			return {
				output: "dist",
				target: "esnext",
				entries: [
					{
						name: file,
						input: `src/${file}.ts`,
						output: ["cjs", "esm", "dts"],
					},
				],
			};
		});
	}
}
