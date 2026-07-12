import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { cancelTrip } from "@/lib/services/trip.service";

export const POST = withAuth<{ id: string }>(
  async (_req, { params, auth }) => ok(await cancelTrip(params.id, auth.userId)),
  { module: "trips", level: "edit" },
);
