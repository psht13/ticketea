import {
  Edge,
  NodeId,
  PathResult,
  WeightedNeighbor,
  GraphTraversalOptions,
} from "./types";

export interface GraphRepository {
  getAllNodeIds(): Promise<Set<NodeId>>;
  getOutgoingNeighbors(nodeId: NodeId): Promise<WeightedNeighbor[]>;
  getEdges(): Promise<Edge[]>;
}

export interface RouteAlgorithm {
  findShortestPath(
    start: NodeId,
    goal: NodeId,
    options?: GraphTraversalOptions,
  ): Promise<PathResult | null>;

  findKShortestPaths?(
    start: NodeId,
    goal: NodeId,
    k: number,
    options?: GraphTraversalOptions,
  ): Promise<PathResult[]>;
}

export interface RoutePlannerServicePort {
  getShortestRoute(
    start: NodeId,
    goal: NodeId,
    options?: GraphTraversalOptions,
  ): Promise<PathResult | null>;
  getKShortestRoutes(
    start: NodeId,
    goal: NodeId,
    k: number,
    options?: GraphTraversalOptions,
  ): Promise<PathResult[]>;
}
