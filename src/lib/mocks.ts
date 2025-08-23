import { SegmentAvailability, TrainSegment } from "@/domain/journey";

const base = Date.now();
const H = 60 * 60 * 1000;
const M = 60 * 1000;

export const mockedSegments: TrainSegment[] = [
	{ id: "s1", trainId: "ICE10", fromStationId: "A", toStationId: "B", departureEpochMs: base + 30 * M, arrivalEpochMs: base + 90 * M },
	{ id: "s2", trainId: "ICE10", fromStationId: "B", toStationId: "D", departureEpochMs: base + 105 * M, arrivalEpochMs: base + 180 * M },
	{ id: "s3", trainId: "RE5", fromStationId: "A", toStationId: "C", departureEpochMs: base + 20 * M, arrivalEpochMs: base + 80 * M },
	{ id: "s4", trainId: "RE5", fromStationId: "C", toStationId: "D", departureEpochMs: base + 95 * M, arrivalEpochMs: base + 160 * M },
	{ id: "s5", trainId: "IC7", fromStationId: "B", toStationId: "E", departureEpochMs: base + 200 * M, arrivalEpochMs: base + 260 * M },
];

export const mockedAvailability: SegmentAvailability[] = [
	{ segmentId: "s1", availableSeatIds: new Set(["1A", "1B"]) },
	{ segmentId: "s2", availableSeatIds: new Set(["2A", "2B"]) },
	{ segmentId: "s3", availableSeatIds: new Set(["11", "12"]) },
	{ segmentId: "s4", availableSeatIds: new Set(["21", "22", "23"]) },
	{ segmentId: "s5", availableSeatIds: new Set(["5A"]) },
];

export function buildMockOptions() {
	return {
		origin: "A",
		destination: "D",
		earliestDepartureEpochMs: base,
		passengers: 2,
		minTransferMinutes: 5,
		maxResults: 3,
	};
} 