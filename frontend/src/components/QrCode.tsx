import qrcode from "qrcode-generator"
import { useMemo } from "react"

type QrCodeProps = {
  value: string
  label: string
  className?: string
}

/** Renders a QR code as crisp SVG so it stays sharp on screen and in print. */
export default function QrCode({ value, label, className }: QrCodeProps) {
  const { size, path } = useMemo(() => {
    const code = qrcode(0, "M")
    code.addData(value)
    code.make()
    const count = code.getModuleCount()
    let d = ""
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (code.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`
      }
    }
    return { size: count, path: d }
  }, [value])

  return (
    <svg
      className={className}
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      <path d={path} fill="#16191b" />
    </svg>
  )
}
