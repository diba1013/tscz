import { BundleEntry, BundleOptions, Bundler } from "@/bundler/bundler.types";
import { Format } from "@/config/config.types";

export type GenericBundlerOptions = Partial<Record<Format, Bundler>>;

class GenericBundler implements Bundler {
	constructor(private readonly bundlers: GenericBundlerOptions) {}

	async bundle(entry: BundleEntry, options?: BundleOptions): Promise<void> {
		const bundler = this.bundlers[entry.format];
		if (bundler === undefined) {
			throw new Error(`Bundler not defined for format '${entry.format}'`);
		}
		await bundler.bundle(entry, options);
	}
}

export function generic(options: GenericBundlerOptions): Bundler {
	return new GenericBundler(options);
}
