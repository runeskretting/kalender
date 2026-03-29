"use client"

import { useRef, useState } from "react"
import Modal from "@/components/ui/Modal"
import type { CalendarEvent } from "@/lib/types"

interface LekseItem {
  subject: string
  description: string
  startDate: string
  endDate: string
}

interface ParsedUkeplan {
  week: number
  year: number
  items: LekseItem[]
}

type ModalState =
  | { stage: "idle" }
  | { stage: "loading" }
  | { stage: "preview"; data: ParsedUkeplan; items: LekseItem[] }
  | { stage: "saving" }
  | { stage: "error"; message: string }

interface Props {
  onClose: () => void
  onCreated: (event: CalendarEvent) => void
}

const COLORS = [
  { value: "#22c55e", label: "Grønn" },
  { value: "#3b82f6", label: "Blå" },
  { value: "#a855f7", label: "Lilla" },
  { value: "#f97316", label: "Oransje" },
  { value: "#ec4899", label: "Rosa" },
]

export default function UkeplanImportModal({ onClose, onCreated }: Props) {
  const [state, setState] = useState<ModalState>({ stage: "idle" })
  const [childName, setChildName] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("ukeplan_childName") ?? "" : ""
  )
  const [selectedColor, setSelectedColor] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("ukeplan_color") ?? "#22c55e" : "#22c55e"
  )
  const inputRef = useRef<HTMLInputElement>(null)

  function handleNameChange(val: string) {
    setChildName(val)
    localStorage.setItem("ukeplan_childName", val)
  }

  function handleColorChange(val: string) {
    setSelectedColor(val)
    localStorage.setItem("ukeplan_color", val)
  }

  async function handleFile(file: File) {
    setState({ stage: "loading" })

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/import/ukeplan", { method: "POST", body: formData })
    const json = await res.json()

    if (!res.ok) {
      setState({ stage: "error", message: json.error ?? "Ukjent feil" })
      return
    }

    const data = json as ParsedUkeplan
    setState({ stage: "preview", data, items: data.items })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type === "application/pdf") handleFile(file)
  }

  function updateItem(index: number, field: keyof LekseItem, value: string) {
    if (state.stage !== "preview") return
    const updated = state.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setState({ ...state, items: updated })
  }

  function removeItem(index: number) {
    if (state.stage !== "preview") return
    setState({ ...state, items: state.items.filter((_, i) => i !== index) })
  }

  async function handleSave() {
    if (state.stage !== "preview") return
    setState({ stage: "saving" })

    for (const item of state.items) {
      const startTime = new Date(item.startDate + "T00:00:00").toISOString()
      const endTime = new Date(item.endDate + "T23:59:59").toISOString()
      const name = childName.trim()

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name ? `Lekser (${name}): ${item.subject}` : `Lekser: ${item.subject}`,
          description: item.description,
          startTime,
          endTime,
          allDay: true,
          color: selectedColor,
        }),
      })

      if (res.ok) {
        const created: CalendarEvent = await res.json()
        onCreated(created)
      }
    }

    onClose()
  }

  return (
    <Modal open title="Last opp ukeplan" onClose={onClose}>
      {state.stage === "idle" && (
        <div className="flex flex-col gap-4">
          {/* Child name + color */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Hvem gjelder leksene?</label>
              <input
                type="text"
                placeholder="F.eks. Emma"
                value={childName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Farge</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => handleColorChange(c.value)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: c.value,
                      boxShadow: selectedColor === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className="flex flex-col items-center gap-4 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Klikk for å velge PDF</p>
              <p className="text-xs text-gray-500 mt-1">eller dra og slipp filen her</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>
        </div>
      )}

      {state.stage === "loading" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Leser PDF…</p>
        </div>
      )}

      {state.stage === "saving" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Oppretter hendelser…</p>
        </div>
      )}

      {state.stage === "error" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {state.message}
          </p>
          <button
            onClick={() => setState({ stage: "idle" })}
            className="py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Prøv igjen
          </button>
        </div>
      )}

      {state.stage === "preview" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Uke {state.data.week}, {state.data.year} — {state.items.length} lekser funnet.
            Du kan redigere eller slette før du importerer.
          </p>

          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {state.items.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <input
                    className="flex-1 text-sm font-medium text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                    value={item.subject}
                    onChange={(e) => updateItem(i, "subject", e.target.value)}
                  />
                  <button
                    onClick={() => removeItem(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-xs px-1"
                    title="Fjern"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  className="text-xs text-gray-600 border border-gray-100 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                  rows={3}
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                />
                <p className="text-xs text-gray-400">{item.startDate} – {item.endDate}</p>
              </div>
            ))}
          </div>

          {state.items.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">Ingen lekser igjen å importere.</p>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={state.items.length === 0}
              className="flex-1 py-2.5 bg-green-500 rounded-xl text-sm font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Importer {state.items.length > 0 ? `(${state.items.length})` : ""}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
