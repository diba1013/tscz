import type {
	Bundle,
	BundleConfig,
	BundleConfigRetriever,
	BundleEntry,
	BundleOptions,
	Bundler,
} from "@/bundler/bundler.types";
import type {
	Config,
	ConfigEntry,
	ConfigEntryOutput,
	ConfigEntryOutputList,
	Format,
	FormatObject,
	IntermediateConfig,
	Module,
} from "@/config/config.types";
import { Retriever } from "@/global.types";
import { wrap } from "@/util/array";
import path from "node:path";
import pc from "picocolors";

const EXTENSIONS: Record<Module, Record<Format, string>> = {
	commonjs: {
		cjs: "js",
		esm: "mjs",
		dts: "d.ts",
	},
	module: {
		cjs: "cjs",
		esm: "js",
		dts: "d.ts",
	},
};

export type ConvertingBundleConfigRetrieverProvider = {
	config: Retriever<IntermediateConfig>;
	bundler: Bundler;
};

export class ConvertingBundleConfigRetriever implements BundleConfigRetriever {
	private readonly $config: Retriever<IntermediateConfig>;
	private readonly $bundler: Bundler;

	constructor({ config, bundler }: ConvertingBundleConfigRetrieverProvider) {
		this.$config = config;
		this.$bundler = bundler;
	}

	async get(root: string): Promise<Bundle> {
		const start = Date.now();
		const configs = await this.$config.get(root);
		// Remap configs to bundles
		const entries: BundleConfig[] = [];
		for (const config of wrap(configs)) {
			const unwrapped = this.map(config);
			entries.push(...unwrapped);
		}
		// compile bundles
		const bundles = await Promise.all(
			entries.map(async ({ entry, options }) => {
				return await this.$bundler.bundle(entry, options);
			}),
		);

		console.info(`${pc.blue("[cli]")} ${pc.dim(`Warm up in ${Date.now() - start}ms`)}`);
		return {
			async build() {
				const start = Date.now();
				try {
					console.info(`${pc.blue("[cli]")} Bundling ${bundles.length} configurations...`);
					const outputs = await Promise.all(
						bundles.map(async (bundle) => {
							return bundle.build();
						}),
					);
					return outputs.flat();
				} finally {
					const end = Date.now() - start;
					console.info(`${pc.blue("[cli]")} Done bundling in ${end}ms`);
				}
			},

			async dispose() {
				const start = Date.now();
				try {
					await Promise.all(
						bundles.map((bundle) => {
							return bundle.dispose();
						}),
					);
				} finally {
					const end = Date.now() - start;
					console.info(
						`${pc.blue("[cli]")} ${pc.dim(`Disposed ${bundles.length} configurations in ${end}ms`)}\n`,
					);
				}
			},
		};
	}

	private map(config: Config): BundleConfig[] {
		const options: BundleOptions = {
			target: config.target,
			platform: config.platform,
			resolve: config.resolve,
			externals: config.externals,
			env: config.env,
		};

		const entries = [...this.toBundleEntries(config)];
		return entries.map((entry) => {
			return {
				entry,
				options,
			};
		});
	}

	private *toBundleEntries(config: Config): Generator<BundleEntry> {
		for (const entry of config.entries ?? []) {
			for (const bundle of this.toBundleEntry(entry, config)) {
				yield bundle;
			}
		}
	}

	private *toBundleEntry(
		{ name, input, output, bundle, minify }: ConfigEntry,
		config: Config,
	): Generator<BundleEntry> {
		for (const entry of this.toFormatObjects(output)) {
			const base = `${name ?? config.name ?? "index"}.${this.extension(entry.format, config.type)}`;
			const file = entry.file ?? base;

			yield {
				format: entry.format,
				inputs: wrap(input),
				bundle,
				minify,
				output: path.resolve(config.output ?? "dist", file),
			};
		}
	}

	private *toFormatObjects(entries: ConfigEntryOutput | ConfigEntryOutputList): Generator<FormatObject> {
		for (const entry of wrap(entries)) {
			yield this.toFormatObject(entry);
		}
	}

	private toFormatObject(output: ConfigEntryOutput): FormatObject {
		if (typeof output === "string") {
			return {
				format: output,
			};
		}
		return output;
	}

	private extension(format: Format, type: Module = "commonjs"): string {
		return EXTENSIONS[type]?.[format] ?? "js";
	}
}
