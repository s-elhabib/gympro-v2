import * as React from "react";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";

interface CalendarDemoProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function CalendarDemo({ date, setDate }: CalendarDemoProps) {
  const today = new Date();
  const isToday =
    date &&
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  return (
    <div className="bg-white rounded-lg border shadow overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-900">
            {date
              ? format(date, "MMMM yyyy", { locale: fr })
              : format(new Date(), "MMMM yyyy", { locale: fr })}
          </h3>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (date) {
                const prevMonth = new Date(date);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setDate(prevMonth);
              }
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (date) {
                const nextMonth = new Date(date);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setDate(nextMonth);
              }
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Body */}
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="border-0 p-0"
        classNames={{
          day_selected:
            "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white",
          day_today: "bg-blue-50 text-blue-600 font-medium",
          head_cell: "text-gray-500 font-medium text-xs uppercase",
        }}
      />

      {/* Calendar Footer */}
      <div className="p-3 border-t bg-gray-50">
        <Button
          variant="outline"
          className={`w-full ${
            isToday ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white"
          }`}
          onClick={() => setDate(new Date())}
          disabled={isToday}
        >
          Aujourd'hui
        </Button>
      </div>
    </div>
  );
}
