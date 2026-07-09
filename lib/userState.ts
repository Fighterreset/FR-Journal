import { supabase } from "./supabase";

export async function loadUserState<T>(userId: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("user_state")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.data as T) ?? null;
}

export async function saveUserState(userId: string, state: any) {
  const { error } = await supabase.from("user_state").upsert({
    user_id: userId,
    data: state,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}
