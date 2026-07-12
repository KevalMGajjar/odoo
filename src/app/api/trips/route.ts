import { withAuth, readJson, asEnum } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { TripStatus } from "@prisma/client";
import { listTrips, createTrip } from "@/lib/services/trip.service";
import { tripCreateSchema } from "@/lib/validation/trip";

export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const data = await listTrips({
      status: asEnum(TripStatus, searchParams.get("status")),
      search: searchParams.get("search") ?? undefined,
    });
    return ok(data);
  },
  { module: "trips", level: "view" },
);

export const POST = withAuth(
  async (req, { auth }) => {
    const input = tripCreateSchema.parse(await readJson(req));
    const trip = await createTrip(input, auth.userId);
    return ok(trip, { status: 201 });
  },
  { module: "trips", level: "edit" },
);
