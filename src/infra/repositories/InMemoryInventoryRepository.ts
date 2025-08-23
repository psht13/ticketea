import { InventoryRepository } from "@/domain/journey";
import { SegmentAvailability, SegmentId } from "@/domain/journey";

export class InMemoryInventoryRepository implements InventoryRepository {
  private availabilityMap = new Map<SegmentId, SegmentAvailability>();

  constructor(entries: SegmentAvailability[]) {
    for (const entry of entries) {
      this.availabilityMap.set(entry.segmentId, {
        segmentId: entry.segmentId,
        availableSeatIds: new Set(entry.availableSeatIds),
      });
    }
  }

  async getAvailabilityForSegments(
    segmentIds: SegmentId[],
  ): Promise<Map<SegmentId, SegmentAvailability>> {
    const map = new Map<SegmentId, SegmentAvailability>();
    for (const id of segmentIds) {
      const avail = this.availabilityMap.get(id);
      if (avail) {
        map.set(id, {
          segmentId: id,
          availableSeatIds: new Set(avail.availableSeatIds),
        });
      }
    }
    return map;
  }
}
