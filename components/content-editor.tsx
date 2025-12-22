"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ContentSection {
  id: string
  section_key: string
  title: string
  content: any
  updated_at: string
}

interface ContentEditorProps {
  sections: ContentSection[]
  userId: string
}

export function ContentEditor({ sections, userId }: ContentEditorProps) {
  const [selectedSection, setSelectedSection] = useState<ContentSection | null>(sections[0] || null)
  const [editedContent, setEditedContent] = useState<string>(
    selectedSection ? JSON.stringify(selectedSection.content, null, 2) : "",
  )
  const [editedTitle, setEditedTitle] = useState<string>(selectedSection?.title || "")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSectionSelect = (section: ContentSection) => {
    setSelectedSection(section)
    setEditedContent(JSON.stringify(section.content, null, 2))
    setEditedTitle(section.title)
    setSaveMessage(null)
  }

  const handleSave = async () => {
    if (!selectedSection) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const supabase = createClient()

      // Parse JSON content
      let parsedContent
      try {
        parsedContent = JSON.parse(editedContent)
      } catch (e) {
        setSaveMessage("Error: Invalid JSON format")
        setIsSaving(false)
        return
      }

      const { error } = await supabase
        .from("content_sections")
        .update({
          title: editedTitle,
          content: parsedContent,
          updated_by: userId,
        })
        .eq("id", selectedSection.id)

      if (error) throw error

      setSaveMessage("✓ Changes saved successfully!")
      setTimeout(() => setSaveMessage(null), 3000)

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      setSaveMessage(`Error: ${error instanceof Error ? error.message : "Failed to save"}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Section List */}
      <div className="lg:col-span-1">
        <Card className="bg-[#111116] border-[#27272a]">
          <CardHeader>
            <CardTitle className="text-white">Content Sections</CardTitle>
            <CardDescription className="text-[#a1a1aa]">Select a section to edit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={selectedSection?.id === section.id ? "default" : "outline"}
                className={`w-full justify-start ${
                  selectedSection?.id === section.id
                    ? "bg-[#3b82f6] hover:bg-[#2563eb]"
                    : "border-[#27272a] text-white hover:bg-[#18181b]"
                }`}
                onClick={() => handleSectionSelect(section)}
              >
                {section.title}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Editor */}
      <div className="lg:col-span-3">
        {selectedSection ? (
          <Card className="bg-[#111116] border-[#27272a]">
            <CardHeader>
              <CardTitle className="text-white">Edit: {selectedSection.title}</CardTitle>
              <CardDescription className="text-[#a1a1aa]">
                Last updated: {new Date(selectedSection.updated_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Section Title
                </Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-[#18181b] border-[#27272a] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-white">
                  Content (JSON Format)
                </Label>
                <Textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={20}
                  className="bg-[#18181b] border-[#27272a] text-white font-mono text-sm"
                  placeholder="Edit content in JSON format..."
                />
                <p className="text-xs text-[#a1a1aa]">
                  Note: Content must be valid JSON. Use proper escaping for quotes and special characters.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  {saveMessage && (
                    <p className={`text-sm ${saveMessage.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                      {saveMessage}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#111116] border-[#27272a]">
            <CardHeader>
              <CardTitle className="text-white">No Section Selected</CardTitle>
              <CardDescription className="text-[#a1a1aa]">
                Select a section from the sidebar to begin editing
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}
