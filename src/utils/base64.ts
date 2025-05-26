import { isRunningInNode } from "./environment";

export async function bytesToBase64DataUrl(
	bytes: Uint8Array,
	type = "application/octet-stream",
) {
	if (isRunningInNode) {
		return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
	}

	return await new Promise((resolve, reject) => {
		const reader = Object.assign(new FileReader(), {
			onload: () => resolve(reader.result),
			onerror: () => reject(reader.error),
		});
		reader.readAsDataURL(new File([bytes], "", { type }));
	});
}

export async function dataUrlToBytes(dataUrl: string) {
	if (isRunningInNode) {
		const base64 = dataUrl.split(",")[1]!;
		const b = Buffer.from(base64, "base64");
		return new Uint8Array(
			b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
		);
	}

	const res = await fetch(dataUrl);
	return new Uint8Array(await res.arrayBuffer());
}
