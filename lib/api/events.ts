import { db } from "@/lib/db"
import { events } from "@/lib/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"

export async function getEvents(start?: Date, end?: Date) {
  if (start && end) {
    return db.query.events.findMany({
      where: and(gte(events.startTime, start), lte(events.startTime, end)),
      orderBy: (e, { asc }) => [asc(e.startTime)],
    })
  }
  return db.query.events.findMany({
    orderBy: (e, { asc }) => [asc(e.startTime)],
  })
}

export async function getEventById(id: string) {
  return db.query.events.findFirst({ where: eq(events.id, id) })
}

export async function createEvent(data: {
  title: string
  description?: string | null
  startTime: Date
  endTime?: Date | null
  allDay: boolean
  color: string
  creatorId: string
}) {
  const [event] = await db.insert(events).values(data).returning()
  return event
}

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string
    description: string | null
    startTime: Date
    endTime: Date | null
    allDay: boolean
    color: string
  }>
) {
  const [event] = await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning()
  return event
}

export async function deleteEvent(id: string) {
  await db.delete(events).where(eq(events.id, id))
}
