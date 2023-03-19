import { parentPort } from "worker_threads";
import { workerInit } from "nanothreads";
import { bundle } from "@/bundler/bundler.worker";

workerInit(parentPort, bundle);
