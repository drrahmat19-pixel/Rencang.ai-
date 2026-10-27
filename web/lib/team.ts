import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/tenant";

export type TeamMember = {
  id: string;
  user_id: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  created_at: string;
};

export async function listTeamMembers(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("team_list_members", { p_tenant_id: tenantId });
  return { members: (data ?? []) as TeamMember[], error };
}
