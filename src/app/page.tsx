"use client";

import { useMemo, useState } from "react";
import { formatDurationMinutes, formatTime } from "@/lib/format";
import { mockedSegments, mockedAvailability, buildMockOptions } from "@/lib/mocks";
import { JourneyPlan, JourneySegmentAssignment } from "@/domain/journey";

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

	// Journey planner state (mocked)
	const [segmentsText, setSegmentsText] = useState("");
	const [availabilityText, setAvailabilityText] = useState("");
	const [journeyOptions, setJourneyOptions] = useState<JourneyOptions>(buildMockOptions());
	const [journeyResults, setJourneyResults] = useState<JourneyPlan[] | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
		if (segmentsText) {
			return segmentsText
				.split(/\n|;/)
				.map(l => l.trim())
				.filter(Boolean)
				.map(l => {
					const [id, trainId, fromStationId, toStationId, departureEpochMs, arrivalEpochMs] = l.split(/[ ,\t]+/);
					return {
						id,
						trainId,
						fromStationId,
						toStationId,
						departureEpochMs: Number(departureEpochMs),
						arrivalEpochMs: Number(arrivalEpochMs),
					} satisfies TrainSegment;
				});
		}
		return mockedSegments;
	}, [segmentsText]);

	const availability = useMemo(() => {
		if (availabilityText) {
			const lines = availabilityText
				.split(/\n|;/)
				.map(l => l.trim())
				.filter(Boolean);
			return lines.map(line => {
				const [segmentId, seatsStr] = line.split(":");
				const seats = (seatsStr ?? "").split("|").filter(Boolean);
				return { segmentId, availableSeatIds: seats };
			});
		}
		return mockedAvailability.map(a => ({ segmentId: a.segmentId, availableSeatIds: Array.from(a.availableSeatIds) }));
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
		setSelectedIndex(null);
		try {
			const res = await fetch("/api/journeys", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ segments, availability, options: journeyOptions }),
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

	const selectedJourney = selectedIndex !== null && journeyResults ? journeyResults[selectedIndex] : null;

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
				<div className="grid md:grid-cols-5 gap-4 items-start">
					<div className="md:col-span-2 space-y-3">
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
						<div className="flex gap-2">
							<button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submitJourneys} disabled={loading}>{loading ? "Searching..." : "Search"}</button>
							<button className="px-4 py-2 bg-white text-black border rounded" onClick={() => {
								setSegmentsText("");
								setAvailabilityText("");
								setJourneyOptions(buildMockOptions());
							}}>Use mocked</button>
						</div>
					</div>
					<div className="md:col-span-3 space-y-3">
						{error && <div className="text-red-600">{error}</div>}
						{journeyResults?.length ? (
							<div className="space-y-2">
								{journeyResults.map((j, idx) => (
									<div key={idx} className={`p-3 border rounded bg-white text-black ${selectedIndex === idx ? "ring-2 ring-blue-600" : ""}`}>
										<div className="flex items-center justify-between">
											<div className="font-medium">Option #{idx + 1}</div>
											<button className="px-2 py-1 border rounded" onClick={() => setSelectedIndex(idx)}>Select</button>
										</div>
										<div className="text-sm text-gray-700">Duration {formatDurationMinutes(j.totalDurationMinutes)} • Changes {j.numberOfChanges}</div>
										<div className="mt-2 space-y-1">
											{j.segments.map((s: JourneySegmentAssignment, i: number) => (
												<div key={i} className="flex items-center justify-between text-sm">
													<div>
														{formatTime(s.segment.departureEpochMs)} {s.segment.fromStationId} → {formatTime(s.segment.arrivalEpochMs)} {s.segment.toStationId} • {s.segment.trainId}
													</div>
													<div>Seats: {s.seatAssignments.map(sa => sa.seatId).join(", ")}</div>
												</div>
											))}
										</div>
								</div>
							))}
							{selectedJourney && (
								<div className="p-3 border rounded">
									<div className="font-medium">Summary</div>
									<div className="text-sm">Passengers: {journeyOptions.passengers}</div>
									<div className="text-sm">Segments: {selectedJourney.segments.length}</div>
									<div className="text-sm">Changes: {selectedJourney.numberOfChanges}</div>
									<button className="mt-2 px-3 py-2 bg-blue-600 text-white rounded">Continue to purchase</button>
								</div>
							)}
						</div>
					) : (
						<div className="text-sm text-gray-300">Enter details and click Search, or click &quot;Use mocked&quot; to try sample data.</div>
					)}
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
