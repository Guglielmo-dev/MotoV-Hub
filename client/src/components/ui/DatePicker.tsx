import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
          className={`flex items-center gap-2 w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-left hover:border-white/25 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 ${!selected ? "text-muted-foreground" : "text-foreground"} ${className}`}
        >
          <CalendarIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          {selected ? format(selected, "MMM dd, yyyy") : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-card border border-white/10 shadow-xl"
        align="start"
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
