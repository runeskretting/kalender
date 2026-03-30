import { NextRequest, NextResponse } from "next/server"
import { requireParent } from "@/lib/api/auth-helpers"
import { parseUkeplanText } from "@/lib/import/parseUkeplan"
import pdfParse from "pdf-parse"

export async function POST(req: NextRequest) {
  const { error } = await requireParent()
  if (error) return error

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Ingen fil lastet opp" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let text: string
  try {
    const data = await pdfParse(buffer)
    text = data.text
  } catch {
    return NextResponse.json({ error: "Kunne ikke lese PDF-filen" }, { status: 422 })
  }

  const result = await parseUkeplanText(text)

  if (!result) {
    return NextResponse.json(
      { error: "Fant ingen lekser i PDF-en. Sjekk at filen er en ukeplan med «Lekser»-seksjon og ukenummer." },
      { status: 422 }
    )
  }

  return NextResponse.json(result)
}
