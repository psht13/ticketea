import { GraphRepository, RouteAlgorithm } from "@/domain/ports";
import { GraphTraversalOptions, NodeId, PathResult } from "@/domain/types";
import { bfsShortestPath } from "./bfs";
import { dijkstraShortestPath } from "./dijkstra";
import { yensKShortestPaths } from "./yen";

export class BFSAlgorithm implements RouteAlgorithm {
  constructor(private readonly repo: GraphRepository) {}
  findShortestPath(
    start: NodeId,
    goal: NodeId,
    options?: GraphTraversalOptions,
  ): Promise<PathResult | null> {
    return bfsShortestPath(this.repo, start, goal, options);
  }
}

export class DijkstraAlgorithm implements RouteAlgorithm {
  constructor(private readonly repo: GraphRepository) {}
  findShortestPath(
    start: NodeId,
    goal: NodeId,
    options?: GraphTraversalOptions,
  ): Promise<PathResult | null> {
    return dijkstraShortestPath(this.repo, start, goal, options);
  }
}

export class YensAlgorithm implements RouteAlgorithm {
  constructor(private readonly repo: GraphRepository) {}
  findShortestPath(
    start: NodeId,
    goal: NodeId,
    options?: GraphTraversalOptions,
  ): Promise<PathResult | null> {
    return dijkstraShortestPath(this.repo, start, goal, options);
  }
  findKShortestPaths(
    start: NodeId,
    goal: NodeId,
    k: number,
    options?: GraphTraversalOptions,
  ): Promise<PathResult[]> {
    return yensKShortestPaths(this.repo, start, goal, k, options);
  }
}
