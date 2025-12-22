"use server"

import { createClient } from "@/lib/supabase/server"

export async function signUpAndAutoConfirm(email: string, password: string) {
  const supabase = await createClient()

  // Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!signUpData.user) {
    return { error: "Failed to create user" }
  }

  // Auto-confirm the user's email using admin privileges
  const { error: updateError } = await supabase.auth.admin.updateUserById(signUpData.user.id, {
    email_confirm: true,
  })

  if (updateError) {
    console.error("Failed to auto-confirm email:", updateError)
    // User is created but not confirmed - they can still use the verification email
  }

  return { success: true, user: signUpData.user }
}
