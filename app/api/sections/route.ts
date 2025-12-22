import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("editable_sections")
    .select("*")
    .eq("is_published", true)
    .order("section_order")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sections: data })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase.from("admin_users").select("id").eq("id", user.id).single()

  if (!adminCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id, html_content } = body

  const { data, error } = await supabase
    .from("editable_sections")
    .update({ html_content, updated_by: user.id })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ section: data })
}
