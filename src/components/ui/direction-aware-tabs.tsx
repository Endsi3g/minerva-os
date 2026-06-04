import { ReactNode, useMemo, useState, useEffect, useRef } from "react"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import useMeasure from "react-use-measure"

import { cn } from "@/lib/utils"

type Tab = {
  id: number
  label: ReactNode
  content: ReactNode
}

interface OgImageSectionProps {
  tabs: Tab[]
  className?: string
  /** Outer container radius (e.g. `rounded-lg`) */
  rounded?: string
  /** Inner tab/bubble radius — should be outer radius minus container padding (~3px) */
  roundedInner?: string
  onChange?: () => void
  /** Controlled active tab id — makes the component controlled */
  activeTab?: number
  /** Called when the user clicks a tab (used in controlled mode) */
  onTabChange?: (id: number) => void
}

function DirectionAwareTabs({
  tabs,
  className,
  rounded,
  roundedInner,
  onChange,
  activeTab: controlledTab,
  onTabChange,
}: OgImageSectionProps) {
  const isControlled = controlledTab !== undefined
  const [internalTab, setInternalTab] = useState(0)
  const activeTab = isControlled ? controlledTab : internalTab
  const prevTabRef = useRef(activeTab)
  const [direction, setDirection] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [ref, bounds] = useMeasure()

  useEffect(() => {
    if (isControlled && controlledTab !== prevTabRef.current) {
      setDirection(controlledTab > prevTabRef.current ? 1 : -1)
      prevTabRef.current = controlledTab
    }
  }, [controlledTab, isControlled])

  const content = useMemo(() => {
    const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content
    return activeTabContent || null
  }, [activeTab, tabs])

  const handleTabClick = (newTabId: number) => {
    if (newTabId !== activeTab && !isAnimating) {
      const newDirection = newTabId > activeTab ? 1 : -1
      setDirection(newDirection)
      prevTabRef.current = newTabId
      if (isControlled) {
        onTabChange?.(newTabId)
      } else {
        setInternalTab(newTabId)
      }
      onChange?.()
    }
  }

  const variants = {
    initial: (direction: number) => ({
      x: 300 * direction,
      opacity: 0,
      filter: "blur(4px)",
    }),
    active: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      x: -300 * direction,
      opacity: 0,
      filter: "blur(4px)",
    }),
  }

  return (
    <div className="flex flex-col w-full">
      <div
        className={cn(
          "flex space-x-1 border rounded-full cursor-pointer px-[3px] py-[3.2px] self-start",
          className,
          rounded
        )}
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "relative rounded-full px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none flex gap-2 items-center",
              activeTab === tab.id ? "text-ivory" : "text-fog hover:text-silver",
              rounded ? roundedInner : undefined
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {activeTab === tab.id && (
              <motion.span
                layoutId="minerva-tab-bubble"
                className={cn(
                  "absolute inset-0 z-10 border border-white/10",
                  rounded ? roundedInner : "rounded-full"
                )}
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                transition={{ type: "spring", bounce: 0.19, duration: 0.4 }}
              />
            )}
            <span className="relative z-20">{tab.label}</span>
          </button>
        ))}
      </div>
      <MotionConfig transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}>
        <motion.div
          className="relative w-full overflow-hidden"
          initial={false}
          animate={{ height: bounds.height }}
        >
          <div className="pt-1" ref={ref}>
            <AnimatePresence
              custom={direction}
              mode="popLayout"
              onExitComplete={() => setIsAnimating(false)}
            >
              <motion.div
                key={activeTab}
                variants={variants}
                initial="initial"
                animate="active"
                exit="exit"
                custom={direction}
                onAnimationStart={() => setIsAnimating(true)}
                onAnimationComplete={() => setIsAnimating(false)}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </MotionConfig>
    </div>
  )
}
export { DirectionAwareTabs }
