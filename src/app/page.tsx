"use client";

import { useEffect, useState } from "react";
import { formatDurationMinutes, formatTime } from "@/lib/format";
import { mockedSegments, mockedAvailability, buildMockOptions } from "@/lib/mocks";
import { JourneyPlan, JourneySegmentAssignment } from "@/domain/journey";

// Analyze seat continuity within a journey
function analyzeSeatContinuity(journey: JourneyPlan) {
	const seatChanges: Array<{
		segmentIndex: number;
		trainId: string;
		passengerChanges: Array<{
			passengerIndex: number;
			fromSeat: string;
			toSeat: string;
		}>;
	}> = [];

	let hasAnySeatChanges = false;
	const isDirectJourney = journey.numberOfChanges === 0;

	for (let i = 1; i < journey.segments.length; i++) {
		const prevSegment = journey.segments[i - 1];
		const currSegment = journey.segments[i];
		
		// Only check seat changes within the same train
		if (prevSegment.segment.trainId === currSegment.segment.trainId) {
			const passengerChanges = [];
			
			for (let p = 0; p < prevSegment.seatAssignments.length; p++) {
				const prevSeat = prevSegment.seatAssignments.find(sa => sa.passengerIndex === p)?.seatId;
				const currSeat = currSegment.seatAssignments.find(sa => sa.passengerIndex === p)?.seatId;
				
				if (prevSeat && currSeat && prevSeat !== currSeat) {
					passengerChanges.push({
						passengerIndex: p,
						fromSeat: prevSeat,
						toSeat: currSeat
					});
				}
			}

			if (passengerChanges.length > 0) {
				seatChanges.push({
					segmentIndex: i,
					trainId: currSegment.segment.trainId,
					passengerChanges
				});
				hasAnySeatChanges = true;
			}
		}
	}

	return {
		isDirectJourney,
		hasAnySeatChanges,
		seatChanges,
		isSimplified: isDirectJourney && !hasAnySeatChanges
	};
}

export default function Home() {
	// Journey planner state (simplified)
	const [journeyOptions, setJourneyOptions] = useState(() => ({
		...buildMockOptions(),
		passengers: 1, // Always start with 1 passenger
		earliestDepartureEpochMs: Date.now() // Use current time
	}));
	const [originInput, setOriginInput] = useState(journeyOptions.origin);
	const [destinationInput, setDestinationInput] = useState(journeyOptions.destination);
	const [passengers, setPassengers] = useState(1);
	const [journeyResults, setJourneyResults] = useState<JourneyPlan[] | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassengerExtension, setShowPassengerExtension] = useState(false);

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

	// Auto-search when route changes
	useEffect(() => {
		if (originInput && destinationInput && originInput !== destinationInput) {
			const opts = {
				...journeyOptions,
				origin: originInput,
				destination: destinationInput,
				passengers: passengers,
			};
			setJourneyOptions(opts);
			const id = setTimeout(() => submitJourneys(opts), 300);
			return () => clearTimeout(id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [originInput, destinationInput, passengers]);

	function handlePassengerChange(newCount: number) {
		setPassengers(newCount);
		const opts = { ...journeyOptions, passengers: newCount };
		setJourneyOptions(opts);
		submitJourneys(opts);
	}

	const selectedJourney = selectedIndex !== null && journeyResults ? journeyResults[selectedIndex] : null;

	// Render simplified journey view (for direct tickets with no seat changes)
	function renderSimplifiedJourney(journey: JourneyPlan, idx: number) {
		const firstSegment = journey.segments[0];
		const lastSegment = journey.segments[journey.segments.length - 1];
		const allSameSeats = firstSegment.seatAssignments.map(sa => sa.seatId).join(", ");

		return (
			<div key={idx} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow ${selectedIndex === idx ? "ring-2 ring-blue-500 shadow-lg" : ""}`}>
				<div className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center space-x-3">
							<span className="text-2xl">🎫</span>
							<div>
								<div className="font-semibold text-gray-800">Direct Journey</div>
								<div className="text-sm text-gray-500">
									⏱️ {formatDurationMinutes(journey.totalDurationMinutes)} • ✅ No seat changes required
								</div>
							</div>
						</div>
						<button 
							className={`px-6 py-2 rounded-lg font-medium transition-colors ${
								selectedIndex === idx 
								? "bg-blue-600 text-white" 
								: "bg-blue-50 text-blue-600 hover:bg-blue-100"
							}`}
							onClick={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
						>
							{selectedIndex === idx ? "Selected ✓" : "Select"}
						</button>
					</div>
					
					{/* Simplified route display */}
					<div className="bg-green-50 border border-green-200 rounded-lg p-4">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="font-medium text-gray-800 mb-1">
									{formatTime(firstSegment.segment.departureEpochMs)} {firstSegment.segment.fromStationId} → {formatTime(lastSegment.segment.arrivalEpochMs)} {lastSegment.segment.toStationId}
								</div>
								<div className="text-sm text-gray-600">🚊 {firstSegment.segment.trainId}</div>
							</div>
							<div className="text-right">
								<div className="text-sm font-medium text-gray-800">
									💺 {allSameSeats}
								</div>
								<div className="text-xs text-green-600 font-medium">
									Same seats throughout
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Render detailed journey view (for journeys with seat changes or transfers)
	function renderDetailedJourney(journey: JourneyPlan, idx: number, continuity: ReturnType<typeof analyzeSeatContinuity>) {
		return (
			<div key={idx} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow ${selectedIndex === idx ? "ring-2 ring-blue-500 shadow-lg" : ""}`}>
				<div className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center space-x-3">
							<span className="text-2xl">{continuity.hasAnySeatChanges ? "⚠️" : "🚂"}</span>
							<div>
								<div className="font-semibold text-gray-800">Journey Option #{idx + 1}</div>
								<div className="text-sm text-gray-500">
									⏱️ {formatDurationMinutes(journey.totalDurationMinutes)}
									{continuity.hasAnySeatChanges && (
										<span className="text-orange-600 font-medium"> • 💺 Seat changes required</span>
									)}
								</div>
							</div>
						</div>
						<button 
							className={`px-6 py-2 rounded-lg font-medium transition-colors ${
								selectedIndex === idx 
								? "bg-blue-600 text-white" 
								: "bg-blue-50 text-blue-600 hover:bg-blue-100"
							}`}
							onClick={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
						>
							{selectedIndex === idx ? "Selected ✓" : "Select"}
						</button>
					</div>

					{/* Seat change warnings */}
					{continuity.hasAnySeatChanges && (
						<div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
							<div className="flex items-start space-x-2">
								<span className="text-orange-500 mt-0.5">⚠️</span>
								<div>
									<div className="font-medium text-orange-800">Seat Changes Required</div>
									<div className="text-sm text-orange-700">
										You&apos;ll need to change seats during this journey on the same train.
									</div>
								</div>
							</div>
						</div>
					)}
					
					{/* Detailed segment display */}
					<div className="space-y-3">
						{journey.segments.map((s: JourneySegmentAssignment, i: number) => {
							const isTrainChange = i > 0 && journey.segments[i-1].segment.trainId !== s.segment.trainId;
							const seatChange = continuity.seatChanges.find(sc => sc.segmentIndex === i);
							
							return (
								<div key={i}>
									{/* Train change indicator */}
									{isTrainChange && (
										<div className="flex items-center justify-center py-2">
											<div className="flex items-center space-x-2 text-sm text-gray-500">
												<div className="h-px bg-gray-300 flex-1"></div>
												<span className="bg-gray-100 px-2 py-1 rounded">🔄 Change trains</span>
												<div className="h-px bg-gray-300 flex-1"></div>
											</div>
										</div>
									)}

									{/* Segment */}
									<div className={`flex items-center justify-between p-3 rounded-lg ${
										seatChange ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
									}`}>
										<div className="flex-1">
											<div className="font-medium text-gray-800">
												{formatTime(s.segment.departureEpochMs)} {s.segment.fromStationId} → {formatTime(s.segment.arrivalEpochMs)} {s.segment.toStationId}
											</div>
											<div className="text-sm text-gray-600">🚊 {s.segment.trainId}</div>
											{seatChange && (
												<div className="text-xs text-orange-600 mt-1 font-medium">
													⚠️ Seat change at {s.segment.fromStationId}
												</div>
											)}
										</div>
										<div className="text-right">
											<div className="text-sm font-medium text-gray-800">
												💺 {s.seatAssignments.map(sa => sa.seatId).join(", ")}
											</div>
											<div className="text-xs text-gray-500">
												{s.seatAssignments.length} {s.seatAssignments.length === 1 ? 'seat' : 'seats'}
											</div>
											{seatChange && (
												<div className="text-xs text-orange-600 mt-1">
													{seatChange.passengerChanges.map(pc => 
														`${pc.fromSeat} → ${pc.toSeat}`
													).join(", ")}
												</div>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="max-w-4xl mx-auto p-6 space-y-8">

				{/* Search Form */}
				<div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
					<div className="grid md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">
								🚉 From
							</label>
							<input
								className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
								placeholder="Enter departure city"
								value={originInput}
								onChange={e => setOriginInput(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">
								🏁 To
							</label>
							<input
								className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
								placeholder="Enter destination city"
								value={destinationInput}
								onChange={e => setDestinationInput(e.target.value)}
							/>
						</div>
					</div>

					{/* Passenger Info */}
					<div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
						<div className="flex items-center space-x-3">
							<span className="text-2xl">👤</span>
							<div>
								<div className="font-medium text-gray-800">
									{passengers} {passengers === 1 ? 'Passenger' : 'Passengers'}
								</div>
								<div className="text-sm text-gray-500">Traveling today</div>
							</div>
						</div>
						<button
							className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
							onClick={() => setShowPassengerExtension(!showPassengerExtension)}
						>
							{showPassengerExtension ? 'Hide' : 'Change'}
						</button>
					</div>

					{/* Passenger Extension Panel */}
					{showPassengerExtension && (
						<div className="p-4 border-2 border-blue-100 rounded-xl bg-blue-50 space-y-3">
							<div className="font-medium text-gray-800">How many passengers?</div>
							<div className="flex items-center space-x-4">
								<button
									className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 hover:border-blue-300 flex items-center justify-center"
									onClick={() => handlePassengerChange(Math.max(1, passengers - 1))}
									disabled={passengers <= 1}
								>
									-
								</button>
								<span className="text-xl font-semibold w-8 text-center">{passengers}</span>
								<button
									className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 hover:border-blue-300 flex items-center justify-center"
									onClick={() => handlePassengerChange(Math.min(10, passengers + 1))}
									disabled={passengers >= 10}
								>
									+
								</button>
							</div>
							<div className="text-sm text-gray-600">Maximum 10 passengers per booking</div>
						</div>
					)}

					{error && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-xl">
							<div className="flex items-center space-x-2">
								<span className="text-red-500">⚠️</span>
								<span className="text-red-700">{error}</span>
							</div>
						</div>
					)}
				</div>

				{/* Results */}
				<div className="space-y-4">
					{loading && (
						<div className="text-center py-8">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							<div className="mt-2 text-gray-600">Searching for journeys...</div>
						</div>
					)}

					{journeyResults?.length ? (
						<div className="space-y-4">
							<h2 className="text-xl font-semibold text-gray-800">
								🚄 Available Journeys ({journeyResults.length})
							</h2>
							{journeyResults.map((j, idx) => {
								const continuity = analyzeSeatContinuity(j);
								return continuity.isSimplified 
									? renderSimplifiedJourney(j, idx)
									: renderDetailedJourney(j, idx, continuity);
							})}
							{selectedJourney && (
								<div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
									<div className="flex items-center justify-between">
										<div>
											<div className="font-semibold text-gray-800 mb-2">🎯 Journey Summary</div>
											<div className="space-y-1 text-sm text-gray-600">
												<div>👥 {passengers} {passengers === 1 ? 'passenger' : 'passengers'}</div>
												<div>🚄 {selectedJourney.segments.length} {selectedJourney.segments.length === 1 ? 'segment' : 'segments'}</div>
											</div>
										</div>
										<button className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-lg">
											Continue to Purchase 💳
										</button>
									</div>
								</div>
							)}
						</div>
					) : !loading && (
						<div className="text-center py-12 text-gray-500">
							<div className="text-6xl mb-4">🔍</div>
							<div className="text-lg">Enter your departure and destination cities to search for journeys</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
