import { GraphRepository } from "@/domain/ports";
import { GraphTraversalOptions, NodeId, PathResult } from "@/domain/types";

export async function bfsShortestPath(
	repo: GraphRepository,
	start: NodeId,
	goal: NodeId,
	options?: GraphTraversalOptions
): Promise<PathResult | null> {
	const excludeNodes = options?.excludeNodes ?? new Set<NodeId>();
	if (excludeNodes.has(start) || excludeNodes.has(goal)) {
		return null;
	}

	const queue: NodeId[] = [];
	const visited = new Set<NodeId>([start]);
	const parent = new Map<NodeId, NodeId | null>();
	parent.set(start, null);
	queue.push(start);

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (current === goal) {
			const path: NodeId[] = [];
			let node: NodeId | null = current;
			while (node) {
				path.push(node);
				node = parent.get(node) ?? null;
			}
			path.reverse();
			return { nodes: path, cost: path.length - 1 };
		}

		const neighbors = await repo.getOutgoingNeighbors(current);
		for (const { nodeId } of neighbors) {
			if (excludeNodes.has(nodeId)) continue;
			const edgeKey = `${current}|${nodeId}`;
			if (options?.excludeEdges?.has(edgeKey)) continue;
			if (!visited.has(nodeId)) {
				visited.add(nodeId);
				parent.set(nodeId, current);
				queue.push(nodeId);
			}
		}
	}

	return null;
} 