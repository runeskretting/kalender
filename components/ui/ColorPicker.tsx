const COLORS = [
  { value: "#ef4444", label: "Rød" },
  { value: "#f97316", label: "Oransje" },
  { value: "#eab308", label: "Gul" },
  { value: "#22c55e", label: "Grønn" },
  { value: "#3b82f6", label: "Blå" },
  { value: "#8b5cf6", label: "Lilla" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#6b7280", label: "Grå" },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`w-8 h-8 rounded-full transition-transform ${
            value === c.value
              ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
              : "hover:scale-110"
          }`}
          style={{ backgroundColor: c.value }}
          aria-label={c.label}
          aria-pressed={value === c.value}
        />
      ))}
    </div>
  )
}

export { COLORS }
