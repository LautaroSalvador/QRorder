import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";

import { staffRoleSchema } from "@/lib/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const staffProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1),
  role: staffRoleSchema,
  active: z.boolean(),
  created_at: z.string(),
});

export type StaffProfile = z.infer<typeof staffProfileSchema>;

export type StaffSession = {
  user: User;
  profile: StaffProfile;
};

export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profileData, error: profileError } = await supabase
    .from("staff_users")
    .select("id, email, full_name, role, active, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    return null;
  }

  const parsedProfile = staffProfileSchema.safeParse(profileData);

  if (!parsedProfile.success) {
    return null;
  }

  return {
    user,
    profile: parsedProfile.data,
  };
});

export async function requireStaffSession() {
  const session = await getStaffSession();

  if (!session || !session.profile.active) {
    redirect("/staff/login");
  }

  return session;
}

export async function requireAdminStaffSession() {
  const session = await requireStaffSession();

  if (session.profile.role !== "admin") {
    redirect("/staff/cashier");
  }

  return session;
}
