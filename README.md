# tscz

A small wrapper for esbuild rollup libraries.

The main purpose of this executable is to provide a small wrapper around esbuild for bundling small typescript libraries.
This is more of an experiment for how esbuild actually works and generally a more established bundler should be preferred in production environments. Still this library should fullfil its purpose by focussing conventions and usability over feature completion and completeness.

### Installation

Add github as npm registry within `.npmrc`:

```bash
@diba1013:registry=https://npm.pkg.github.com
```

Then, add the dependency with the following command:

```
npm add @diba1013/di
```

### Build

```sh
npx tscz build
```

Bundles for `cjs` and `esm` are consumed by esbuild, whereas `dts` is consumed by rollup.
Each of the generated bundles is compiled within a separate thread to ensure maximum performance.

By default `./src/index.ts` is compiled into `./dist/` as `esm`, `cjs` and `dts` using the provided `package.json` and `tsconfig.json`.

### Watch

```bash
npx tscz watch
```

Watch mode will watch for file changes within the current directory, ignoring common directories.
The watch directories can be configured using `watch` and a change within these directions will trigger all bundle builds.

### Configuration

#### tscz.config.ts

```ts
import { defineConfig } from "@diba1013/tscz";

// For a full configuration, please refer to the property documentation.
export default defineConfig({
    entries: [
		{
			name: "index",
			input: "src/index.ts",
			output: ["cjs", "esm", "dts"],
		},
		{
			name: "cli",
			input: "src/cli.ts",
			output: ["cjs"],
		},
    ]
})
```
