import fs from "fs/promises";
import path from "path";
import {
	Config,
	ExportConfig,
	IntermediateConfig,
	IntermediateConfigProvider,
	IntermediateConfigResolver,
} from "@/config/config.types";
import { Retriever } from "@/global.types";
import { File } from "@/util/resolver/file.resolver";
import { combine } from "@/util/array";
import { EsbuildBundler } from "@/bundler/esbuild.bundler";

const CONFIG_FILE_JS = "tscz.config.js";

export type BundleIntermediateConfigResolverOptions = {
	file: Retriever<File>;
	config: Retriever<Config>;
};

export class BundleIntermediateConfigResolver implements IntermediateConfigResolver {
	private readonly $file: Retriever<File>;
	private readonly $config: Retriever<Config>;

	private readonly $bundler = new EsbuildBundler({
		bundle: false,
	});

	constructor({ file, config }: BundleIntermediateConfigResolverOptions) {
		this.$file = file;
		this.$config = config;
	}

	public async get(): Promise<IntermediateConfig> {
		const [config, provider] = await Promise.all([this.config(), this.bundle()]);
		const result = await provider(config);
		return combine(config, result);
	}

	private async config(): Promise<Config> {
		return this.$config.get();
	}

	private async bundle(): Promise<IntermediateConfigProvider> {
		const { parent, path: input } = await this.$file.get();
		const output = path.resolve(parent, CONFIG_FILE_JS);

		const bundle = await this.$bundler.bundle({
			format: "cjs",
			inputs: [input],
			output,
		});
		try {
			await bundle.build();
		} finally {
			await bundle.dispose();
		}

		const config = await this.load(output);
		return (root) => {
			if (typeof config === "function") {
				return config(root);
			}
			return config;
		};
	}

	private async load(output: string): Promise<ExportConfig> {
		try {
			return await this.require(output);
		} finally {
			await fs.rm(output, {
				force: true,
			});
		}
	}

	private async require(output: string): Promise<ExportConfig> {
		const { default: result } = await import(output);
		return result;
	}
}
