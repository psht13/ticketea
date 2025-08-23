import { GraphRepository } from "@/domain/ports";
import { GraphTraversalOptions, NodeId, PathResult } from "@/domain/types";
import { dijkstraShortestPath } from "./dijkstra";

function makeEdgeKey(a: NodeId, b: NodeId): string {
	return `${a}|${b}`;
}

export async function yensKShortestPaths(
	repo: GraphRepository,
	start: NodeId,
	goal: NodeId,
	k: number,
	options?: GraphTraversalOptions
): Promise<PathResult[]> {
	if (k <= 0) return [];
	const A: PathResult[] = [];

	const first = await dijkstraShortestPath(repo, start, goal, options);
	if (!first) return [];
	A.push(first);

	for (let kIndex = 1; kIndex < k; kIndex++) {
		const prevPath = A[kIndex - 1];
		let bestCandidate: PathResult | null = null;

		for (let i = 0; i < prevPath.nodes.length - 1; i++) {
			const spurNode = prevPath.nodes[i];
			const rootPathNodes = prevPath.nodes.slice(0, i + 1);
			const excludeEdges = new Set<string>(options?.excludeEdges);
			const excludeNodes = new Set<NodeId>(options?.excludeNodes);

			for (const path of A) {
				const sameRoot = path.nodes.slice(0, i + 1).join("|") === rootPathNodes.join("|");
				if (sameRoot && i < path.nodes.length - 1) {
					const edgeKey = makeEdgeKey(path.nodes[i], path.nodes[i + 1]);
					excludeEdges.add(edgeKey);
				}
			}

			for (const node of rootPathNodes.slice(0, -1)) {
				excludeNodes.add(node);
			}

			const spur = await dijkstraShortestPath(
				repo,
				spurNode,
				goal,
				{ excludeEdges, excludeNodes }
			);
			if (!spur) continue;

			const rootCost = await pathCost(repo, rootPathNodes);
			const totalCost = rootCost + spur.cost;
			const totalPath: PathResult = {
				nodes: [...rootPathNodes.slice(0, -1), ...spur.nodes],
				cost: totalCost,
			};

			if (!bestCandidate || totalCost < bestCandidate.cost) {
				bestCandidate = totalPath;
			}
		}

		if (!bestCandidate) break;
		A.push(bestCandidate);
	}

	return A;
}

async function pathCost(repo: GraphRepository, nodes: NodeId[]): Promise<number> {
	let cost = 0;
	for (let i = 0; i < nodes.length - 1; i++) {
		const current = nodes[i];
		const next = nodes[i + 1];
		const neighbors = await repo.getOutgoingNeighbors(current);
		const edge = neighbors.find((n) => n.nodeId === next);
		if (!edge) return Number.POSITIVE_INFINITY;
		cost += edge.weight ?? 1;
	}
	return cost;
} 