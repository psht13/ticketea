import { NextRequest, NextResponse } from "next/server";
import { buildRoutePlannerService, AlgorithmType } from "@/infra/di/factory";
import { Edge, NodeId } from "@/domain";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const edges = (body.edges ?? []) as Edge[];
    const start = body.start as NodeId;
    const goal = body.goal as NodeId;
    const k = (body.k as number | undefined) ?? 1;
    const algorithm =
      (body.algorithm as AlgorithmType | undefined) ?? "dijkstra";
    const directed = (body.directed as boolean | undefined) ?? true;

    if (!start || !goal || !Array.isArray(edges)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const service = buildRoutePlannerService({ edges, directed, algorithm });
    if (k > 1) {
      const results = await service.getKShortestRoutes(start, goal, k);
      return NextResponse.json({ routes: results });
    }
    const result = await service.getShortestRoute(start, goal);
    return NextResponse.json({ route: result });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
