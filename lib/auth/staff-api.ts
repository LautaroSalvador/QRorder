import { errorResponse } from "@/lib/api-response";
import { getStaffSession } from "@/lib/auth/staff";
import type { StaffRole } from "@/lib/staff";

export async function requireStaffApiSession(allowedRoles?: StaffRole[]) {
  const session = await getStaffSession();

  if (!session) {
    return {
      response: errorResponse("UNAUTHORIZED", "Sesión inválida.", 401),
    };
  }

  if (!session.profile.active) {
    return {
      response: errorResponse(
        "FORBIDDEN",
        "Tu usuario está desactivado.",
        403,
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.profile.role)) {
    return {
      response: errorResponse(
        "FORBIDDEN",
        "No tenés permisos para esta acción.",
        403,
      ),
    };
  }

  return { session };
}
