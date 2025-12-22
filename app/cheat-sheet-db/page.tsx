"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Section {
  id: string
  section_key: string
  section_title: string
  section_order: number
  html_content: string
}

export default function CheatSheetDBPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data) => {
        setSections(data.sections || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
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
  }, [loading])

  if (loading) {
    return (
      <div className="bg-[#050505] text-[#e4e4e7] min-h-screen flex items-center justify-center">
        <div className="text-[#3b82f6] text-xl">Loading...</div>
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
      `}</style>

      <Link
        href="/admin"
        className="fixed top-5 right-5 z-50 inline-block px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg transition-colors shadow-lg font-semibold"
      >
        Admin Panel
      </Link>

      <div className="bg-[#050505] text-[#e4e4e7] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-5 py-10">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`section-card hidden-section`}
              style={{ animationDelay: `${index * 0.1}s` }}
              dangerouslySetInnerHTML={{ __html: section.html_content }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
