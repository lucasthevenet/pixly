import { isRunningInNode } from "../src/utils/environment";

export async function getTestImage(
  type: "square" | "small" | "original" | "medium" | "large" = "small"
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
  filename: string
) {
  if (typeof window === "undefined") {
    const fs = await import("node:fs");
    const buffer =
      imageData instanceof ArrayBuffer ? Buffer.from(imageData) : imageData;

    await fs.promises.writeFile(filename, buffer);
  }
}
