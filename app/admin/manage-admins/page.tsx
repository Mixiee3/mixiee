import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminManager } from "@/components/admin-manager"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ManageAdminsPage() {
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
            <CardDescription className="text-[#a1a1aa]">You do not have permission to manage admins.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch all admins
  const { data: admins } = await supabase.from("admin_users").select("*").order("created_at")

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="container max-w-[1200px] mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-[#3b82f6] bg-clip-text text-transparent">
              Manage Admins
            </h1>
            <p className="text-[#a1a1aa] mt-2">Grant or revoke admin access</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin">
              <Button variant="outline" className="border-[#27272a] text-white hover:bg-[#111116] bg-transparent">
                Back to Admin Panel
              </Button>
            </Link>
          </div>
        </div>

        <AdminManager admins={admins || []} />
      </div>
    </div>
  )
}
