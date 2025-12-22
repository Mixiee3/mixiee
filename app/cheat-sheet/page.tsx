"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Section {
  id: string
  section_key: string
  section_title: string
  section_order: number
  html_content: string
  is_published: boolean
}

export default function CheatSheetPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSections = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("editable_sections")
        .select("*")
        .eq("is_published", true)
        .order("section_order")

      if (!error && data) {
        setSections(data)
      }
      setLoading(false)
    }

    loadSections()
  }, [])

  useEffect(() => {
    if (!loading) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("show-section")
            }
          })
        },
        { threshold: 0.1 },
      )

      const hiddenElements = document.querySelectorAll(".hidden-section")
      hiddenElements.forEach((el) => observer.observe(el))

      return () => {
        hiddenElements.forEach((el) => observer.unobserve(el))
      }
    }
  }, [loading])

  if (loading) {
    return (
      <div className="bg-[#050505] text-[#e4e4e7] min-h-screen flex items-center justify-center">
        <div className="text-[#3b82f6] text-xl">Loading cheat sheet...</div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        .hidden-section {
          opacity: 0;
          transform: translateY(80px);
          transition: all 0.8s ease-out;
        }
        .show-section {
          opacity: 1;
          transform: translateY(0);
        }
        .section-card {
          background-color: #111116;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 35px;
          margin-bottom: 60px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          position: relative;
        }
        .section-card h3 {
          color: white;
          margin-top: 1.75rem;
          font-size: 1.25rem;
          border-bottom: 1px solid #27272a;
          padding-bottom: 0.5rem;
          display: inline-block;
        }
        .section-card ul {
          color: #a1a1aa;
          padding-left: 1.5rem;
        }
        .section-card li {
          margin-bottom: 0.5rem;
        }
        .section-card strong {
          color: white;
          font-weight: 600;
        }
        .section-card code {
          background-color: #18181b;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          color: #93c5fd;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .section-card pre {
          background-color: #18181b;
          border: 1px solid #27272a;
          border-left: 3px solid #3b82f6;
          padding: 1.25rem;
          font-family: monospace;
          font-size: 0.875rem;
          color: #93c5fd;
          overflow-x: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
          white-space: pre-wrap;
          word-break: break-word;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
        }
        .section-card h4 {
          color: #a1a1aa;
          margin-bottom: 0.625rem;
          text-transform: uppercase;
          font-size: 0.875rem;
          letter-spacing: 0.05em;
          font-weight: bold;
        }
        .section-card table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.25rem 0;
          background-color: #18181b;
          border-radius: 0.5rem;
          border: 1px solid #27272a;
          overflow: hidden;
        }
        .section-card th {
          text-align: left;
          padding: 1rem;
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .section-card td {
          padding: 1rem;
          border-bottom: 1px solid #27272a;
          color: #a1a1aa;
        }
        .section-card tr:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
      `}</style>

      <Link
        href="/admin"
        className="fixed top-5 right-5 z-50 inline-block px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg transition-colors shadow-lg font-semibold"
      >
        Admin Panel
      </Link>

      <div className="bg-[#050505] text-[#e4e4e7] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-5 py-10">
          <header className="text-center mb-[60px] border-b-2 border-[#27272a] pb-[30px] hidden-section">
            <h1
              className="text-5xl m-0 bg-gradient-to-r from-white to-[#3b82f6] bg-clip-text text-transparent uppercase tracking-wider"
              style={{ filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.2))" }}
            >
              Staff Cheat Sheet{" "}
              <span className="text-sm align-top text-[#3b82f6] border border-[#3b82f6] px-1.5 py-0.5 rounded ml-2.5">
                v3
              </span>
            </h1>
            <p className="mt-2.5 tracking-wide text-[#3b82f6]">OFFICIAL INTERNAL DOCUMENTATION</p>
          </header>

          {/* Dynamic Sections from Database */}
          {sections.map((section) => (
            <div key={section.id} className="section-card hidden-section">
              <h2
                className="text-[#3b82f6] border-l-[5px] border-[#3b82f6] pl-5 mt-0 mb-6 text-3xl rounded-r"
                style={{
                  background: "linear-gradient(90deg, rgba(59, 130, 246, 0.2), transparent)",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                }}
              >
                {section.section_title}
              </h2>
              <div dangerouslySetInnerHTML={{ __html: section.html_content }} />
            </div>
          ))}

          <footer className="text-center text-[#a1a1aa] mt-20 pb-10 text-sm opacity-60 hidden-section">
            <p>credits to tezzer</p>
          </footer>
        </div>
      </div>
    </>
  )
}
