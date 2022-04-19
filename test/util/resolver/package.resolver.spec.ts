import { describe, expect, it } from "vitest";
import { PackageConfigRetriever } from "@/util/resolver/package.resolver";
import { File } from "@/util/resolver/file.resolver";

describe("package", () => {
	it("should find file if in current directory", async () => {
		const name = "test";
		const version = "0.0.0";

		const cut = new PackageConfigRetriever({
			get(): File {
				return {
					parent: "/",
					path: "/package.json",
					content: `{
						"name": "${name}",
						"version": "${version}"
					}`,
				};
			},
		});

		const result = await cut.get();

		expect(result).to.have.property("name", name);
		expect(result).to.have.property("version", version);
	});
});
