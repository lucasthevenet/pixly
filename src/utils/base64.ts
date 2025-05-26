import { fromByteArray, toByteArray } from "base64-js";
import { isRunningInNode } from "./environment";

export function encodeToBase64(ab: Uint8Array): string {
	if (isRunningInNode) {
		return Buffer.from(ab).toString("base64");
	}
	return fromByteArray(ab);
}

export function decodeFromBase64(str: string): Uint8Array {
	if (isRunningInNode) {
		const b = Buffer.from(str, "base64");
		return new Uint8Array(
			b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
		);
	}
	return toByteArray(str);
}
