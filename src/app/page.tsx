"use client";

import { useMemo, useState } from "react";

type EdgeInput = { source: string; target: string; weight?: number };

type ApiResponse =
  | { route: { nodes: string[]; cost: number } | null }
  | { routes: { nodes: string[]; cost: number }[] };

type TrainSegment = {
  id: string;
  trainId: string;
  fromStationId: string;
  toStationId: string;
  departureEpochMs: number;
  arrivalEpochMs: number;
};

type JourneyOptions = {
  origin: string;
  destination: string;
  earliestDepartureEpochMs: number;
  passengers: number;
  minTransferMinutes?: number;
  maxResults?: number;
};

export default function Home() {
  const [tab, setTab] = useState<"routes" | "journeys">("journeys");

  // Routes planner state
  const [edgesText, setEdgesText] = useState("A,B,1\nB,C,1\nC,D,1\nA,D,5");
  const [start, setStart] = useState("A");
  const [goal, setGoal] = useState("D");
  const [k, setK] = useState(1);
  const [algorithm, setAlgorithm] = useState("dijkstra");
  const [routeResult, setRouteResult] = useState<ApiResponse | null>(null);

  // Journey planner state
  const [segmentsText, setSegmentsText] = useState(
    "s1,T1,A,B,1710000000000,1710003600000\ns2,T1,B,D,1710003900000,1710007200000\ns3,T2,A,C,1710000100000,1710003700000\ns4,T2,C,D,1710003800000,1710007100000"
  );
  const [availabilityText, setAvailabilityText] = useState(
    "s1:a1|a2|a3\ns2:b1|b2\ns3:c1|c2\ns4:d1|d2|d3"
  );
  const [journeyOptions, setJourneyOptions] = useState<JourneyOptions>({
    origin: "A",
    destination: "D",
    earliestDepartureEpochMs: 1710000000000,
    passengers: 2,
    minTransferMinutes: 5,
    maxResults: 3,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [journeyResults, setJourneyResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edges: EdgeInput[] = useMemo(() => {
    return edgesText
      .split(/\n|;/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [source, target, weight] = line.split(/[ ,\t]+/);
        return {
          source,
          target,
          weight: weight ? Number(weight) : undefined,
        } as EdgeInput;
      });
  }, [edgesText]);

  const segments: TrainSegment[] = useMemo(() => {
    return segmentsText
      .split(/\n|;/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const [
          id,
          trainId,
          fromStationId,
          toStationId,
          departureEpochMs,
          arrivalEpochMs,
        ] = l.split(/[ ,\t]+/);
        return {
          id,
          trainId,
          fromStationId,
          toStationId,
          departureEpochMs: Number(departureEpochMs),
          arrivalEpochMs: Number(arrivalEpochMs),
        } satisfies TrainSegment;
      });
  }, [segmentsText]);

  const availability = useMemo(() => {
    const lines = availabilityText
      .split(/\n|;/)
      .map(l => l.trim())
      .filter(Boolean);
    return lines.map(line => {
      const [segmentId, seatsStr] = line.split(":");
      const seats = (seatsStr ?? "").split("|").filter(Boolean);
      return { segmentId, availableSeatIds: seats };
    });
  }, [availabilityText]);

  async function submitRoutes() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edges, start, goal, k, algorithm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setRouteResult(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function submitJourneys() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments,
          availability,
          options: journeyOptions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setJourneyResults(data.journeys);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Ticket Planner</h1>
      <div className="flex gap-2">
        <button
          className={`px-3 py-1 rounded ${tab === "journeys" ? "bg-blue-600 text-white" : "bg-white text-black"}`}
          onClick={() => setTab("journeys")}>
          Journeys
        </button>
        <button
          className={`px-3 py-1 rounded ${tab === "routes" ? "bg-blue-600 text-white" : "bg-white text-black"}`}
          onClick={() => setTab("routes")}>
          Routes
        </button>
      </div>

      {tab === "journeys" && (
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                Origin
                <input
                  className="mt-1 w-full p-2 border rounded"
                  value={journeyOptions.origin}
                  onChange={e =>
                    setJourneyOptions({
                      ...journeyOptions,
                      origin: e.target.value,
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                Destination
                <input
                  className="mt-1 w-full p-2 border rounded"
                  value={journeyOptions.destination}
                  onChange={e =>
                    setJourneyOptions({
                      ...journeyOptions,
                      destination: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <label className="block text-sm">
              Passengers
              <input
                type="number"
                className="mt-1 w-full p-2 border rounded"
                min={1}
                value={journeyOptions.passengers}
                onChange={e =>
                  setJourneyOptions({
                    ...journeyOptions,
                    passengers: Number(e.target.value),
                  })
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                Earliest Departure (ms)
                <input
                  className="mt-1 w-full p-2 border rounded"
                  value={journeyOptions.earliestDepartureEpochMs}
                  onChange={e =>
                    setJourneyOptions({
                      ...journeyOptions,
                      earliestDepartureEpochMs: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                Min Transfer (min)
                <input
                  className="mt-1 w-full p-2 border rounded"
                  value={journeyOptions.minTransferMinutes ?? 5}
                  onChange={e =>
                    setJourneyOptions({
                      ...journeyOptions,
                      minTransferMinutes: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label className="block text-sm">
              Segments CSV (id,train,from,to,depMs,arrMs)
              <textarea
                className="mt-1 w-full h-28 p-2 border rounded"
                value={segmentsText}
                onChange={e => setSegmentsText(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Availability (segmentId:seat1|seat2|...)
              <textarea
                className="mt-1 w-full h-28 p-2 border rounded"
                value={availabilityText}
                onChange={e => setAvailabilityText(e.target.value)}
              />
            </label>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={submitJourneys}
              disabled={loading}>
              {loading ? "Searching..." : "Search Journeys"}
            </button>
          </div>
          <div className="space-y-2">
            {error && <div className="text-red-600">{error}</div>}
            {journeyResults?.map((j, idx) => (
              <div key={idx} className="p-3 border rounded bg-white text-black">
                <div className="font-medium">
                  Option #{idx + 1} • {j.totalDurationMinutes} min • Changes:{" "}
                  {j.numberOfChanges}
                </div>
                <div className="mt-1 space-y-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {j.segments.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div>
                        {s.segment.trainId} {s.segment.fromStationId} →{" "}
                        {s.segment.toStationId}
                      </div>
                      <div>
                        Seats:{" "}
                        {s.seatAssignments
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          .map((sa: any) => sa.seatId)
                          .join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-2 text-blue-700 underline">
                  Continue to purchase
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "routes" && (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm">Edges CSV (source,target,weight)</span>
            <textarea
              className="mt-1 w-full h-40 p-2 border rounded"
              value={edgesText}
              onChange={e => setEdgesText(e.target.value)}
            />
          </label>
          <div className="grid gap-2">
            <label className="block">
              <span className="text-sm">Start</span>
              <input
                className="mt-1 w-full p-2 border rounded"
                value={start}
                onChange={e => setStart(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm">Goal</span>
              <input
                className="mt-1 w-full p-2 border rounded"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm">K (number of routes)</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full p-2 border rounded"
                value={k}
                onChange={e => setK(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="text-sm">Algorithm</span>
              <select
                className="mt-1 w-full p-2 border rounded"
                value={algorithm}
                onChange={e => setAlgorithm(e.target.value)}>
                <option value="dijkstra">Dijkstra</option>
                <option value="yens">Yen (K shortest)</option>
              </select>
            </label>
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={submitRoutes}
              disabled={loading}>
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <div className="space-y-2">
            {routeResult && "route" in routeResult && routeResult.route && (
              <div className="p-3 border rounded">
                <div className="font-medium">Shortest Route</div>
                <div>Path: {routeResult.route.nodes.join(" → ")}</div>
                <div>Cost: {routeResult.route.cost}</div>
              </div>
            )}
            {routeResult && "routes" in routeResult && (
              <div className="space-y-2">
                <div className="font-medium">K Shortest Routes</div>
                {routeResult.routes.map((r, idx) => (
                  <div key={idx} className="p-3 border rounded">
                    <div>
                      #{idx + 1}: {r.nodes.join(" → ")}
                    </div>
                    <div>Cost: {r.cost}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
