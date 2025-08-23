import {
  JourneyPlan,
  JourneySearchOptions,
  SegmentAvailability,
  SegmentId,
  StationId,
  TrainSegment,
} from "./types";

export interface TimetableRepository {
  getSegmentsFromStation(
    stationId: StationId,
    earliestDepartureEpochMs: number,
  ): Promise<TrainSegment[]>;
  getSegmentsByIds(segmentIds: SegmentId[]): Promise<TrainSegment[]>;
}

export interface InventoryRepository {
  getAvailabilityForSegments(
    segmentIds: SegmentId[],
  ): Promise<Map<SegmentId, SegmentAvailability>>;
}

export interface JourneyPlannerServicePort {
  searchJourneys(options: JourneySearchOptions): Promise<JourneyPlan[]>;
}
