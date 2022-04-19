import { MaybeArray, MaybePromise, Retriever } from "@/global.types";

export type Platform = "browser" | "node" | "neutral";
export type Format = "esm" | "cjs" | "dts";
export type Module = "module" | "commonjs";

export type Config = {
	/**
	 * The module format to resolve files with.
	 *
	 * Defaults to nearest `package.json`.
	 *
	 * @see https://nodejs.org/api/packages.html#type
	 */
	type?: Module;

	/**
	 * The name of the libary. May be used for file naming.
	 *
	 * Defaults to nearest `package.json`.
	 *
	 * @see https://nodejs.org/api/packages.html#name
	 */
	name?: string;

	/**
	 * The version of the library. May be used in log output.
	 *
	 * Defaults to nearest `package.json`.
	 *
	 * @see https://docs.npmjs.com/about-semantic-versioning
	 */
	version?: string;

	/**
	 * Where to place the build files at.
	 *
	 * Defaults to the nearest `tsconfig.json`, otherwise `dist`.
	 *
	 * @see https://www.typescriptlang.org/tsconfig#outDir
	 */
	output?: string;

	/**
	 * The build target to compile the files with.
	 *
	 * Defaults to the nearest `tsconfig.json`, otherwise `esnext`.
	 *
	 * @see https://esbuild.github.io/api/#target
	 */
	target?: string;

	/**
	 * The platform to build for.
	 *
	 * Defaults to `node`.
	 *
	 * @see https://esbuild.github.io/api/#platform
	 */
	platform?: Platform;

	/**
	 * Whether to watch for file changes.
	 */
	watch?: boolean;

	/**
	 * The different entries to compile to the output directory.
	 */
	entries?: ConfigEntry[];

	/**
	 * Use custom resolver symbols.
	 */
	resolve?: {
		/**
		 * Defines path aliases. Should use full paths to avoid strange behavior.
		 *
		 * Defaults to the nearest `tsconfig.json`, otherwise empty.
		 *
		 * @see https://www.typescriptlang.org/tsconfig#paths
		 * @see https://www.npmjs.com/package/esbuild-plugin-alias
		 */
		alias?: Record<string, string>;
	};

	/**
	 * Define external dependencies which will not be bundled.
	 *
	 * Defaults to nearest `package.json`, both `dependencies` and `peerDependencies` are merged.
	 *
	 * @see https://esbuild.github.io/api/#external
	 */
	externals?: string[];

	/**
	 * Define global constant replacements.
	 *
	 * @see https://esbuild.github.io/api/#define
	 * @see https://www.npmjs.com/package/esbuild-plugin-replace
	 */
	define?: Record<string, string>;
};

export type ConfigEntry = {
	/**
	 * The name of the file to be used in output file generation.
	 */
	name?: string;
	/**
	 * The file to bundle. Should be an absolute path.
	 */
	input: string;
	/**
	 * The output configuration.
	 */
	output: ConfigEntryOutput | ConfigEntryOutputList;
};

export type ConfigEntryOutput = Format | FormatObject;
export type ConfigEntryOutputList = ConfigEntryOutput[];

export type FormatObject = {
	/**
	 * The format to compile to.
	 */
	format: Format;
	/**
	 * The output file, relative to the output directory.
	 */
	file?: string;
};

export type IntermediateConfig = MaybeArray<Config>;
export type IntermediateConfigProvider = (config: Config) => MaybePromise<IntermediateConfig>;
export type ExportConfig = IntermediateConfig | IntermediateConfigProvider;

export type ConfigResolver = Retriever<Config>;
export type IntermediateConfigResolver = Retriever<IntermediateConfig>;
