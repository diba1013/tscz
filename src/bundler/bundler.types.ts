import { Platform } from "esbuild";
import { Config, Format } from "@/config/config.types";

export type BundleOptions = {
	target?: string;
	platform?: Platform;
	resolve?: {
		alias?: Record<string, string>;
	};
	externals?: string[];
	define?: Record<string, string>;
	watch?: boolean;
};

export type BundleEntry = {
	format: Format;
	inputs: string[];
	output: string;
	minify?: boolean;
};

export type BundleConfig = {
	entry: BundleEntry;
	options?: BundleOptions;
};

export interface BundleConfigRetriever {
	map(config: Config): Promise<BundleConfig[]>;
}

export interface Bundler {
	bundle(entry: BundleEntry, options?: BundleOptions): Promise<void>;
}
