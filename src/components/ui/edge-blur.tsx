interface EdgeBlurProps {
  position?: "top" | "bottom"
  height?: number
  className?: string
}

export function EdgeBlur({ position = "bottom", height = 75, className = "fixed" }: EdgeBlurProps) {
  const blurLayers = [1, 2, 3, 6, 12]

  const isTop = position === "top"

  return (
    <div
      className={`${className} inset-x-0 isolate z-40 pointer-events-none ${isTop ? "top-0" : "bottom-0"}`}
      style={{ height }}
    >
      {blurLayers.map((blur) => (
        <div
          key={blur}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: `linear-gradient(to ${isTop ? "bottom" : "top"}, black, transparent)`,
            WebkitMaskImage: `linear-gradient(to ${isTop ? "bottom" : "top"}, black, transparent)`,
          }}
        />
      ))}
    </div>
  )
}

// Convenience exports for specific positions
export function TopBlur({ height = 75, className }: { height?: number; className?: string }) {
  return <EdgeBlur position="top" height={height} className={className} />
}

export function BottomBlur({ height = 75, className }: { height?: number; className?: string }) {
  return <EdgeBlur position="bottom" height={height} className={className} />
}
