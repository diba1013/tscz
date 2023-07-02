import type { IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";
import type { PackageConfig } from "@/config/package.resolver";
import type { Retriever } from "@/global.types";

export type PackageIntermediateConfigResolverOptions = {
	config: Retriever<PackageConfig>;
};

export class PackageIntermediateConfigResolver implements IntermediateConfigResolver {
	private readonly $config: Retriever<PackageConfig>;

	constructor({ config }: PackageIntermediateConfigResolverOptions) {
		this.$config = config;
	}

	async get(root: string): Promise<IntermediateConfig> {
		const {
			name,
			type = "commonjs",
			version,
			dependencies = {},
			peerDependencies = {},
		} = await this.$config.get(root);

		return {
			type,
			name,
			version,
			externals: this.externals({
				...dependencies,
				...peerDependencies,
			}),
		};
	}

	externals(dependencies: Record<string, string> = {}): string[] {
		return Object.keys(dependencies);
	}
}
