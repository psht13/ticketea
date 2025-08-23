import { GraphRepository } from "@/domain/ports";
import { GraphTraversalOptions, NodeId, PathResult } from "@/domain/types";

class MinHeap<T> {
	private data: { key: number; value: T }[] = [];

	push(key: number, value: T) {
		this.data.push({ key, value });
		this.bubbleUp(this.data.length - 1);
	}

	pop(): { key: number; value: T } | undefined {
		if (this.data.length === 0) return undefined;
		const top = this.data[0];
		const last = this.data.pop()!;
		if (this.data.length > 0) {
			this.data[0] = last;
			this.bubbleDown(0);
		}
		return top;
	}

	private bubbleUp(index: number) {
		while (index > 0) {
			const parent = Math.floor((index - 1) / 2);
			if (this.data[parent].key <= this.data[index].key) break;
			[this.data[parent], this.data[index]] = [this.data[index], this.data[parent]];
			index = parent;
		}
	}

	private bubbleDown(index: number) {
		const length = this.data.length;
		while (true) {
			const left = 2 * index + 1;
			const right = 2 * index + 2;
			let smallest = index;
			if (left < length && this.data[left].key < this.data[smallest].key) smallest = left;
			if (right < length && this.data[right].key < this.data[smallest].key) smallest = right;
			if (smallest === index) break;
			[this.data[smallest], this.data[index]] = [this.data[index], this.data[smallest]];
			index = smallest;
		}
	}
}

export async function dijkstraShortestPath(
	repo: GraphRepository,
	start: NodeId,
	goal: NodeId,
	options?: GraphTraversalOptions
): Promise<PathResult | null> {
	const excludeNodes = options?.excludeNodes ?? new Set<NodeId>();
	if (excludeNodes.has(start) || excludeNodes.has(goal)) return null;

	const dist = new Map<NodeId, number>();
	const prev = new Map<NodeId, NodeId | null>();
	const heap = new MinHeap<NodeId>();

	dist.set(start, 0);
	prev.set(start, null);
	heap.push(0, start);

	while (true) {
		const item = heap.pop();
		if (!item) break;
		const { key: currentDist, value: current } = item;
		if (current === goal) break;
		if (currentDist > (dist.get(current) ?? Infinity)) continue;

		const neighbors = await repo.getOutgoingNeighbors(current);
		for (const { nodeId, weight } of neighbors) {
			if (excludeNodes.has(nodeId)) continue;
			const edgeKey = `${current}|${nodeId}`;
			if (options?.excludeEdges?.has(edgeKey)) continue;
			const w = weight ?? 1;
			const alt = currentDist + w;
			if (alt < (dist.get(nodeId) ?? Infinity)) {
				dist.set(nodeId, alt);
				prev.set(nodeId, current);
				heap.push(alt, nodeId);
			}
		}
	}

	if (!dist.has(goal)) return null;
	const path: NodeId[] = [];
	let node: NodeId | null = goal;
	while (node) {
		path.push(node);
		node = prev.get(node) ?? null;
	}
	path.reverse();
	return { nodes: path, cost: dist.get(goal)! };
} 