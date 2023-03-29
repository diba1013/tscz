import path from "node:path";
import { unlink } from "node:fs/promises";
import type { ExportConfig } from "@/config/config.types";
import type { Retriever } from "@/global.types";
import { Bundler } from "@/bundler/bundler.types";

const CONFIG_FILE_TS = "tscz.config.ts";
const CONFIG_FILE_JS = "tscz.config.js";

export class ExportConfigRetriever implements Retriever<ExportConfig> {
	private readonly $bundler: Bundler;

	constructor(bundler: Bundler) {
		this.$bundler = bundler;
	}

	async get(parent: string): Promise<ExportConfig> {
		const input = path.resolve(parent, CONFIG_FILE_TS);
		const output = path.resolve(parent, CONFIG_FILE_JS);

		try {
			await this.bundle(input, output);
			return await this.require(output);
		} finally {
			await unlink(output);
		}
	}

	private async bundle(input: string, output: string) {
		const bundle = await this.$bundler.bundle({
			bundle: false,
			format: "cjs",
			inputs: [input],
			output,
		});
		try {
			await bundle.build();
		} finally {
			await bundle.dispose();
		}
	}

	private async require(output: string): Promise<ExportConfig> {
		const { default: result } = await import(output);
		return result.default ?? result;
	}
}
