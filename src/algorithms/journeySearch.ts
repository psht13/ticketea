import { InventoryRepository, TimetableRepository } from "@/domain/journey";
import {
  JourneyPlan,
  JourneySearchOptions,
  JourneySegmentAssignment,
  SeatAssignment,
  SegmentId,
  StationId,
  TrainId,
  TrainSegment,
} from "@/domain/journey";

interface State {
  currentStation: StationId;
  currentTimeMs: number;
  segments: TrainSegment[];
  assignments: JourneySegmentAssignment[];
  usedSegmentIds: Set<SegmentId>;
  lastTrainId: TrainId | null;
  changes: number;
  initialDepartureMs: number;
}

class MinHeap<T> {
  private data: { key: number; value: T }[] = [];
  push(key: number, value: T) {
    this.data.push({ key, value });
    this.bubbleUp(this.data.length - 1);
  }
  pop(): { key: number; value: T } | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  private bubbleUp(index: number) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.data[parent].key <= this.data[index].key) break;
      [this.data[parent], this.data[index]] = [
        this.data[index],
        this.data[parent],
      ];
      index = parent;
    }
  }
  private bubbleDown(index: number) {
    const length = this.data.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      if (left < length && this.data[left].key < this.data[smallest].key)
        smallest = left;
      if (right < length && this.data[right].key < this.data[smallest].key)
        smallest = right;
      if (smallest === index) break;
      [this.data[smallest], this.data[index]] = [
        this.data[index],
        this.data[smallest],
      ];
      index = smallest;
    }
  }
}

function assignSeats(
  availableSeatIds: Set<string>,
  passengers: number,
): SeatAssignment[] | null {
  if (availableSeatIds.size < passengers) return null;
  const chosen: string[] = [];
  const iter = availableSeatIds.values();
  for (let i = 0; i < passengers; i++) {
    const next = iter.next();
    if (next.done) return null;
    chosen.push(next.value);
  }
  return chosen.map((seatId, idx) => ({ passengerIndex: idx, seatId }));
}

export async function findJourneys(
  timetable: TimetableRepository,
  inventory: InventoryRepository,
  options: JourneySearchOptions,
): Promise<JourneyPlan[]> {
  const maxResults = options.maxResults ?? 5;
  const minTransferMs = (options.minTransferMinutes ?? 2) * 60_000;
  const frontier = new MinHeap<State>();
  const results: JourneyPlan[] = [];

  const initialSegments = await timetable.getSegmentsFromStation(
    options.origin,
    options.earliestDepartureEpochMs,
  );
  for (const seg of initialSegments) {
    const availMap = await inventory.getAvailabilityForSegments([seg.id]);
    const avail = availMap.get(seg.id);
    if (!avail) continue;
    const seatAssignments = assignSeats(
      avail.availableSeatIds,
      options.passengers,
    );
    if (!seatAssignments) continue;
    const state: State = {
      currentStation: seg.toStationId,
      currentTimeMs: seg.arrivalEpochMs,
      segments: [seg],
      assignments: [{ segment: seg, seatAssignments }],
      usedSegmentIds: new Set<SegmentId>([seg.id]),
      lastTrainId: seg.trainId,
      changes: 0,
      initialDepartureMs: seg.departureEpochMs,
    };
    const key =
      seg.arrivalEpochMs -
      state.initialDepartureMs +
      state.changes * 10 * 60_000;
    frontier.push(key, state);
  }

  while (results.length < maxResults) {
    const item = frontier.pop();
    if (!item) break;
    const state = item.value;

    if (state.currentStation === options.destination) {
      const totalDurationMinutes = Math.round(
        (state.currentTimeMs - state.initialDepartureMs) / 60_000,
      );
      const numberOfChanges = state.changes;
      results.push({
        segments: state.assignments,
        totalDurationMinutes,
        numberOfChanges,
      });
      continue;
    }

    const nextEarliest = state.currentTimeMs + minTransferMs;
    const nextSegments = await timetable.getSegmentsFromStation(
      state.currentStation,
      nextEarliest,
    );
    for (const seg of nextSegments) {
      if (state.usedSegmentIds.has(seg.id)) continue; // avoid cycles through identical segments
      const availMap = await inventory.getAvailabilityForSegments([seg.id]);
      const avail = availMap.get(seg.id);
      if (!avail) continue;
      const seatAssignments = assignSeats(
        avail.availableSeatIds,
        options.passengers,
      );
      if (!seatAssignments) continue;
      const changes =
        state.changes + (seg.trainId === state.lastTrainId ? 0 : 1);
      const newSegments = [...state.segments, seg];
      const newAssignments: JourneySegmentAssignment[] = [
        ...state.assignments,
        { segment: seg, seatAssignments },
      ];
      const usedIds = new Set(state.usedSegmentIds);
      usedIds.add(seg.id);
      const nextState: State = {
        currentStation: seg.toStationId,
        currentTimeMs: seg.arrivalEpochMs,
        segments: newSegments,
        assignments: newAssignments,
        usedSegmentIds: usedIds,
        lastTrainId: seg.trainId,
        changes,
        initialDepartureMs: state.initialDepartureMs,
      };
      const key =
        seg.arrivalEpochMs -
        nextState.initialDepartureMs +
        changes * 10 * 60_000;
      frontier.push(key, nextState);
    }
  }

  return results;
}
