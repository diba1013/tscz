import path from "path";
import { CompilerOptions, ScriptTarget } from "typescript";
import { describe, expect, it } from "vitest";
import { TypeScriptConfig } from "@/util/resolver/typescript.resolver";
import { TypescriptIntermediateConfigResolver } from "@/config/typescript.provider";
import { Retriever } from "@/global.types";

function stub(compilerOptions: CompilerOptions): Retriever<TypeScriptConfig> {
	return {
		get() {
			return {
				compilerOptions,
			};
		},
	};
}

describe("TypescriptIntermediateConfigRetriever", () => {
	it("should use sensible defaults if none provided", async () => {
		const cut = new TypescriptIntermediateConfigResolver(stub({}));

		const response = await cut.get();

		expect(response).to.deep.equal({
			output: "dist",
			target: "esnext",
			resolve: {
				alias: {},
			},
		});
	});

	it("should map latest to esnext", async () => {
		const cut = new TypescriptIntermediateConfigResolver(
			stub({
				target: ScriptTarget.Latest,
			}),
		);

		const response = await cut.get();

		expect(response).to.have.property("target", "esnext");
	});

	it("should transform target to lowercase", async () => {
		const cut = new TypescriptIntermediateConfigResolver(
			stub({
				target: ScriptTarget.ES2022,
			}),
		);

		const response = await cut.get();

		expect(response).to.have.property("target", "es2022");
	});

	it("should resolve paths to base url", async () => {
		const cut = new TypescriptIntermediateConfigResolver(
			stub({
				baseUrl: "src",
				paths: {
					"@/": ["util/"],
				},
			}),
		);

		const result = await cut.get();

		expect(result).to.deep.include({
			resolve: {
				alias: {
					"@/": path.resolve("src", "util"),
				},
			},
		});
	});

	it("should remove trailing wildcards from paths", async () => {
		const cut = new TypescriptIntermediateConfigResolver(
			stub({
				paths: {
					"@/*": ["src/*"],
				},
			}),
		);

		const result = await cut.get();

		expect(result).to.deep.include({
			resolve: {
				alias: {
					"@/": path.resolve(process.cwd(), "src"),
				},
			},
		});
	});
});
