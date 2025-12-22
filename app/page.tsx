import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch content from database
  const { data: sections } = await supabase.from("content_sections").select("*").order("section_key")

  // For simplicity, we'll import the original HTML and display it
  // In a production app, you'd parse the content and render it dynamically
  redirect("/cheat-sheet")
}
