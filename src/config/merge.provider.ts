import { Config, ConfigResolver, IntermediateConfigResolver } from "@/config/config.types";
import { merge } from "@/util/array";

export class MergeIntermediateConfigResolver implements ConfigResolver {
	constructor(private readonly retrievers: IntermediateConfigResolver[]) {}

	public async get(): Promise<Config> {
		const configs = await Promise.all(
			this.retrievers.map(async (retriever) => {
				return merge(await retriever.get());
			}),
		);
		return merge(configs);
	}
}
