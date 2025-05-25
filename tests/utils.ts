import { isRunningInNode } from "../src/utils/environment";

export async function getTestImage(
	type: "square" | "small" | "original" | "medium" | "large" = "small",
) {
	if (isRunningInNode) {
		const fs = await import("node:fs");

		const result = await fs.promises.readFile(`tests/assets/image_${type}.jpg`);

		return result;
	}

	const response = await fetch(`/tests/assets/image_${type}.jpg`);

	if (!response.ok) {
		throw new Error("Failed retrieving test image");
	}

	return response.arrayBuffer();
}

export async function saveTestImage(
	imageData: ArrayBuffer | Buffer,
	filename: string,
) {
	if (typeof window === "undefined") {
		const fs = await import("node:fs");
		const buffer =
			imageData instanceof ArrayBuffer ? Buffer.from(imageData) : imageData;

		await fs.promises.writeFile(filename, buffer);
	}
}

// Build complex operation chains
const instagramPreset = pixly()
	.apply(resize({ width: 1080, height: 1080, fit: "cover" }))
	.apply(sharpen(1.1))
	.apply(brightness(1.05))
	.preset(); // Returns single composed operation

// Everything goes through .apply() with single operations
const result = await pixly()
	.decoder(auto())
	.apply(resize({ width: 100 })) // Built-in operation
	.apply(instagramPreset.preset()) // Preset operation
	.encoder(webp({ quality: 0.8 }))
	.process(inputImage);

const blob = result.toBlob();
