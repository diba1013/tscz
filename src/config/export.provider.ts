import type { Bundler } from "@/bundler/bundler.types";
import type { Config, ExportConfig, IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";
import type { Retriever } from "@/global.types";
import { ConvertingBundleConfigRetriever } from "@/bundler/config.provider";
import { combine } from "@/util/array";
import path from "node:path";
import { unlink } from "node:fs/promises";

const CONFIG_FILE_TS = "tscz.config.ts";

type BundledExportConfig = {
	default: ExportConfig & Partial<BundledExportConfig>;
};

export type ExportConfigRetrieverProvider = {
	bundler: Bundler;
	config: Retriever<Config>;
};

export class ExportConfigRetriever implements IntermediateConfigResolver {
	private readonly $bundler: Bundler;
	private readonly $config: Retriever<Config>;

	constructor({ bundler, config }: ExportConfigRetrieverProvider) {
		this.$bundler = bundler;
		this.$config = config;
	}

	async get(root: string): Promise<IntermediateConfig> {
		const config = await this.$config.get(root);
		const bundle = await this.load(root, config);
		return combine(config, await this.resolve(bundle, config));
	}

	private async resolve(bundle: ExportConfig, config: Config): Promise<IntermediateConfig> {
		if (typeof bundle === "function") {
			return await bundle(config);
		}
		return bundle;
	}

	private async load(root: string, config: Config) {
		const output = await this.bundle(root, config);
		try {
			return await this.require(output);
		} finally {
			await unlink(output);
		}
	}

	private async bundle(root: string, { type = "commonjs" }: Config): Promise<string> {
		const retriever = new ConvertingBundleConfigRetriever({
			config: {
				get(root) {
					return {
						type,
						platform: "node",
						output: root,
						entries: [
							{
								name: "tscz.config",
								input: path.resolve(root, CONFIG_FILE_TS),
								output: "cjs",
								bundle: false,
							},
						],
					};
				},
			},
			bundler: this.$bundler,
		});

		const bundle = await retriever.get(root);
		try {
			const [output] = await bundle.build();
			return output.file;
		} finally {
			await bundle.dispose();
		}
	}

	private async require(output: string): Promise<ExportConfig> {
		// Using import should be fine, since this is compiled code
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { default: bundle }: BundledExportConfig = await import(output);
		// Re-access default export in case of bundled output
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return bundle.default ?? bundle;
	}
}
