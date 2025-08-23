import { NextRequest, NextResponse } from "next/server";
import { buildJourneyPlannerService } from "@/infra/di/journeyFactory";
import {
  JourneySearchOptions,
  SegmentAvailability,
  TrainSegment,
} from "@/domain/journey";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const segments = (body.segments ?? []) as TrainSegment[];
    const availabilityRaw = (body.availability ?? []) as {
      segmentId: string;
      availableSeatIds: string[];
    }[];
    const options = body.options as JourneySearchOptions;

    if (
      !Array.isArray(segments) ||
      !options ||
      !options.origin ||
      !options.destination ||
      !options.passengers
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const availability: SegmentAvailability[] = availabilityRaw.map((a) => ({
      segmentId: a.segmentId,
      availableSeatIds: new Set(a.availableSeatIds),
    }));

    const service = buildJourneyPlannerService({ segments, availability });
    const journeys = await service.searchJourneys(options);
    return NextResponse.json({ journeys });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
