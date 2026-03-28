import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  index,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core"

// --- Enums ---
export const roleEnum = pgEnum("role", ["parent", "child"])

// --- Users table (extended with role for Auth.js DrizzleAdapter) ---
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").notNull().default("child"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

// Required by Auth.js DrizzleAdapter
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    compoundKey: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  })
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({
    compoundKey: primaryKey({ columns: [t.identifier, t.token] }),
  })
)

// --- Events table ---
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    startTime: timestamp("start_time", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endTime: timestamp("end_time", { mode: "date", withTimezone: true }),
    allDay: boolean("all_day").notNull().default(false),
    color: text("color").notNull().default("#3b82f6"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    creatorIdx: index("events_creator_idx").on(t.creatorId),
    startIdx: index("events_start_idx").on(t.startTime),
  })
)
