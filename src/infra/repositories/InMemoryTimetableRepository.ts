import { TimetableRepository } from "@/domain/journey";
import { SegmentId, StationId, TrainSegment } from "@/domain/journey";

export class InMemoryTimetableRepository implements TimetableRepository {
  private segmentById = new Map<SegmentId, TrainSegment>();
  private byOrigin = new Map<StationId, TrainSegment[]>();

  constructor(segments: TrainSegment[]) {
    for (const seg of segments) {
      this.segmentById.set(seg.id, seg);
      if (!this.byOrigin.has(seg.fromStationId))
        this.byOrigin.set(seg.fromStationId, []);
      this.byOrigin.get(seg.fromStationId)!.push(seg);
    }
    for (const [, list] of this.byOrigin) {
      list.sort((a, b) => a.departureEpochMs - b.departureEpochMs);
    }
  }

  async getSegmentsFromStation(
    stationId: StationId,
    earliestDepartureEpochMs: number,
  ): Promise<TrainSegment[]> {
    return (this.byOrigin.get(stationId) ?? []).filter(
      (s) => s.departureEpochMs >= earliestDepartureEpochMs,
    );
  }

  async getSegmentsByIds(segmentIds: SegmentId[]): Promise<TrainSegment[]> {
    return segmentIds.map((id) => this.segmentById.get(id)!).filter(Boolean);
  }
}
