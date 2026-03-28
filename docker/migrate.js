const { drizzle } = require("drizzle-orm/node-postgres")
const { migrate } = require("drizzle-orm/node-postgres/migrator")
const { Pool } = require("pg")

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })
  const db = drizzle(pool)
  await migrate(db, { migrationsFolder: "./migrations" })
  await pool.end()
}

main().catch((err) => {
  console.error("[kalender] Migration failed:", err)
  process.exit(1)
})
