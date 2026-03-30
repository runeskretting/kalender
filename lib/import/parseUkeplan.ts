import Anthropic from "@anthropic-ai/sdk"
import { startOfISOWeek, addDays, setISOWeek, setYear } from "date-fns"

export interface LekseItem {
  subject: string
  description: string
  startDate: string // ISO date string, Monday
  endDate: string   // ISO date string, Friday
}

export interface ParsedUkeplan {
  week: number
  year: number
  items: LekseItem[]
}

function getMondayOfWeek(week: number, year: number): Date {
  const jan4 = new Date(year, 0, 4)
  return startOfISOWeek(setISOWeek(setYear(jan4, year), week))
}

const client = new Anthropic()

export async function parseUkeplanText(text: string): Promise<ParsedUkeplan | null> {
  const currentYear = new Date().getFullYear()

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Du er en assistent som trekker ut lekseinformasjon fra norske skolers ukeplaner.

Trekk ut følgende fra teksten nedenfor:
1. Ukenummer (se etter "Uke X" eller lignende)
2. Alle lekser fra "Lekser"-seksjonen

Returner KUN gyldig JSON — ingen forklaringer, ingen markdown-blokker:
{
  "week": <ukenummer som heltall, eller null hvis ikke funnet>,
  "year": ${currentYear},
  "items": [
    { "subject": "<fagnavn eller kort tittel>", "description": "<full beskrivelse>" }
  ]
}

Regler:
- Hvis "Lekser"-seksjonen mangler fagnavnlinjer, bruk "Lekser" som subject og hele teksten som description
- Hvis det ikke er noen "Lekser"-seksjon, returner items som []
- Hvis ukenummer mangler, returner week som null

PDF-tekst:
${text}`,
      },
    ],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : ""

  let parsed: { week: number | null; year: number; items: Array<{ subject: string; description: string }> }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!parsed.week || parsed.items.length === 0) return null

  const monday = getMondayOfWeek(parsed.week, parsed.year ?? currentYear)
  const friday = addDays(monday, 4)
  const startDate = monday.toISOString().split("T")[0]
  const endDate = friday.toISOString().split("T")[0]

  return {
    week: parsed.week,
    year: parsed.year ?? currentYear,
    items: parsed.items.map((item) => ({
      subject: item.subject,
      description: item.description,
      startDate,
      endDate,
    })),
  }
}
