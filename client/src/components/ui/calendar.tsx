import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="glass-panel rounded-2xl border border-white/5 shadow-2xl overflow-hidden"
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col",
          month: "space-y-4",
          month_caption: "flex justify-between items-center h-10 px-1 border-b border-white/5 mb-2",
          caption_label: "text-[10px] font-black font-display uppercase tracking-[0.2em] text-primary",
          nav: "flex items-center gap-0.5",
          button_previous: cn(
            "h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          ),
          button_next: cn(
            "h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          ),
          month_grid: "w-full border-collapse",
          weekdays: "flex justify-around mb-1",
          weekday: "text-[9px] uppercase font-mono font-bold tracking-widest text-muted-foreground/30 w-8 h-8 flex items-center justify-center",
          week: "flex w-full mt-0.5 justify-around",
          day: "h-8 w-8 text-center text-xs p-0 m-0 relative",
          day_button: cn(
            "h-8 w-8 p-0 font-mono text-[10px] font-bold transition-all rounded-lg relative z-10",
            "hover:bg-white/5 hover:scale-105",
            "aria-selected:bg-primary aria-selected:text-black aria-selected:shadow-[0_0_15px_rgba(var(--primary),0.3)] aria-selected:scale-100"
          ),
          selected: "bg-primary text-black",
          today: "text-primary relative after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full after:shadow-[0_0_4px_rgba(var(--primary),0.5)]",
          outside: "day-outside text-muted-foreground/10 pointer-events-none",
          disabled: "text-muted-foreground opacity-10 cursor-not-allowed",
          range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          hidden: "invisible",
          ...classNames,
        }}
        components={{
          Chevron: ({ className, orientation, ...props }: any) => {
            if (orientation === "left") {
              return <ChevronLeft className={cn("h-3 w-3", className)} {...props} />
            }
            return <ChevronRight className={cn("h-3 w-3", className)} {...props} />
          }
        }}
        {...props}
      />
    </motion.div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
