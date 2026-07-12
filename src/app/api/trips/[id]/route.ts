import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getTrip } from "@/lib/services/trip.service";

export const GET = withAuth<{ id: string }>(
  async (_req, { params }) => ok(await getTrip(params.id)),
  { module: "trips", level: "view" },
);
