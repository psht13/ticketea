"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDurationMinutes, formatTime, formatUTCDateTime, parseUTCDateTime } from "@/lib/format";
import { mockedSegments, mockedAvailability, buildMockOptions } from "@/lib/mocks";
import { JourneyPlan, JourneySegmentAssignment } from "@/domain/journey";

export default function Home() {
	// Journey planner state (mocked)
	const [journeyOptions, setJourneyOptions] = useState(buildMockOptions());
	const [originInput, setOriginInput] = useState(journeyOptions.origin);
	const [destinationInput, setDestinationInput] = useState(journeyOptions.destination);
	const [earliestInput, setEarliestInput] = useState(formatUTCDateTime(journeyOptions.earliestDepartureEpochMs));
	const [passengersInput, setPassengersInput] = useState(journeyOptions.passengers);
	const [journeyResults, setJourneyResults] = useState<JourneyPlan[] | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const segments = mockedSegments;
	const availability = mockedAvailability.map(a => ({ segmentId: a.segmentId, availableSeatIds: Array.from(a.availableSeatIds) }));

	async function submitJourneys(opts = journeyOptions) {
		setError(null);
		setLoading(true);
		setSelectedIndex(null);
		try {
			const res = await fetch("/api/journeys", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ segments, availability, options: opts }),
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

	// React when passenger count changes
	useEffect(() => {
		const opts = { ...journeyOptions, passengers: passengersInput };
		setJourneyOptions(opts);
		// Debounce-like simple trigger
		const id = setTimeout(() => submitJourneys(opts), 200);
		return () => clearTimeout(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [passengersInput]);

	function applyOptionsAndSearch() {
		const parsed = parseUTCDateTime(earliestInput);
		if (parsed === null) {
			setError("Invalid date-time. Use YYYY-MM-DD HH:mm (UTC)");
			return;
		}
		const opts = {
			...journeyOptions,
			origin: originInput,
			destination: destinationInput,
			earliestDepartureEpochMs: parsed,
			passengers: passengersInput,
		};
		setJourneyOptions(opts);
		submitJourneys(opts);
	}

	const selectedJourney = selectedIndex !== null && journeyResults ? journeyResults[selectedIndex] : null;

	return (
		<div className="max-w-3xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Ticket Planner</h1>

			<div className="grid gap-4">
				<div className="grid md:grid-cols-2 gap-3">
					<label className="block text-sm">
						Departure
						<input
							className="mt-1 w-full p-2 border rounded"
							value={originInput}
							onChange={e => setOriginInput(e.target.value)}
						/>
					</label>
					<label className="block text-sm">
						Arrival
						<input
							className="mt-1 w-full p-2 border rounded"
							value={destinationInput}
							onChange={e => setDestinationInput(e.target.value)}
						/>
					</label>
				</div>
				<div className="grid md:grid-cols-3 gap-3">
					<label className="block text-sm md:col-span-2">
						Earliest departure (UTC) — YYYY-MM-DD HH:mm
						<input
							className="mt-1 w-full p-2 border rounded"
							value={earliestInput}
							onChange={e => setEarliestInput(e.target.value)}
						/>
					</label>
					<label className="block text-sm">
						Passengers
						<input
							type="number"
							min={1}
							className="mt-1 w-full p-2 border rounded"
							value={passengersInput}
							onChange={e => setPassengersInput(Number(e.target.value))}
						/>
					</label>
				</div>
				<div className="flex gap-2">
					<button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={applyOptionsAndSearch} disabled={loading}>{loading ? "Searching..." : "Search"}</button>
					<button className="px-4 py-2 bg-white text-black border rounded" onClick={() => {
						setOriginInput(journeyOptions.origin);
						setDestinationInput(journeyOptions.destination);
						setEarliestInput(formatUTCDateTime(journeyOptions.earliestDepartureEpochMs));
						setPassengersInput(journeyOptions.passengers);
					}}>Reset</button>
				</div>
				{error && <div className="text-red-600">{error}</div>}
			</div>

			<div className="space-y-3">
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
								<div className="text-sm">Passengers: {passengersInput}</div>
								<div className="text-sm">Segments: {selectedJourney.segments.length}</div>
								<div className="text-sm">Changes: {selectedJourney.numberOfChanges}</div>
								<button className="mt-2 px-3 py-2 bg-blue-600 text-white rounded">Continue to purchase</button>
							</div>
						)}
					</div>
				) : (
					<div className="text-sm text-gray-300">Enter details and click Search.</div>
				)}
			</div>
		</div>
	);
}
