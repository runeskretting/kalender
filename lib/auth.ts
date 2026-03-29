import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { Role } from "@/lib/types"

function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

function getParentEmails(): string[] {
  return (process.env.PARENT_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false
      if (!profile?.email_verified) return false
      const email = profile.email?.toLowerCase() ?? ""
      if (!getAllowedEmails().includes(email)) return false

      const role: Role = getParentEmails().includes(email) ? "parent" : "child"
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      })
      if (existingUser && existingUser.role !== role) {
        await db.update(users).set({ role }).where(eq(users.email, email))
      }
      return true
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = (user as { role?: Role }).role
        token.id = user.id
      }
      if ((!token.role || !token.id) && token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email as string),
        })
        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser.id
        }
      }
      return token
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.role = token.role as Role
        session.user.id = token.id as string
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
})
