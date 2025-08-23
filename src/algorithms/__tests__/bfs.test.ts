import { describe, it, expect } from "vitest";
import { InMemoryGraphRepository } from "@/infra/repositories/InMemoryGraphRepository";
import { bfsShortestPath } from "@/algorithms/bfs";

describe("bfsShortestPath", () => {
	it("finds shortest hop path", async () => {
		const repo = new InMemoryGraphRepository([
			{ source: "A", target: "B" },
			{ source: "B", target: "C" },
			{ source: "A", target: "C" },
		], true);
		const result = await bfsShortestPath(repo, "A", "C");
		expect(result).not.toBeNull();
		expect(result!.nodes).toEqual(["A", "C"]);
		expect(result!.cost).toBe(1);
	});
}); 