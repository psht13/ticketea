export type NodeId = string;

export interface Edge {
  source: NodeId;
  target: NodeId;
  weight?: number; // Defaults to 1 when omitted
}

export interface WeightedNeighbor {
  nodeId: NodeId;
  weight: number;
}

export interface PathResult {
  nodes: NodeId[];
  cost: number; // Sum of weights (or hop count for unweighted)
}

export interface GraphTraversalOptions {
  excludeNodes?: Set<NodeId>;
  excludeEdges?: Set<string>; // Encoded as "source|target"
}
