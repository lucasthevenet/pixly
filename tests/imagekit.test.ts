import { expect, it } from "vitest";
import { px } from "../src/index";
import { getTestImage } from "./utils";

it("API surface - functional builder should allow chaining of transformation methods", async () => {
	const input = await getTestImage("small");

	const chainedBuilder = await px
		.decoder(px.auto())
		.encoder(px.jpeg.encode())
		.apply(px.flip("horizontal"))
		.apply(
			px.crop({
				height: 10,
				width: 10,
				x: 0,
				y: 0,
				background: [0, 0, 0, 0],
			}),
		)
		.process(input);

	expect(typeof chainedBuilder.toBuffer).toBe("function");
	expect(typeof chainedBuilder.toBlob).toBe("function");
	expect(typeof chainedBuilder.toDataURL).toBe("function");
});

it("API surface - functional builder should accept OutputOptions in output methods", async () => {
	const input = await getTestImage("small");

	const result = await px
		.encoder(px.webp.encode())
		.decoder(px.auto())
		.process(input);
	expect(result.toBuffer()).toBeInstanceOf(Uint8Array);

	expect(result.toDataURL()).toBeTypeOf("string");

	expect(result.toBlob()).toBeInstanceOf(Blob);
});

it("Functional builder advanced - should support complex transformation chains", async () => {
	const input = await getTestImage("small");

	const chainedBuilder = await px
		.decoder(px.auto())
		.encoder(px.jpeg.encode())
		.apply(
			px.resize({
				width: 400,
				height: 300,
				background: [0, 0, 0, 0],
				fit: "contain",
				position: "center",
			}),
		)
		.apply(px.rotate(45, [128, 128, 128, 255]))
		.apply(px.flip("vertical"))
		.apply(
			px.crop({
				x: 50,
				y: 50,
				width: 200,
				height: 200,
				background: [255, 255, 255, 255],
			}),
		)
		.process(input);

	expect(typeof chainedBuilder.toBuffer).toBe("function");
});

it("Functional builder advanced - should maintain builder state across operations", async () => {
	const step1 = px.apply(
		px.resize({
			width: 100,
			height: 100,
			background: [0, 0, 0, 0],
			fit: "contain",
			position: "center",
		}),
	);
	const step2 = step1.apply(px.rotate(90, [0, 0, 0, 0]));
	const step3 = step2.apply(px.flip("horizontal"));

	// Each step should return a new builder
	expect(step1).not.toBe(px);
	expect(step2).not.toBe(step1);
	expect(step3).not.toBe(step2);
});
