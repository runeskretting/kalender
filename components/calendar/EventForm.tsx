"use client"

import { useState } from "react"
import ColorPicker from "@/components/ui/ColorPicker"
import { format } from "date-fns"

export interface EventFormData {
  title: string
  description: string
  startTime: string
  endTime: string
  allDay: boolean
  color: string
}

interface EventFormProps {
  initial?: Partial<EventFormData>
  onSubmit: (data: EventFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

function toDatetimeLocal(date?: Date | string | null): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

function toDateLocal(date?: Date | string | null): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "yyyy-MM-dd")
}

export default function EventForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Lagre",
}: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [allDay, setAllDay] = useState(initial?.allDay ?? false)
  const [startTime, setStartTime] = useState(
    initial?.startTime ? toDatetimeLocal(initial.startTime) : toDatetimeLocal(new Date())
  )
  const [endTime, setEndTime] = useState(initial?.endTime ? toDatetimeLocal(initial.endTime) : "")
  const [startDate, setStartDate] = useState(
    initial?.startTime ? toDateLocal(initial.startTime) : toDateLocal(new Date())
  )
  const [endDate, setEndDate] = useState(initial?.endTime ? toDateLocal(initial.endTime) : "")
  const [color, setColor] = useState(initial?.color ?? "#3b82f6")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const start = allDay ? `${startDate}T00:00:00.000Z` : new Date(startTime).toISOString()
    const end = allDay
      ? endDate ? `${endDate}T23:59:59.000Z` : null
      : endTime ? new Date(endTime).toISOString() : null

    if (end && new Date(end) <= new Date(start)) {
      setError("Sluttidspunkt må være etter starttidspunkt")
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        title,
        description,
        startTime: start,
        endTime: end ?? "",
        allDay,
        color,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tittel <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="F.eks. Fotballtrening"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Beskrivelse
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Valgfri beskrivelse..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allDay"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
        />
        <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
          Heldagshendelse
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start <span className="text-red-500">*</span>
          </label>
          {allDay ? (
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          ) : (
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slutt
          </label>
          {allDay ? (
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          ) : (
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={startTime}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Farge
        </label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Lagrer..." : submitLabel}
        </button>
      </div>
    </form>
  )
}
