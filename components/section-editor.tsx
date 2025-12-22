"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Section {
  id: string
  section_key: string
  section_title: string
  section_order: number
  html_content: string
}

export function SectionEditor({ sections: initialSections }: { sections: Section[] }) {
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [selectedSection, setSelectedSection] = useState<Section | null>(initialSections[0] || null)
  const [editedContent, setEditedContent] = useState(initialSections[0]?.html_content || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const handleSave = async () => {
    if (!selectedSection) return

    setSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSection.id,
          html_content: editedContent,
        }),
      })

      if (response.ok) {
        setMessage("Section saved successfully!")
        const updatedSections = sections.map((s) =>
          s.id === selectedSection.id ? { ...s, html_content: editedContent } : s,
        )
        setSections(updatedSections)
      } else {
        setMessage("Error saving section")
      }
    } catch (error) {
      setMessage("Error saving section")
    } finally {
      setSaving(false)
    }
  }

  const selectSection = (section: Section) => {
    setSelectedSection(section)
    setEditedContent(section.html_content)
    setMessage("")
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Section List */}
      <div className="col-span-1 bg-[#111116] border border-[#27272a] rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 text-[#3b82f6]">Sections</h2>
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => selectSection(section)}
              className={`w-full text-left px-3 py-2 rounded transition-colors ${
                selectedSection?.id === section.id
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a]"
              }`}
            >
              {section.section_title}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="col-span-3 bg-[#111116] border border-[#27272a] rounded-lg p-6">
        {selectedSection ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{selectedSection.section_title}</h2>
              <Button onClick={handleSave} disabled={saving} className="bg-[#3b82f6] hover:bg-[#2563eb]">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded ${
                  message.includes("Error") ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"
                }`}
              >
                {message}
              </div>
            )}

            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[600px] bg-[#18181b] border border-[#27272a] rounded-lg p-4 font-mono text-sm text-[#e4e4e7] resize-none focus:outline-none focus:border-[#3b82f6]"
              placeholder="Edit HTML content here..."
            />

            <div className="mt-4 p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
              <h3 className="text-sm font-semibold mb-2 text-[#3b82f6]">Preview:</h3>
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: editedContent }} />
            </div>
          </>
        ) : (
          <div className="text-center text-[#a1a1aa] py-20">Select a section to edit</div>
        )}
      </div>
    </div>
  )
}
