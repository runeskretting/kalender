import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any
  if (!user?.id) {
    return {
      session: null as never,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { session: session!, error: null as never }
}

export async function requireParent() {
  const { session, error } = await requireAuth()
  if (error) return { session: null as never, error }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session as any)?.user?.role !== "parent") {
    return {
      session: null as never,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }
  return { session, error: null as never }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function canModifyEvent(session: any, creatorId: string): boolean {
  if (session?.user?.role === "parent") return true
  return session?.user?.id === creatorId
}
