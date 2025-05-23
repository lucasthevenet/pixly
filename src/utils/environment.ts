export const isServiceWorker = "ServiceWorkerGlobalScope" in globalThis;

export const isRunningInCloudFlareWorkers =
  isServiceWorker &&
  typeof self !== "undefined" &&
  "caches" in globalThis &&
  "default" in globalThis.caches;

export const isRunningInNode =
  typeof process === "object" &&
  process.release &&
  process.release.name === "node";
