import { isRunningInNode } from "./environment";

export function encodeToBase64(ab: Uint8Array): string {
	if (isRunningInNode) {
		return Buffer.from(ab).toString("base64");
	}

	// For browser: Use native btoa with efficient conversion
	// For small data (< 512KB), use simple approach
	if (ab.length < 512 * 1024) {
		return btoa(String.fromCharCode(...ab));
	}

	// For large data, use reduce to avoid call stack issues
	const CHUNK_SIZE = 0x8000; // 32KB chunks to avoid call stack overflow
	let binaryString = '';
	
	for (let i = 0; i < ab.length; i += CHUNK_SIZE) {
		const chunk = ab.subarray(i, i + CHUNK_SIZE);
		binaryString += String.fromCharCode.apply(null, Array.from(chunk));
	}
	
	return btoa(binaryString);
}

export function decodeFromBase64(str: string): Uint8Array {
	if (isRunningInNode) {
		const b = Buffer.from(str, "base64");
		return new Uint8Array(
			b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
		);
	}

	// For browser: Use native atob
	const binaryString = atob(str);
	const bytes = new Uint8Array(binaryString.length);
	
	// Use a more efficient loop for large data
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	
	return bytes;
}