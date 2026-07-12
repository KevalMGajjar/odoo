import { withAuth, readJson } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { completeTrip } from "@/lib/services/trip.service";
import { tripCompleteSchema } from "@/lib/validation/trip";

export const POST = withAuth<{ id: string }>(
  async (req, { params, auth }) => {
    const input = tripCompleteSchema.parse(await readJson(req));
    return ok(await completeTrip(params.id, input, auth.userId));
  },
  { module: "trips", level: "edit" },
);
