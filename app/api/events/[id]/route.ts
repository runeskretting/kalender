import { NextRequest, NextResponse } from "next/server"
import { requireAuth, canModifyEvent } from "@/lib/api/auth-helpers"
import { getEventById, updateEvent, deleteEvent } from "@/lib/api/events"
import { z } from "zod"

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
})

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error
  void session

  if (!uuidRegex.test(params.id)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
  }

  const event = await getEventById(params.id)
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(event)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error

  if (!uuidRegex.test(params.id)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
  }

  const event = await getEventById(params.id)
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!canModifyEvent(session!, event.creatorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = updateEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { startTime, endTime, ...rest } = parsed.data
  const updates: Parameters<typeof updateEvent>[1] = { ...rest }

  if (startTime !== undefined) updates.startTime = new Date(startTime)
  if (endTime !== undefined) updates.endTime = endTime ? new Date(endTime) : null

  const effectiveStart = updates.startTime ?? event.startTime
  const effectiveEnd = updates.endTime !== undefined ? updates.endTime : event.endTime
  if (effectiveEnd && effectiveEnd <= effectiveStart) {
    return NextResponse.json(
      { error: "endTime must be after startTime" },
      { status: 422 }
    )
  }

  const updated = await updateEvent(params.id, updates)
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error

  if (!uuidRegex.test(params.id)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
  }

  const event = await getEventById(params.id)
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!canModifyEvent(session!, event.creatorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await deleteEvent(params.id)
  return new NextResponse(null, { status: 204 })
}
