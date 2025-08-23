import {
  JourneyPlannerServicePort,
  JourneySearchOptions,
  JourneyPlan,
  TimetableRepository,
  InventoryRepository,
} from "@/domain/journey";
import { findJourneys } from "@/algorithms/journeySearch";

export class JourneyPlannerService implements JourneyPlannerServicePort {
  constructor(
    private readonly timetable: TimetableRepository,
    private readonly inventory: InventoryRepository,
  ) {}

  async searchJourneys(options: JourneySearchOptions): Promise<JourneyPlan[]> {
    return findJourneys(this.timetable, this.inventory, options);
  }
}
