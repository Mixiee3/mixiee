import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentEditor } from "@/components/content-editor"
import Link from "next/link"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is an admin
  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 bg-[#050505]">
        <Card className="bg-[#111116] border-[#27272a] max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Access Denied</CardTitle>
            <CardDescription className="text-[#a1a1aa]">
              You do not have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[#a1a1aa] mb-4">Please contact an administrator to request access.</p>
            <form action="/api/auth/logout" method="POST">
              <Button type="submit" variant="outline" className="w-full bg-transparent">
                Logout
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch all content sections
  const { data: sections } = await supabase.from("content_sections").select("*").order("section_key")

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="container max-w-[1200px] mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-[#3b82f6] bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-[#a1a1aa] mt-2">Manage cheat sheet content</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/manage-admins">
              <Button variant="outline" className="border-[#27272a] text-white hover:bg-[#111116] bg-transparent">
                Manage Admins
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-[#27272a] text-white hover:bg-[#111116] bg-transparent">
                View Public Site
              </Button>
            </Link>
            <form action="/api/auth/logout" method="POST">
              <Button
                type="submit"
                variant="outline"
                className="border-[#27272a] text-white hover:bg-[#111116] bg-transparent"
              >
                Logout
              </Button>
            </form>
          </div>
        </div>

        <ContentEditor sections={sections || []} userId={user.id} />
      </div>
    </div>
  )
}
