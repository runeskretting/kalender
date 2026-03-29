import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-helpers"
import { getEvents, createEvent } from "@/lib/api/events"
import { z } from "zod"

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
  allDay: z.boolean().default(false),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#3b82f6"),
})

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  void session // authenticated

  const { searchParams } = new URL(req.url)
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")

  const start = startParam ? new Date(startParam) : undefined
  const end = endParam ? new Date(endParam) : undefined

  if ((startParam && isNaN(start!.getTime())) || (endParam && isNaN(end!.getTime()))) {
    return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 })
  }

  const eventList = await getEvents(start, end)
  return NextResponse.json(eventList)
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = createEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { startTime, endTime, ...rest } = parsed.data
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : null

  if (end && end <= start) {
    return NextResponse.json(
      { error: "endTime must be after startTime" },
      { status: 422 }
    )
  }

  let event
  try {
    event = await createEvent({
      ...rest,
      startTime: start,
      endTime: end,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      creatorId: (session as any).user.id as string,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[POST /api/events] createEvent feilet:", msg)
    return NextResponse.json({ error: `Databasefeil: ${msg}` }, { status: 500 })
  }

  if (!event) {
    return NextResponse.json({ error: "Hendelse ble ikke opprettet" }, { status: 500 })
  }

  return NextResponse.json(event, { status: 201 })
}
