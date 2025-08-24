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
  preferredSeatIds?: (string | null)[],
): SeatAssignment[] | null {
  if (availableSeatIds.size < passengers) return null;
  const used = new Set<string>();
  const chosen: (string | null)[] = new Array(passengers).fill(null);

  // First, try to honor preferred seats (for continuity on same train)
  if (preferredSeatIds && preferredSeatIds.length === passengers) {
    for (let i = 0; i < passengers; i++) {
      const pref = preferredSeatIds[i];
      if (pref && availableSeatIds.has(pref) && !used.has(pref)) {
        chosen[i] = pref;
        used.add(pref);
      }
    }
  }

  // Assign remaining passengers any available seats
  const iter = availableSeatIds.values();
  for (let i = 0; i < passengers; i++) {
    if (chosen[i] !== null) continue;
    let next: IteratorResult<string>;
    // Find next seat that isn't already used
    do {
      next = iter.next();
      if (next.done) return null;
    } while (used.has(next.value));
    chosen[i] = next.value;
    used.add(next.value);
  }

  return chosen.map((seatId, idx) => ({ passengerIndex: idx, seatId: seatId! }));
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

      const isSameTrain = seg.trainId === state.lastTrainId;
      const prevSeg = state.segments[state.segments.length - 1];

      // Fetch availability for current (and previous if same train) in one call
      const idsToFetch = isSameTrain ? [prevSeg.id, seg.id] as SegmentId[] : [seg.id];
      const availMap = await inventory.getAvailabilityForSegments(idsToFetch);
      const availCurrent = availMap.get(seg.id);
      if (!availCurrent) continue;

      if (isSameTrain) {
        const availPrev = availMap.get(prevSeg.id);
        if (!availPrev) continue;

        // Try strongest continuity: seats that are available on both previous and current segments
        const intersection: string[] = [];
        for (const id of availPrev.availableSeatIds) {
          if (availCurrent.availableSeatIds.has(id)) intersection.push(id);
        }

        if (intersection.length >= options.passengers) {
          // Reassign both previous and current segments to the same seats for full continuity
          const seatsToUse = intersection.slice(0, options.passengers);
          const prevSeatAssignments: SeatAssignment[] = seatsToUse.map((seatId, idx) => ({
            passengerIndex: idx,
            seatId,
          }));
          const currSeatAssignments: SeatAssignment[] = seatsToUse.map((seatId, idx) => ({
            passengerIndex: idx,
            seatId,
          }));

          const newSegments = [...state.segments, seg];
          const newAssignments: JourneySegmentAssignment[] = [
            ...state.assignments.slice(0, -1),
            { segment: prevSeg, seatAssignments: prevSeatAssignments },
            { segment: seg, seatAssignments: currSeatAssignments },
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
            changes: state.changes, // no change on same train
            initialDepartureMs: state.initialDepartureMs,
          };
          const key =
            seg.arrivalEpochMs -
            nextState.initialDepartureMs +
            nextState.changes * 10 * 60_000;
          frontier.push(key, nextState);
          continue;
        }

        // Partial continuity: keep seats that remain available; reassign only where necessary
        const lastAssign = state.assignments[state.assignments.length - 1];
        const preferred: (string | null)[] = new Array(options.passengers).fill(null);
        for (const a of lastAssign.seatAssignments) {
          preferred[a.passengerIndex] = a.seatId;
        }
        const currSeatAssignments = assignSeats(
          availCurrent.availableSeatIds,
          options.passengers,
          preferred,
        );
        if (!currSeatAssignments) continue;

        const changes = state.changes; // still same train
        const newSegments = [...state.segments, seg];
        const newAssignments: JourneySegmentAssignment[] = [
          ...state.assignments,
          { segment: seg, seatAssignments: currSeatAssignments },
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
        continue;
      }

      // Different train: simple assignment for this segment
      const seatAssignments = assignSeats(
        availCurrent.availableSeatIds,
        options.passengers,
      );
      if (!seatAssignments) continue;
      const changes = state.changes + 1;
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
