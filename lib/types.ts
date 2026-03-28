export type Role = "parent" | "child"

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startTime: Date
  endTime: Date | null
  allDay: boolean
  color: string
  creatorId: string
  createdAt: Date
  updatedAt: Date
}

export interface CalendarUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: Role
}
