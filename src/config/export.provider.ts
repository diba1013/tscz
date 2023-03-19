import type { Config, ExportConfig, IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";
import type { Retriever } from "@/global.types";
import { combine } from "@/util/array";

export type ExportIntermediateConfigProviderOptions = {
	bundle: Retriever<ExportConfig>;
	config: Retriever<Config>;
};

export class ExportIntermediateConfigProvider implements IntermediateConfigResolver {
	private readonly $bundle: Retriever<ExportConfig>;
	private readonly $config: Retriever<Config>;

	constructor({ bundle, config }: ExportIntermediateConfigProviderOptions) {
		this.$bundle = bundle;
		this.$config = config;
	}

	async get(root: string): Promise<IntermediateConfig> {
		const [bundle, config] = await Promise.all([this.$bundle.get(root), this.$config.get(root)]);
		return combine(config, await this.resolve(bundle, config));
	}

	async resolve(bundle: ExportConfig, config: Config): Promise<IntermediateConfig> {
		if (typeof bundle === "function") {
			return await bundle(config);
		}
		return bundle;
	}
}
