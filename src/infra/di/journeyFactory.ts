import { InMemoryTimetableRepository } from "@/infra/repositories/InMemoryTimetableRepository";
import { InMemoryInventoryRepository } from "@/infra/repositories/InMemoryInventoryRepository";
import { JourneyPlannerService } from "@/application";
import { SegmentAvailability, TrainSegment } from "@/domain/journey";

export interface BuildJourneyServiceOptions {
  segments: TrainSegment[];
  availability: SegmentAvailability[];
}

export function buildJourneyPlannerService(opts: BuildJourneyServiceOptions) {
  const timetable = new InMemoryTimetableRepository(opts.segments);
  const inventory = new InMemoryInventoryRepository(opts.availability);
  return new JourneyPlannerService(timetable, inventory);
}
