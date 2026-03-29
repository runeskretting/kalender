"use client"

import Modal from "@/components/ui/Modal"
import EventForm, { EventFormData } from "@/components/calendar/EventForm"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import type { CalendarEvent, Role } from "@/lib/types"

type ModalMode = "create" | "edit" | "view"

interface EventModalProps {
  mode: ModalMode
  event?: CalendarEvent | null
  initialDate?: Date
  userRole: Role
  userId: string
  onClose: () => void
  onCreated: (event: CalendarEvent) => void
  onUpdated: (event: CalendarEvent) => void
  onDeleted: (id: string) => void
  onEditRequest: () => void
}

export default function EventModal({
  mode,
  event,
  initialDate,
  userRole,
  userId,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
  onEditRequest,
}: EventModalProps) {
  const canModify =
    userRole === "parent" || (event ? event.creatorId === userId : true)

  async function handleCreate(data: EventFormData) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        endTime: data.endTime || null,
      }),
    })
    if (!res.ok) {
      let errMsg = "Kunne ikke opprette hendelse"
      try { const err = await res.json(); errMsg = err.error ?? errMsg } catch {}
      throw new Error(errMsg)
    }
    const created: CalendarEvent = await res.json()
    onCreated(created)
    onClose()
  }

  async function handleUpdate(data: EventFormData) {
    if (!event) return
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        endTime: data.endTime || null,
      }),
    })
    if (!res.ok) {
      let errMsg = "Kunne ikke oppdatere hendelse"
      try { const err = await res.json(); errMsg = err.error ?? errMsg } catch {}
      throw new Error(errMsg)
    }
    const updated: CalendarEvent = await res.json()
    onUpdated(updated)
    onClose()
  }

  async function handleDelete() {
    if (!event) return
    if (!confirm(`Slett "${event.title}"?`)) return
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Kunne ikke slette hendelse")
    onDeleted(event.id)
    onClose()
  }

  const title =
    mode === "create"
      ? "Ny hendelse"
      : mode === "edit"
      ? "Rediger hendelse"
      : event?.title ?? ""

  const initialFormData: Partial<EventFormData> | undefined = event
    ? {
        title: event.title,
        description: event.description ?? "",
        startTime: event.startTime instanceof Date
          ? event.startTime.toISOString()
          : String(event.startTime),
        endTime: event.endTime
          ? event.endTime instanceof Date
            ? event.endTime.toISOString()
            : String(event.endTime)
          : "",
        allDay: event.allDay,
        color: event.color,
      }
    : initialDate
    ? { startTime: initialDate.toISOString() }
    : undefined

  return (
    <Modal open title={title} onClose={onClose}>
      {mode === "view" && event ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color }}
            />
            <span className="text-lg font-semibold text-gray-900">
              {event.title}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="mt-0.5">🕐</span>
              <div>
                {event.allDay ? (
                  <span>
                    {format(new Date(event.startTime), "d. MMMM yyyy", {
                      locale: nb,
                    })}
                    {event.endTime &&
                      ` – ${format(new Date(event.endTime), "d. MMMM yyyy", { locale: nb })}`}
                  </span>
                ) : (
                  <span>
                    {format(new Date(event.startTime), "d. MMMM yyyy HH:mm", {
                      locale: nb,
                    })}
                    {event.endTime &&
                      ` – ${format(new Date(event.endTime), "HH:mm", { locale: nb })}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          {canModify && (
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={onEditRequest}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Rediger
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                Slett
              </button>
            </div>
          )}
        </div>
      ) : (
        <EventForm
          initial={initialFormData}
          onSubmit={mode === "create" ? handleCreate : handleUpdate}
          onCancel={onClose}
          submitLabel={mode === "create" ? "Opprett" : "Lagre endringer"}
        />
      )}
    </Modal>
  )
}
