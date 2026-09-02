"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect(`${LOGIN_PATH}?status=sessao-encerrada`);
}
