export type StationId = string;
export type TrainId = string;
export type SegmentId = string;
export type SeatId = string;

export interface TrainSegment {
  id: SegmentId;
  trainId: TrainId;
  fromStationId: StationId;
  toStationId: StationId;
  departureEpochMs: number;
  arrivalEpochMs: number;
}

export interface SegmentAvailability {
  segmentId: SegmentId;
  availableSeatIds: Set<SeatId>;
}

export interface SeatAssignment {
  passengerIndex: number;
  seatId: SeatId;
}

export interface JourneySegmentAssignment {
  segment: TrainSegment;
  seatAssignments: SeatAssignment[]; // One per passenger for this segment
}

export interface JourneyPlan {
  segments: JourneySegmentAssignment[];
  totalDurationMinutes: number;
  numberOfChanges: number; // Train changes count
}

export interface JourneySearchOptions {
  origin: StationId;
  destination: StationId;
  earliestDepartureEpochMs: number;
  passengers: number;
  minTransferMinutes?: number;
  maxResults?: number;
}
