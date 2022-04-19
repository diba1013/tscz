import { IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";
import { Retriever } from "@/global.types";
import { PackageConfig } from "@/util/resolver/package.resolver";

export class PackageIntermediateConfigResolver implements IntermediateConfigResolver {
	constructor(private readonly config: Retriever<PackageConfig>) {}

	async get(): Promise<IntermediateConfig> {
		const { name, type, version, dependencies, peerDependencies } = await this.config.get();

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
