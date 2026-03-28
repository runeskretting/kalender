"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction"
import type { DateClickArg } from "@fullcalendar/interaction"
import type { EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"
import nbLocale from "@fullcalendar/core/locales/nb"
import EventModal from "@/components/calendar/EventModal"
import type { CalendarEvent, Role } from "@/lib/types"

type ViewType = "dayGridMonth" | "timeGridWeek" | "listWeek"
type ModalState =
  | { mode: "closed" }
  | { mode: "create"; date: Date }
  | { mode: "view"; event: CalendarEvent }
  | { mode: "edit"; event: CalendarEvent }

interface CalendarClientProps {
  userRole: Role
  userId: string
}

function toEventInput(event: CalendarEvent): EventInput {
  return {
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: event.endTime ? new Date(event.endTime) : undefined,
    allDay: event.allDay,
    backgroundColor: event.color,
    borderColor: event.color,
    extendedProps: { event },
  }
}

export default function CalendarClient({ userRole, userId }: CalendarClientProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [view, setView] = useState<ViewType>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return "listWeek"
    return "dayGridMonth"
  })
  const [modal, setModal] = useState<ModalState>({ mode: "closed" })
  const [title, setTitle] = useState("")

  // Update calendar title when view changes
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api) setTitle(api.view.title)
  }, [view])

  function changeView(v: ViewType) {
    setView(v)
    calendarRef.current?.getApi().changeView(v)
    setTimeout(() => {
      const api = calendarRef.current?.getApi()
      if (api) setTitle(api.view.title)
    }, 0)
  }

  function navigate(dir: "prev" | "next" | "today") {
    const api = calendarRef.current?.getApi()
    if (!api) return
    if (dir === "prev") api.prev()
    else if (dir === "next") api.next()
    else api.today()
    setTitle(api.view.title)
  }

  const fetchEvents = useCallback(
    async (
      info: { start: Date; end: Date },
      successCallback: (events: EventInput[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      try {
        const start = info.start.toISOString()
        const end = info.end.toISOString()
        const res = await fetch(`/api/events?start=${start}&end=${end}`)
        if (!res.ok) throw new Error("Kunne ikke laste hendelser")
        const data: CalendarEvent[] = await res.json()
        successCallback(data.map(toEventInput))
      } catch (err) {
        failureCallback(err instanceof Error ? err : new Error("Ukjent feil"))
      }
    },
    []
  )

  function handleDateClick(arg: DateClickArg) {
    setModal({ mode: "create", date: arg.date })
  }

  function handleEventClick(arg: EventClickArg) {
    const event: CalendarEvent = arg.event.extendedProps.event
    setModal({ mode: "view", event })
  }

  async function handleEventDrop(arg: EventDropArg) {
    const event: CalendarEvent = arg.event.extendedProps.event
    const canModify = userRole === "parent" || event.creatorId === userId
    if (!canModify) {
      arg.revert()
      return
    }
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: arg.event.start?.toISOString(),
          endTime: arg.event.end?.toISOString() ?? null,
        }),
      })
      if (!res.ok) arg.revert()
    } catch {
      arg.revert()
    }
  }

  async function handleEventResize(arg: EventResizeDoneArg) {
    const event: CalendarEvent = arg.event.extendedProps.event
    const canModify = userRole === "parent" || event.creatorId === userId
    if (!canModify) {
      arg.revert()
      return
    }
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: arg.event.start?.toISOString(),
          endTime: arg.event.end?.toISOString() ?? null,
        }),
      })
      if (!res.ok) arg.revert()
    } catch {
      arg.revert()
    }
  }

  function refreshCalendar() {
    calendarRef.current?.getApi().refetchEvents()
  }

  const viewLabels: Record<ViewType, string> = {
    dayGridMonth: "Måned",
    timeGridWeek: "Uke",
    listWeek: "Liste",
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("prev")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Forrige"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => navigate("today")}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block"
          >
            I dag
          </button>
          <button
            onClick={() => navigate("next")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Neste"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <h2 className="text-sm sm:text-base font-semibold text-gray-800 capitalize truncate">
          {title}
        </h2>

        <div className="flex items-center gap-1">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs sm:text-sm">
            {(Object.keys(viewLabels) as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => changeView(v)}
                className={`px-2 sm:px-3 py-1.5 font-medium transition-colors ${
                  view === v
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {viewLabels[v]}
              </button>
            ))}
          </div>
          {/* Add event button */}
          <button
            onClick={() => setModal({ mode: "create", date: new Date() })}
            className="ml-1 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            aria-label="Ny hendelse"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden px-2 py-2 sm:px-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={view}
          locale={nbLocale}
          headerToolbar={false}
          height="100%"
          events={fetchEvents}
          editable={true}
          selectable={true}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          nowIndicator={true}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          firstDay={1}
          listDayFormat={{ weekday: "long", day: "numeric", month: "long" }}
          listDaySideFormat={false}
          noEventsText="Ingen hendelser"
        />
      </div>

      {/* Modals */}
      {modal.mode === "create" && (
        <EventModal
          mode="create"
          initialDate={modal.date}
          userRole={userRole}
          userId={userId}
          onClose={() => setModal({ mode: "closed" })}
          onCreated={() => { setModal({ mode: "closed" }); refreshCalendar() }}
          onUpdated={() => { setModal({ mode: "closed" }); refreshCalendar() }}
          onDeleted={() => { setModal({ mode: "closed" }); refreshCalendar() }}
          onEditRequest={() => {}}
        />
      )}
      {modal.mode === "view" && (
        <EventModal
          mode="view"
          event={modal.event}
          userRole={userRole}
          userId={userId}
          onClose={() => setModal({ mode: "closed" })}
          onCreated={() => {}}
          onUpdated={() => { setModal({ mode: "closed" }); refreshCalendar() }}
          onDeleted={() => { setModal({ mode: "closed" }); refreshCalendar() }}
          onEditRequest={() => setModal({ mode: "edit", event: modal.event })}
        />
      )}
      {modal.mode === "edit" && (
        <EventModal
          mode="edit"
          event={modal.event}
          userRole={userRole}
          userId={userId}
          onClose={() => setModal({ mode: "closed" })}
          onCreated={() => {}}
          onUpdated={() => { setModal({ mode: "closed" }); refreshCalendar() }}
          onDeleted={() => { setModal({ mode: "closed" }); refreshCalendar() }}
          onEditRequest={() => {}}
        />
      )}
    </div>
  )
}
