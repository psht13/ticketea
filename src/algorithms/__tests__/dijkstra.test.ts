import { describe, it, expect } from "vitest";
import { InMemoryGraphRepository } from "@/infra/repositories/InMemoryGraphRepository";
import { dijkstraShortestPath } from "@/algorithms/dijkstra";

describe("dijkstraShortestPath", () => {
	it("finds shortest weighted path", async () => {
		const repo = new InMemoryGraphRepository([
			{ source: "A", target: "B", weight: 2 },
			{ source: "B", target: "C", weight: 2 },
			{ source: "A", target: "C", weight: 10 },
		]);
		const result = await dijkstraShortestPath(repo, "A", "C");
		expect(result).not.toBeNull();
		expect(result!.nodes).toEqual(["A", "B", "C"]);
		expect(result!.cost).toBe(4);
	});

	it("respects excluded edges", async () => {
		const repo = new InMemoryGraphRepository([
			{ source: "A", target: "B", weight: 1 },
			{ source: "B", target: "C", weight: 1 },
			{ source: "A", target: "C", weight: 3 },
		]);
		const result = await dijkstraShortestPath(repo, "A", "C", { excludeEdges: new Set(["A|B"]) });
		expect(result).not.toBeNull();
		expect(result!.nodes).toEqual(["A", "C"]);
		expect(result!.cost).toBe(3);
	});
}); 