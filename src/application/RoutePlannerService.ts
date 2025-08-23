import { GraphRepository, RoutePlannerServicePort, RouteAlgorithm } from "@/domain/ports";
import { GraphTraversalOptions, NodeId, PathResult } from "@/domain/types";

export class RoutePlannerService implements RoutePlannerServicePort {
	constructor(private readonly algorithm: RouteAlgorithm) {}

	async getShortestRoute(start: NodeId, goal: NodeId, options?: GraphTraversalOptions): Promise<PathResult | null> {
		return this.algorithm.findShortestPath(start, goal, options);
	}

	async getKShortestRoutes(start: NodeId, goal: NodeId, k: number, options?: GraphTraversalOptions): Promise<PathResult[]> {
		if (!this.algorithm.findKShortestPaths) {
			const single = await this.algorithm.findShortestPath(start, goal, options);
			return single ? [single] : [];
		}
		return this.algorithm.findKShortestPaths(start, goal, k, options);
	}
} 