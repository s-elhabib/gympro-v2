"use client";

import * as React from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { DayPicker, StyledComponent } from "react-day-picker";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";

// Custom CSS for the DayPicker
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  inputClassName?: string;
  showNavigation?: boolean;
}

export function DatePicker({
  date,
  setDate,
  className,
  inputClassName,
  placeholder = "Sélectionner une date",
  showNavigation = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handlePreviousDay = () => {
    if (date) {
      setDate(subDays(date, 1));
    }
  };

  const handleNextDay = () => {
    if (date) {
      setDate(addDays(date, 1));
    }
  };

  const isTodaySelected = date ? isToday(date) : false;

  // Custom navigation components
  const CustomNavigation: StyledComponent = ({
    displayMonth,
    goToMonth,
    nextMonth,
    previousMonth,
  }) => {
    return (
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex-1">
          <h2 className="text-base font-semibold">
            {format(displayMonth, "MMMM yyyy", { locale: fr })}
          </h2>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => previousMonth && goToMonth(previousMonth)}
            disabled={!previousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => nextMonth && goToMonth(nextMonth)}
            disabled={!nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className={cn("relative flex-1", className)}>
              <Input
                readOnly
                value={
                  date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : ""
                }
                placeholder={placeholder}
                className={cn(
                  "pr-10 cursor-pointer bg-white",
                  !date && "text-muted-foreground",
                  inputClassName
                )}
                onClick={() => setOpen(true)}
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={(day) => {
                  setDate(day);
                  setOpen(false);
                }}
                locale={fr}
                showOutsideDays
                components={{
                  Caption: CustomNavigation,
                }}
                styles={{
                  caption: { display: "none" }, // Hide default caption since we're using custom navigation
                  day: {
                    margin: "2px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    transition: "background-color 0.2s, color 0.2s",
                  },
                  head_cell: {
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    padding: "8px 0",
                  },
                  table: {
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0",
                  },
                  cell: {
                    padding: "0",
                    textAlign: "center",
                  },
                  nav_button: {
                    display: "none", // Hide default nav buttons
                  },
                }}
                modifiersStyles={{
                  today: {
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    fontWeight: 500,
                  },
                  selected: {
                    backgroundColor: "#2563EB",
                    color: "white",
                    fontWeight: 500,
                  },
                }}
                className="p-0"
              />
              <div className="p-3 border-t mt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setDate(new Date());
                    setOpen(false);
                  }}
                >
                  Aujourd'hui
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {showNavigation && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handlePreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleNextDay}
              disabled={isTodaySelected}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
