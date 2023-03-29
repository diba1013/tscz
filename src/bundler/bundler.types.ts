import type { Platform } from "esbuild";
import type { Config, Format } from "@/config/config.types";

export type BundleOptions = {
	target?: string;
	platform?: Platform;
	resolve?: {
		alias?: Record<string, string>;
	};
	externals?: string[];
	env?: Record<string, string>;
};

export type BundleEntry = {
	format: Format;
	inputs: string[];
	output: string;
	bundle?: boolean;
	minify?: boolean;
};

export type BundleConfig = {
	entry: BundleEntry;
	options?: BundleOptions;
};

export interface BundleConfigRetriever {
	map(config: Config): Promise<BundleConfig[]>;
}

export interface Bundle {
	build(): Promise<void>;

	dispose(): Promise<void>;
}

export interface Bundler {
	bundle(entry: BundleEntry, options?: BundleOptions): Promise<Bundle>;
}

export type BundlerFunction = (entry: BundleEntry, options?: BundleOptions) => Promise<Bundle>;
