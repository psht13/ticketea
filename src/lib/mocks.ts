import { SegmentAvailability, TrainSegment } from "@/domain/journey";

const base = Date.now();
const H = 60 * 60 * 1000;
const M = 60 * 1000;

// Extended mock segments with Ukrainian cities and multiple departures
export const mockedSegments: TrainSegment[] = [
	// Kyiv to Odesa via Lviv route - ICE10 train (multiple departures every 2 hours)
	{ id: "s1", trainId: "ICE101", fromStationId: "Kyiv", toStationId: "Lviv", departureEpochMs: base + 30 * M, arrivalEpochMs: base + 90 * M },
	{ id: "s2", trainId: "ICE101", fromStationId: "Lviv", toStationId: "Odesa", departureEpochMs: base + 105 * M, arrivalEpochMs: base + 180 * M },
	
	{ id: "s3", trainId: "ICE102", fromStationId: "Kyiv", toStationId: "Lviv", departureEpochMs: base + 150 * M, arrivalEpochMs: base + 210 * M },
	{ id: "s4", trainId: "ICE102", fromStationId: "Lviv", toStationId: "Odesa", departureEpochMs: base + 225 * M, arrivalEpochMs: base + 300 * M },
	
	{ id: "s5", trainId: "ICE103", fromStationId: "Kyiv", toStationId: "Lviv", departureEpochMs: base + 270 * M, arrivalEpochMs: base + 330 * M },
	{ id: "s6", trainId: "ICE103", fromStationId: "Lviv", toStationId: "Odesa", departureEpochMs: base + 345 * M, arrivalEpochMs: base + 420 * M },

	// Kyiv to Odesa via Kharkiv route - RE5 train (multiple departures every 2 hours)
	{ id: "s7", trainId: "RE501", fromStationId: "Kyiv", toStationId: "Kharkiv", departureEpochMs: base + 20 * M, arrivalEpochMs: base + 80 * M },
	{ id: "s8", trainId: "RE501", fromStationId: "Kharkiv", toStationId: "Odesa", departureEpochMs: base + 95 * M, arrivalEpochMs: base + 160 * M },
	
	{ id: "s9", trainId: "RE502", fromStationId: "Kyiv", toStationId: "Kharkiv", departureEpochMs: base + 140 * M, arrivalEpochMs: base + 200 * M },
	{ id: "s10", trainId: "RE502", fromStationId: "Kharkiv", toStationId: "Odesa", departureEpochMs: base + 215 * M, arrivalEpochMs: base + 280 * M },
	
	{ id: "s11", trainId: "RE503", fromStationId: "Kyiv", toStationId: "Kharkiv", departureEpochMs: base + 260 * M, arrivalEpochMs: base + 320 * M },
	{ id: "s12", trainId: "RE503", fromStationId: "Kharkiv", toStationId: "Odesa", departureEpochMs: base + 335 * M, arrivalEpochMs: base + 400 * M },

	// Additional connections - Lviv to Dnipro route
	{ id: "s13", trainId: "IC701", fromStationId: "Lviv", toStationId: "Dnipro", departureEpochMs: base + 200 * M, arrivalEpochMs: base + 260 * M },
	{ id: "s14", trainId: "IC702", fromStationId: "Lviv", toStationId: "Dnipro", departureEpochMs: base + 320 * M, arrivalEpochMs: base + 380 * M },
	
	// Direct Kyiv to Odesa express trains
	{ id: "s15", trainId: "EXP801", fromStationId: "Kyiv", toStationId: "Odesa", departureEpochMs: base + 60 * M, arrivalEpochMs: base + 180 * M },
	{ id: "s16", trainId: "EXP802", fromStationId: "Kyiv", toStationId: "Odesa", departureEpochMs: base + 180 * M, arrivalEpochMs: base + 300 * M },
	{ id: "s17", trainId: "EXP803", fromStationId: "Kyiv", toStationId: "Odesa", departureEpochMs: base + 300 * M, arrivalEpochMs: base + 420 * M },

	// SEAT CHANGE DEMONSTRATION: Long-distance train IC999 with multiple stops
	// This train demonstrates how passengers need to change seats during the journey
	{ id: "s18", trainId: "IC999", fromStationId: "Kyiv", toStationId: "Zhytomyr", departureEpochMs: base + 10 * M, arrivalEpochMs: base + 50 * M },
	{ id: "s19", trainId: "IC999", fromStationId: "Zhytomyr", toStationId: "Rivne", departureEpochMs: base + 55 * M, arrivalEpochMs: base + 95 * M },
	{ id: "s20", trainId: "IC999", fromStationId: "Rivne", toStationId: "Lviv", departureEpochMs: base + 100 * M, arrivalEpochMs: base + 140 * M },
	{ id: "s21", trainId: "IC999", fromStationId: "Lviv", toStationId: "Ternopil", departureEpochMs: base + 145 * M, arrivalEpochMs: base + 185 * M },
	{ id: "s22", trainId: "IC999", fromStationId: "Ternopil", toStationId: "Khmelnytskyi", departureEpochMs: base + 190 * M, arrivalEpochMs: base + 230 * M },
	{ id: "s23", trainId: "IC999", fromStationId: "Khmelnytskyi", toStationId: "Vinnytsia", departureEpochMs: base + 235 * M, arrivalEpochMs: base + 275 * M },
	{ id: "s24", trainId: "IC999", fromStationId: "Vinnytsia", toStationId: "Odesa", departureEpochMs: base + 280 * M, arrivalEpochMs: base + 360 * M },

	// SEAT CHANGE DEMONSTRATION: Regional train R777 with frequent stops
	{ id: "s25", trainId: "R777", fromStationId: "Kyiv", toStationId: "Bila_Tserkva", departureEpochMs: base + 40 * M, arrivalEpochMs: base + 70 * M },
	{ id: "s26", trainId: "R777", fromStationId: "Bila_Tserkva", toStationId: "Uman", departureEpochMs: base + 75 * M, arrivalEpochMs: base + 105 * M },
	{ id: "s27", trainId: "R777", fromStationId: "Uman", toStationId: "Mykolaiv", departureEpochMs: base + 110 * M, arrivalEpochMs: base + 150 * M },
	{ id: "s28", trainId: "R777", fromStationId: "Mykolaiv", toStationId: "Odesa", departureEpochMs: base + 155 * M, arrivalEpochMs: base + 185 * M },
];

export const mockedAvailability: SegmentAvailability[] = [
	// ICE trains - first class seating (wagons 1-3)
	{ segmentId: "s1", availableSeatIds: new Set(["1-1", "1-2", "1-5", "1-8", "2-3", "2-7", "2-12"]) },
	{ segmentId: "s2", availableSeatIds: new Set(["1-4", "1-6", "2-1", "2-9", "2-15", "3-2", "3-11"]) },
	{ segmentId: "s3", availableSeatIds: new Set(["1-3", "1-7", "1-10", "2-2", "2-6", "2-14", "3-5"]) },
	{ segmentId: "s4", availableSeatIds: new Set(["1-9", "2-4", "2-8", "2-13", "3-1", "3-6", "3-12"]) },
	{ segmentId: "s5", availableSeatIds: new Set(["1-11", "1-16", "2-5", "2-10", "3-3", "3-8", "3-15"]) },
	{ segmentId: "s6", availableSeatIds: new Set(["1-13", "1-18", "2-11", "2-16", "3-4", "3-9", "3-14"]) },

	// Regional trains - economy seating (wagons 4-8)
	{ segmentId: "s7", availableSeatIds: new Set(["4-1", "4-5", "4-12", "5-8", "5-15", "6-3", "6-9", "6-18"]) },
	{ segmentId: "s8", availableSeatIds: new Set(["4-7", "4-14", "5-2", "5-11", "6-6", "6-13", "7-4", "7-16"]) },
	{ segmentId: "s9", availableSeatIds: new Set(["4-9", "4-16", "5-5", "5-14", "6-1", "6-10", "7-7", "7-19"]) },
	{ segmentId: "s10", availableSeatIds: new Set(["4-11", "4-18", "5-7", "5-16", "6-4", "6-12", "7-2", "7-15"]) },
	{ segmentId: "s11", availableSeatIds: new Set(["4-13", "4-20", "5-9", "5-18", "6-7", "6-14", "7-5", "7-17"]) },
	{ segmentId: "s12", availableSeatIds: new Set(["4-15", "4-22", "5-12", "5-20", "6-9", "6-16", "7-8", "7-21"]) },

	// InterCity trains - mixed seating (wagons 3-5)
	{ segmentId: "s13", availableSeatIds: new Set(["3-7", "3-13", "4-2", "4-8", "5-1", "5-6"]) },
	{ segmentId: "s14", availableSeatIds: new Set(["3-9", "3-15", "4-4", "4-10", "5-3", "5-8"]) },

	// Express trains - premium seating (wagons 1-2, fewer seats but more comfort)
	{ segmentId: "s15", availableSeatIds: new Set(["1-1", "1-3", "1-7", "2-2", "2-5", "2-8"]) },
	{ segmentId: "s16", availableSeatIds: new Set(["1-2", "1-4", "1-8", "2-1", "2-6", "2-9"]) },
	{ segmentId: "s17", availableSeatIds: new Set(["1-5", "1-9", "2-3", "2-7", "2-10", "2-12"]) },

	// SEAT CHANGE DEMONSTRATION: IC999 train - showing seat availability changes
	// Kyiv to Zhytomyr - seats 3-1, 3-5, 4-2 available
	{ segmentId: "s18", availableSeatIds: new Set(["3-1", "3-5", "4-2", "4-8", "5-3", "5-7"]) },
	// Zhytomyr to Rivne - seats 3-1, 3-5 now taken, but 3-9, 3-12 become available
	{ segmentId: "s19", availableSeatIds: new Set(["3-9", "3-12", "4-2", "4-8", "5-3", "5-7", "5-11"]) },
	// Rivne to Lviv - seat 4-2 now taken, but 4-15 becomes available
	{ segmentId: "s20", availableSeatIds: new Set(["3-9", "3-12", "4-8", "4-15", "5-3", "5-7", "5-11"]) },
	// Lviv to Ternopil - seats 3-9, 5-3 taken, but 3-6, 3-14 available  
	{ segmentId: "s21", availableSeatIds: new Set(["3-6", "3-12", "3-14", "4-8", "4-15", "5-7", "5-11"]) },
	// Ternopil to Khmelnytskyi - seat 4-8 taken, 4-20 available
	{ segmentId: "s22", availableSeatIds: new Set(["3-6", "3-12", "3-14", "4-15", "4-20", "5-7", "5-11"]) },
	// Khmelnytskyi to Vinnytsia - seats 3-6, 5-7 taken, 3-18, 5-16 available
	{ segmentId: "s23", availableSeatIds: new Set(["3-12", "3-14", "3-18", "4-15", "4-20", "5-11", "5-16"]) },
	// Vinnytsia to Odesa - final segment, seats 3-12, 4-15 taken
	{ segmentId: "s24", availableSeatIds: new Set(["3-14", "3-18", "4-20", "5-11", "5-16"]) },

	// SEAT CHANGE DEMONSTRATION: R777 regional train
	// Kyiv to Bila Tserkva - initial available seats
	{ segmentId: "s25", availableSeatIds: new Set(["6-1", "6-4", "6-8", "7-2", "7-5", "8-3"]) },
	// Bila Tserkva to Uman - seat 6-1 taken, 6-12 becomes available
	{ segmentId: "s26", availableSeatIds: new Set(["6-4", "6-8", "6-12", "7-2", "7-5", "8-3", "8-7"]) },
	// Uman to Mykolaiv - seats 6-4, 7-2 taken, 6-16, 7-9 available
	{ segmentId: "s27", availableSeatIds: new Set(["6-8", "6-12", "6-16", "7-5", "7-9", "8-3", "8-7"]) },
	// Mykolaiv to Odesa - final segment  
	{ segmentId: "s28", availableSeatIds: new Set(["6-8", "6-12", "6-16", "7-5", "7-9", "8-3", "8-7"]) },
];

export function buildMockOptions() {
	return {
		origin: "Kyiv",
		destination: "Odesa",
		earliestDepartureEpochMs: base,
		passengers: 2,
		minTransferMinutes: 5,
		maxResults: 3,
	};
} 