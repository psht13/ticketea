import { describe, it, expect } from "vitest";
import { InMemoryGraphRepository } from "@/infra/repositories/InMemoryGraphRepository";
import { yensKShortestPaths } from "@/algorithms/yen";

describe("yensKShortestPaths", () => {
	it("returns up to K loopless shortest paths", async () => {
		const repo = new InMemoryGraphRepository([
			{ source: "A", target: "B", weight: 1 },
			{ source: "B", target: "D", weight: 1 },
			{ source: "A", target: "C", weight: 1 },
			{ source: "C", target: "D", weight: 1 },
			{ source: "B", target: "C", weight: 1 },
		]);
		const paths = await yensKShortestPaths(repo, "A", "D", 3);
		expect(paths.length).toBeGreaterThan(0);
		expect(paths[0].nodes).toEqual(["A", "B", "D"]);
		expect(paths[0].cost).toBe(2);
	});
}); 