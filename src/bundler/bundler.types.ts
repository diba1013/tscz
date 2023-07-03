import type { Format } from "@/config/config.types";
import type { MaybePromise, Retriever } from "@/global.types";
import type { Platform } from "esbuild";

export type BundleEntry = {
	format: Format;
	inputs: string[];
	output: string;
	bundle?: boolean;
	minify?: boolean;
	target?: string;
	platform?: Platform;
	resolve?: {
		alias?: Record<string, string>;
	};
	externals?: string[];
	env?: Record<string, string>;
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
	bundle(entry: BundleEntry): MaybePromise<Bundle>;
}

export type BundlerFunction = (entry: BundleEntry) => MaybePromise<Bundle>;
