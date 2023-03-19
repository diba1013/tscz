import path from "node:path";
import { unlink } from "node:fs/promises";
import { bundle } from "@/bundler/bundler.worker";
import type { ExportConfig } from "@/config/config.types";
import type { Retriever } from "@/global.types";

const CONFIG_FILE_TS = "tscz.config.ts";
const CONFIG_FILE_JS = "tscz.config.js";

export class ExportConfigRetriever implements Retriever<ExportConfig> {
	async get(parent: string): Promise<ExportConfig> {
		const input = path.resolve(parent, CONFIG_FILE_TS);
		const output = path.resolve(parent, CONFIG_FILE_JS);

		await bundle({
			entry: {
				bundle: false,
				format: "cjs",
				inputs: [input],
				output,
			},
		});

		return await this.load(output);
	}

	private async load(output: string): Promise<ExportConfig> {
		try {
			return await this.require(output);
		} finally {
			await unlink(output);
		}
	}

	private async require(output: string): Promise<ExportConfig> {
		const { default: result } = await import(output);
		return result.default ?? result;
	}
}
