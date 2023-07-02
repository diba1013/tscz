import type { Format } from "@/config/config.types";
import type { MaybePromise, Retriever } from "@/global.types";
import type { Platform } from "esbuild";

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

export type BundleConfigRetriever = Retriever<Bundle>;

export type BundleOutput = {
	file: string;
};

export interface Bundle {
	build(): MaybePromise<BundleOutput[]>;

	dispose(): MaybePromise<void>;
}

export interface Bundler {
	bundle(entry: BundleEntry, options?: BundleOptions): MaybePromise<Bundle>;
}

export type BundlerFunction = (entry: BundleEntry, options?: BundleOptions) => MaybePromise<Bundle>;
