#!/usr/bin/env node

import { bundle } from "@/bundler/bundler.worker";
import { run } from "@/run";

run(async (entries) => {
	return {
		async build() {
			await Promise.all(
				entries.map(async (entry) => {
					await bundle(entry);
				}),
			);
		},

		async watch() {
			// Ignore
		},

		async dispose() {
			// Ignore
		},
	};
});
