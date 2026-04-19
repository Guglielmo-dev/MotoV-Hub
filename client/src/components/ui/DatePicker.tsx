import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-2.5 w-full bg-black/20 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-left transition-all",
            "hover:bg-black/40 hover:border-primary/20",
            "focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30",
            "disabled:opacity-50 disabled:cursor-not-allowed group",
            !selected ? "text-muted-foreground" : "text-foreground font-bold tracking-tight",
            className
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="flex-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {selected ? format(selected, "MMM dd, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-transparent border-none shadow-none"
        align="start"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          initialFocus
          className="bg-card text-foreground rounded-xl"
        />
      </PopoverContent>
    </Popover>
  );
}
