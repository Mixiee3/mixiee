"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface Admin {
  id: string
  email: string
  created_at: string
}

interface AdminManagerProps {
  admins: Admin[]
}

export function AdminManager({ admins }: AdminManagerProps) {
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newAdminEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to grant access")
      }

      setMessage(`✓ Admin access granted to ${newAdminEmail}`)
      setNewAdminEmail("")
      setTimeout(() => {
        setMessage(null)
        router.refresh()
      }, 2000)
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Failed to grant access"}`)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add New Admin */}
      <Card className="bg-[#111116] border-[#27272a]">
        <CardHeader>
          <CardTitle className="text-white">Add New Admin</CardTitle>
          <CardDescription className="text-[#a1a1aa]">
            Grant admin access to a user by their email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                User Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="bg-[#18181b] border-[#27272a] text-white"
                required
              />
              <p className="text-xs text-[#a1a1aa]">The user must have already created an account.</p>
            </div>

            {message && (
              <p className={`text-sm ${message.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{message}</p>
            )}

            <Button type="submit" disabled={isAdding} className="w-full bg-[#3b82f6] hover:bg-[#2563eb]">
              {isAdding ? "Granting Access..." : "Grant Admin Access"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Admins List */}
      <Card className="bg-[#111116] border-[#27272a]">
        <CardHeader>
          <CardTitle className="text-white">Current Admins</CardTitle>
          <CardDescription className="text-[#a1a1aa]">{admins.length} admin users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-[#18181b] border border-[#27272a] rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{admin.email}</p>
                  <p className="text-xs text-[#a1a1aa]">Added: {new Date(admin.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {admins.length === 0 && <p className="text-[#a1a1aa] text-center py-4">No admins found</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
