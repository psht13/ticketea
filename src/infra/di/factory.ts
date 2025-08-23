import { InMemoryGraphRepository } from "@/infra/repositories/InMemoryGraphRepository";
import { DijkstraAlgorithm, YensAlgorithm } from "@/algorithms";
import { RoutePlannerService } from "@/application";
import { Edge } from "@/domain/types";

export type AlgorithmType = "dijkstra" | "yens";

export interface BuildServiceOptions {
	edges: Edge[];
	directed?: boolean;
	algorithm?: AlgorithmType;
}

export function buildRoutePlannerService(options: BuildServiceOptions) {
	const { edges, directed = true, algorithm = "dijkstra" } = options;
	const repo = new InMemoryGraphRepository(edges, directed);
	const algo = algorithm === "yens" ? new YensAlgorithm(repo) : new DijkstraAlgorithm(repo);
	return new RoutePlannerService(algo);
} 