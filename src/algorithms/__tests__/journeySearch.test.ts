import { describe, it, expect } from "vitest";
import { InMemoryTimetableRepository } from "@/infra/repositories/InMemoryTimetableRepository";
import { InMemoryInventoryRepository } from "@/infra/repositories/InMemoryInventoryRepository";
import { findJourneys } from "@/algorithms/journeySearch";
import { TrainSegment } from "@/domain/journey";

describe("findJourneys", () => {
  it("finds journey with intermediate stops and seat changes", async () => {
    const segments: TrainSegment[] = [
      {
        id: "s1",
        trainId: "T1",
        fromStationId: "A",
        toStationId: "B",
        departureEpochMs: 1000,
        arrivalEpochMs: 2000,
      },
      {
        id: "s2",
        trainId: "T1",
        fromStationId: "B",
        toStationId: "D",
        departureEpochMs: 2100,
        arrivalEpochMs: 3000,
      },
      {
        id: "s3",
        trainId: "T2",
        fromStationId: "A",
        toStationId: "C",
        departureEpochMs: 1200,
        arrivalEpochMs: 1900,
      },
      {
        id: "s4",
        trainId: "T2",
        fromStationId: "C",
        toStationId: "D",
        departureEpochMs: 2000,
        arrivalEpochMs: 2900,
      },
    ];
    const timetable = new InMemoryTimetableRepository(segments);
    const inventory = new InMemoryInventoryRepository([
      { segmentId: "s1", availableSeatIds: new Set(["a1"]) },
      { segmentId: "s2", availableSeatIds: new Set(["b1"]) },
      { segmentId: "s3", availableSeatIds: new Set(["c1"]) },
      { segmentId: "s4", availableSeatIds: new Set(["d1"]) },
    ]);
    const journeys = await findJourneys(timetable, inventory, {
      origin: "A",
      destination: "D",
      earliestDepartureEpochMs: 0,
      passengers: 1,
      minTransferMinutes: 0,
      maxResults: 5,
    });
    expect(journeys.length).toBeGreaterThan(0);
    const first = journeys[0];
    expect(first.segments.length).toBeGreaterThanOrEqual(2);
    // allow same train or different, but ensure seats assigned
    for (const seg of first.segments) {
      expect(seg.seatAssignments.length).toBe(1);
    }
  });

  it("respects transfer time and seat availability per segment", async () => {
    const segments: TrainSegment[] = [
      {
        id: "s1",
        trainId: "T1",
        fromStationId: "A",
        toStationId: "B",
        departureEpochMs: 1000,
        arrivalEpochMs: 2000,
      },
      {
        id: "s2",
        trainId: "T1",
        fromStationId: "B",
        toStationId: "D",
        departureEpochMs: 2050,
        arrivalEpochMs: 3000,
      }, // too short transfer if min 2 min
      {
        id: "s3",
        trainId: "T1",
        fromStationId: "B",
        toStationId: "D",
        departureEpochMs: 2300,
        arrivalEpochMs: 3100,
      },
    ];
    const timetable = new InMemoryTimetableRepository(segments);
    const inventory = new InMemoryInventoryRepository([
      { segmentId: "s1", availableSeatIds: new Set(["a1"]) },
      { segmentId: "s2", availableSeatIds: new Set(["b1"]) },
      { segmentId: "s3", availableSeatIds: new Set([]) }, // no seats
    ]);
    const journeys = await findJourneys(timetable, inventory, {
      origin: "A",
      destination: "D",
      earliestDepartureEpochMs: 0,
      passengers: 1,
      minTransferMinutes: 2,
      maxResults: 5,
    });
    // s2 has seats but transfer is too short; s3 has no seats; expect 0
    expect(journeys.length).toBe(0);
  });
});
