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

// Known subjects in Norwegian school plans
const KNOWN_SUBJECTS = [
  "Norsk",
  "Matematikk",
  "Matte",
  "Engelsk",
  "Naturfag",
  "Samfunnsfag",
  "KRLE",
  "Kunst og håndverk",
  "Musikk",
  "Mat og helse",
  "Kroppsøving",
  "Gym",
]

// Section headers that signal we've left the Lekser section
const SECTION_HEADERS = [
  "læringsmål",
  "ukens tips",
  "ukestips",
  "informasjon",
  "beskjeder",
  "kontaktinfo",
]

function getMondayOfWeek(week: number, year: number): Date {
  const jan4 = new Date(year, 0, 4) // Jan 4 is always in week 1
  const weekStart = startOfISOWeek(setISOWeek(setYear(jan4, year), week))
  return weekStart
}

function findWeekNumber(text: string): { week: number; year: number } | null {
  const match = text.match(/uke\s+(\d+)/i)
  if (!match) return null
  const week = parseInt(match[1], 10)
  if (week < 1 || week > 53) return null
  const year = new Date().getFullYear()
  return { week, year }
}

function findLekserSection(lines: string[]): string[] {
  let inLekser = false
  const sectionLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const lower = trimmed.toLowerCase()

    // Check if this is the Lekser header
    if (!inLekser && lower === "lekser") {
      inLekser = true
      continue
    }

    if (inLekser) {
      // Check if we've hit a new section header
      if (SECTION_HEADERS.some((h) => lower === h || lower.startsWith(h + ":"))) {
        break
      }
      sectionLines.push(trimmed)
    }
  }

  return sectionLines
}

function parseSubjectBlocks(lines: string[]): Array<{ subject: string; text: string }> {
  const blocks: Array<{ subject: string; text: string }> = []
  let currentSubject: string | null = null
  let currentLines: string[] = []

  for (const line of lines) {
    const matchedSubject = KNOWN_SUBJECTS.find(
      (s) => line.toLowerCase() === s.toLowerCase() || line.toLowerCase().startsWith(s.toLowerCase() + ":")
    )

    if (matchedSubject) {
      if (currentSubject && currentLines.length > 0) {
        blocks.push({ subject: currentSubject, text: currentLines.join(" ").trim() })
      }
      currentSubject = matchedSubject
      // If the subject line also has content after ":", grab it
      const colonIdx = line.indexOf(":")
      currentLines = colonIdx >= 0 && colonIdx < line.length - 1 ? [line.slice(colonIdx + 1).trim()] : []
    } else if (currentSubject) {
      currentLines.push(line)
    }
  }

  if (currentSubject && currentLines.length > 0) {
    blocks.push({ subject: currentSubject, text: currentLines.join(" ").trim() })
  }

  return blocks
}

export function parseUkeplanText(text: string): ParsedUkeplan | null {
  const weekInfo = findWeekNumber(text)
  if (!weekInfo) return null

  const lines = text.split(/\r?\n/)
  const lekserLines = findLekserSection(lines)

  if (lekserLines.length === 0) return null

  const blocks = parseSubjectBlocks(lekserLines)
  if (blocks.length === 0) return null

  const monday = getMondayOfWeek(weekInfo.week, weekInfo.year)
  const friday = addDays(monday, 4)

  const startDate = monday.toISOString().split("T")[0]
  const endDate = friday.toISOString().split("T")[0]

  const items: LekseItem[] = blocks.map((b) => ({
    subject: b.subject,
    description: b.text,
    startDate,
    endDate,
  }))

  return { week: weekInfo.week, year: weekInfo.year, items }
}
