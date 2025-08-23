import { GraphRepository } from "@/domain/ports";
import { Edge, NodeId, WeightedNeighbor } from "@/domain/types";

export class InMemoryGraphRepository implements GraphRepository {
  private adjacency: Map<NodeId, WeightedNeighbor[]> = new Map();
  private nodes: Set<NodeId> = new Set();
  private edges: Edge[] = [];

  constructor(edges: Edge[], directed: boolean = true) {
    this.edges = edges.slice();
    for (const edge of edges) {
      this.nodes.add(edge.source);
      this.nodes.add(edge.target);
      this.addAdjacency(edge.source, edge.target, edge.weight ?? 1);
      if (!directed) {
        this.addAdjacency(edge.target, edge.source, edge.weight ?? 1);
      }
    }
  }

  private addAdjacency(source: NodeId, target: NodeId, weight: number) {
    if (!this.adjacency.has(source)) this.adjacency.set(source, []);
    this.adjacency.get(source)!.push({ nodeId: target, weight });
  }

  async getAllNodeIds(): Promise<Set<NodeId>> {
    return new Set(this.nodes);
  }

  async getOutgoingNeighbors(nodeId: NodeId): Promise<WeightedNeighbor[]> {
    return this.adjacency.get(nodeId)?.slice() ?? [];
  }

  async getEdges(): Promise<Edge[]> {
    return this.edges.slice();
  }
}
