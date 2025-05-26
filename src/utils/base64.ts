import type { MimeType } from "../types";
import { isRunningInNode } from "./environment";

export async function encodeToDataURL(
	ab: Uint8Array,
	type: MimeType,
): Promise<string> {
	if (isRunningInNode) {
		return `data:${type};base64,${Buffer.from(ab).toString("base64")}`;
	}
	const base64url = await new Promise<string>((resolve) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.readAsDataURL(new Blob([ab], { type }));
	});
	// remove the `data:...;base64,` part from the start
	return base64url;
}
