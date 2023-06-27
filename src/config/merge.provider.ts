import type { Config, ConfigResolver, IntermediateConfigResolver } from "@/config/config.types";

import { merge } from "@/util/array";

export class MergeIntermediateConfigResolver implements ConfigResolver {
	constructor(private readonly retrievers: IntermediateConfigResolver[]) {}

	public async get(root: string): Promise<Config> {
		const configs = await Promise.all(
			this.retrievers.map(async (retriever) => {
				return merge(await retriever.get(root));
			}),
		);
		return merge(configs);
	}
}
