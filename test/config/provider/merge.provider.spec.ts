import { describe, expect, it } from "vitest";
import type { ConfigResolver, IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";
import { MergeIntermediateConfigResolver } from "@/config/merge.provider";

function stub(config: IntermediateConfig): IntermediateConfigResolver {
	return {
		get() {
			return config;
		},
	};
}

describe("MergeIntermediateConfigRetriever", () => {
	it("should be empty if no configs have been provided", async () => {
		const cut: ConfigResolver = new MergeIntermediateConfigResolver([]);

		const result = await cut.get("");

		expect(result).to.be.empty;
	});

	it("should be empty if retruever return empty", async () => {
		const cut = new MergeIntermediateConfigResolver([stub({}), stub({})]);

		const result = await cut.get("");

		expect(result).to.be.empty;
	});

	it("should merge final config left to right", async () => {
		const cut: ConfigResolver = new MergeIntermediateConfigResolver([
			stub({
				name: "left",
				target: "esnext",
			}),
			stub({
				name: "middle",
			}),
			stub({
				version: "1.0.0",
				target: "latest",
				output: "dist",
			}),
		]);

		const result = await cut.get("");

		expect(result).to.eql({
			name: "middle",
			version: "1.0.0",
			target: "latest",
			output: "dist",
		});
	});

	it("should merge nested config left to right", async () => {
		const cut = new MergeIntermediateConfigResolver([
			stub([
				{
					name: "left",
					target: "esnext",
				},
				{
					name: "middle",
				},
				{
					version: "1.0.0",
					target: "latest",
					output: "dist",
				},
			]),
		]);

		const result = await cut.get("");

		expect(result).to.eql({
			name: "middle",
			version: "1.0.0",
			target: "latest",
			output: "dist",
		});
	});
});
