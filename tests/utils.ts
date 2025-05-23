export async function getTestImage(
  type: "square" | "small" | "original" | "medium" | "large" = "small",
) {
  if (typeof window === "undefined") {
    const fs = await import("node:fs");

    const result = await fs.promises.readFile(`public/image_${type}.jpg`);

    return result;
  }
  const response = await fetch("/test-1.png");

  if (!response.ok) {
    throw new Error("Failed retrieving test image");
  }

  return response.arrayBuffer();
}
