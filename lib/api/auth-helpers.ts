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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function canModifyEvent(session: any, creatorId: string): boolean {
  if (session?.user?.role === "parent") return true
  return session?.user?.id === creatorId
}
