import { ExportConfig } from "@/config/config.types";

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const VERSION: string = "__VERSION__";

export * from "@/config/config.types";
export * from "@/global.types";

/**
 * Provides a small wrapper for typescript to infer return type.
 *
 * @param config The config to use
 * @returns The same input config passed in config
 */
export function defineConfig(config: ExportConfig): ExportConfig {
	return config;
}
