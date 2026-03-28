import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Header from "@/components/layout/Header"
import CalendarClient from "@/components/calendar/CalendarClient"
import type { CalendarUser } from "@/lib/types"

export const metadata = {
  title: "Familiekalender",
}

export default async function CalendarPage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = session?.user as any
  if (!sessionUser?.id) redirect("/login")

  const user: CalendarUser = {
    id: sessionUser.id as string,
    name: sessionUser.name ?? null,
    email: sessionUser.email as string,
    image: sessionUser.image ?? null,
    role: sessionUser.role,
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header user={user} />
      <main className="flex-1 overflow-hidden">
        <CalendarClient userRole={user.role} userId={user.id} />
      </main>
    </div>
  )
}
