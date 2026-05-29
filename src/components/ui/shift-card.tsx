"use client"

import * as React from "react"
import { AnimatePresence, motion, MotionProps, useMotionValue, useTransform, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

interface ShiftCardProps
  extends Omit<MotionProps, "onAnimationStart" | "onAnimationComplete"> {
  className?: string
  topContent?: React.ReactNode
  middleContent?: React.ReactNode
  topAnimateContent?: React.ReactNode
  bottomContent?: React.ReactNode
}

const ShiftCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
ShiftCardHeader.displayName = "ShiftCardHeader"

interface ShiftCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isHovered: boolean
}
const ShiftCardContent = React.forwardRef<
  HTMLDivElement,
  ShiftCardContentProps
>(({ isHovered, children, ...divProps }, ref) => {
  const motionProps: MotionProps = {
    initial: { opacity: 0, height: 0 },
    animate: isHovered
      ? { opacity: 1, height: 120 }
      : { opacity: 1, height: 38 },
    transition: { duration: 0.3, delay: 0.1, ease: "circIn" },
  }

  return (
    <motion.div
      key="shift-card-content"
      ref={ref}
      {...motionProps}
      className={divProps.className}
    >
      {children}
    </motion.div>
  )
})
ShiftCardContent.displayName = "ShiftCardContent"

const ShiftCard = React.forwardRef<HTMLDivElement, ShiftCardProps>(
  (
    {
      className,
      topContent,
      topAnimateContent,
      middleContent,
      bottomContent,
      ...props
    },
    ref
  ) => {
    const [isHovered, setHovered] = React.useState(false)

    // Motion values for 3D cursor tilt parallax effect
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 })
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 })

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const el = event.currentTarget
      const rect = el.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const mouseX = event.clientX - rect.left - width / 2
      const mouseY = event.clientY - rect.top - height / 2
      x.set(mouseX / width)
      y.set(mouseY / height)
    }

    const handleMouseEnter = () => setHovered(true)
    const handleMouseLeave = () => {
      setHovered(false)
      x.set(0)
      y.set(0)
    }
    const handleTapStart = () => setHovered(true)
    const handleTapCancel = () => setHovered(false)
    const handleTap = () => setHovered(false)

    return (
      <motion.div
        ref={ref}
        className={cn(
          "group relative flex flex-col justify-between overflow-hidden rounded-xl p-4 text-sm bg-card transition-all w-full h-full",
          "hover:cursor-pointer",
          "shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05),0px_1px_1px_0px_rgba(255,252,240,0.5)_inset,0px_0px_0px_1px_hsla(0,0%,100%,0.1)_inset,0px_0px_1px_0px_rgba(28,27,26,0.5)]",
          "dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.1),0_8px_8px_0_rgba(0,0,0,0.1)]",
          className
        )}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          perspective: 1000,
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleTapStart}
        onTapCancel={handleTapCancel}
        onTap={handleTap}
        {...props}
      >
        <ShiftCardHeader className="flex w-full flex-col relative text-primary-foreground ">
          <div className=" w-full">
            {topContent}

            {topAnimateContent && (
              <AnimatePresence>
                {isHovered ? <>{topAnimateContent}</> : null}
              </AnimatePresence>
            )}
          </div>
        </ShiftCardHeader>

        {middleContent && (
          <div className="w-full flex-grow flex items-center mt-2">
            <AnimatePresence>
              {!isHovered || !bottomContent ? <>{middleContent}</> : null}
            </AnimatePresence>
          </div>
        )}

        {bottomContent && (
          <ShiftCardContent
            isHovered={isHovered}
            className="absolute -bottom-1.5 left-0 right-0 flex flex-col gap-4 rounded-xl"
          >
            <motion.div className="flex w-full flex-col gap-1">
              {bottomContent}
            </motion.div>
          </ShiftCardContent>
        )}
      </motion.div>
    )
  }
)

ShiftCard.displayName = "ShiftCard"

export { ShiftCard, ShiftCardHeader, ShiftCardContent }
