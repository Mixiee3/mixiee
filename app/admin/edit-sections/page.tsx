import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SectionEditor } from "@/components/section-editor"

export const dynamic = "force-dynamic"

export default async function EditSectionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check admin status
  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    redirect("/")
  }

  // Fetch all sections
  const { data: sections, error } = await supabase.from("editable_sections").select("*").order("section_order")

  console.log("[v0] Fetched sections count:", sections?.length)
  console.log(
    "[v0] Section titles:",
    sections?.map((s) => s.section_title),
  )

  if (error) {
    console.error("[v0] Error fetching sections:", error)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Edit Cheat Sheet Sections</h1>
          <Link href="/admin" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            Back to Admin
          </Link>
        </div>

        <p className="mb-4 text-gray-400">Total sections loaded: {sections?.length || 0}</p>

        <SectionEditor sections={sections || []} />
      </div>
    </div>
  )
}
