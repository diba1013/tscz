#!/usr/bin/env node

import os from "node:os";
import path from "node:path";
import { ThreadPool, yieldMicrotask } from "nanothreads";
import { run } from "@/run";
import { BundleConfig } from "@/bundler/bundler.types";

// eslint-disable-next-line unicorn/prefer-module
const WORKER_FILE = path.resolve(__dirname, "../dist/worker.mjs");

run(async (entries) => {
	const pool = new ThreadPool<BundleConfig, void>({
		task: WORKER_FILE,
		type: "module",
		count: os.cpus().length,
	});

	return {
		async build() {
			await Promise.all(
				entries.map(async (entry) => {
					await pool.exec(entry);
				}),
			);
		},

		async watch() {
			// Ignore
		},

		async dispose() {
			await yieldMicrotask(); // Allow for console flush
			await pool.terminate();
		},
	};
});
