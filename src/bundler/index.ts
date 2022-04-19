import { EsbuildOptions, esbuild } from "@/bundler/esbuild.bundler";
import { roll } from "@/bundler/rollup.bundler";
import { Bundler } from "@/bundler/bundler.types";
import { GenericBundlerOptions, generic } from "@/bundler/generic.bundler";

export type { EsbuildOptions } from "@/bundler/esbuild.bundler";
export * from "@/bundler/bundler.types";

export const Bundlers = {
	esbuild(options?: EsbuildOptions): Bundler {
		return esbuild(
			options ?? {
				bundle: true,
			},
		);
	},

	rollup(): Bundler {
		return roll();
	},

	generic(options?: GenericBundlerOptions): Bundler {
		return generic(
			options ?? {
				dts: this.rollup(),
				cjs: this.esbuild({
					bundle: true,
				}),
				esm: this.esbuild({
					bundle: true,
				}),
			},
		);
	},
};
