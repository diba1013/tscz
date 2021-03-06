import path from "path";
import { BundleConfig, BundleConfigRetriever, BundleEntry, BundleOptions } from "@/bundler/bundler.types";
import {
	Config,
	ConfigEntry,
	ConfigEntryOutput,
	ConfigEntryOutputList,
	Format,
	FormatObject,
	Module,
} from "@/config/config.types";
import { wrap } from "@/util/array";

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

class ConvertingBundleConfigRetriever implements BundleConfigRetriever {
	async map(config: Config): Promise<BundleConfig[]> {
		const options: BundleOptions = {
			target: config.target,
			platform: config.platform,
			resolve: config.resolve,
			externals: config.externals,
			define: config.define,
			watch: config.watch,
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

	private *toBundleEntry({ name, input, output }: ConfigEntry, config: Config): Generator<BundleEntry> {
		for (const entry of this.toFormatObjects(output)) {
			const base = `${name ?? config.name ?? "index"}.${this.extension(entry.format, config.type)}`;
			const file = entry.file ?? base;

			yield {
				format: entry.format,
				inputs: wrap(input),
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

export function convert(): BundleConfigRetriever {
	return new ConvertingBundleConfigRetriever();
}
