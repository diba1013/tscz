import { describe, expect, it } from "vitest";
import { PackageIntermediateConfigResolver } from "@/config/package.provider";
import { PackageConfig } from "@/config/package.resolver";
import { wrap } from "@/util/array";

describe("PackageIntermediateConfigRetriever", () => {
	it("should resolve versions and externals", async () => {
		const cut = new PackageIntermediateConfigResolver({
			config: {
				get(): PackageConfig {
					return {
						name: "test",
						type: "commonjs",
						version: "0.0.0",
						dependencies: {
							one: "0.0.0",
							three: "0.0.0",
						},
						peerDependencies: {
							two: "0.0.0",
						},
					};
				},
			},
		});

		const [response] = wrap(await cut.get(""));

		expect(response).to.deep.include({
			name: "test",
			version: "0.0.0",
			externals: ["one", "three", "two"],
		});
	});
});
