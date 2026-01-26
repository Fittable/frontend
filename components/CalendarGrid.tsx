"use client";

import { Shift, User } from "@/lib/types";
import { getWorkerColor } from "./Sidebar";
import ShiftBar, { MoreShifts } from "./ShiftBar";
import styles from "./CalendarGrid.module.css";

interface CalendarGridProps {
  currentDate: Date;
  shifts: Shift[];
  users: User[];
  selectedDate: string | null;
  isAdmin: boolean;
  onDayClick: (dateStr: string) => void;
  onShiftClick: (shift: Shift) => void;
  onDayDoubleClick: (dateStr: string) => void;
}

const MAX_VISIBLE_SHIFTS = 3;

export default function CalendarGrid({
  currentDate,
  shifts,
  users,
  selectedDate,
  isAdmin,
  onDayClick,
  onShiftClick,
  onDayDoubleClick,
}: CalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build a user index map for colors
  const userIndexMap = new Map<string, number>();
  users.forEach((u, idx) => {
    userIndexMap.set(u.id, idx);
  });

  // Calculate calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Start from Monday
  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  // Previous month days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Build days array with metadata
  type DayInfo = {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateStr: string;
  };

  const days: DayInfo[] = [];

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const dateStr = formatDateStr(prevYear, prevMonth, d);
    days.push({
      day: d,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      dateStr,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(year, month, d);
    days.push({
      day: d,
      month,
      year,
      isCurrentMonth: true,
      dateStr,
    });
  }

  // Next month days to fill 6 rows
  const totalCells = 42;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const remainingCells = totalCells - days.length;
  
  for (let d = 1; d <= remainingCells; d++) {
    const dateStr = formatDateStr(nextYear, nextMonth, d);
    days.push({
      day: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      dateStr,
    });
  }

  // Group shifts by date
  const shiftsByDate = new Map<string, Shift[]>();
  shifts.forEach((shift) => {
    const existing = shiftsByDate.get(shift.date) || [];
    existing.push(shift);
    shiftsByDate.set(shift.date, existing);
  });

  // Today's date string
  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Weekday headers (Monday start)
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className={styles.container}>
      {/* Weekday headers */}
      <div className={styles.header}>
        {weekDays.map((day, i) => (
          <div 
            key={day} 
            className={`${styles.headerCell} ${i >= 5 ? styles.weekend : ""}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.grid}>
        {days.map((dayInfo, idx) => {
          const dayShifts = shiftsByDate.get(dayInfo.dateStr) || [];
          const isSelected = dayInfo.dateStr === selectedDate;
          const isToday = dayInfo.dateStr === todayStr;
          const isWeekend = idx % 7 >= 5;

          const visibleShifts = dayShifts.slice(0, MAX_VISIBLE_SHIFTS);
          const hiddenCount = dayShifts.length - MAX_VISIBLE_SHIFTS;

          return (
            <div
              key={dayInfo.dateStr}
              className={`${styles.dayCell} ${
                !dayInfo.isCurrentMonth ? styles.otherMonth : ""
              } ${isSelected ? styles.selected : ""} ${isWeekend ? styles.weekend : ""}`}
              onClick={() => onDayClick(dayInfo.dateStr)}
              onDoubleClick={() => onDayDoubleClick(dayInfo.dateStr)}
            >
              <div className={styles.dayHeader}>
                <span
                  className={`${styles.dayNumber} ${isToday ? styles.today : ""}`}
                >
                  {dayInfo.day}
                </span>
              </div>

              <div className={styles.shiftsContainer}>
                {visibleShifts.map((shift) => {
                  const userIdx = userIndexMap.get(shift.user_id) ?? 0;
                  const color = getWorkerColor(userIdx);

                  return (
                    <ShiftBar
                      key={shift.id}
                      shift={shift}
                      color={color}
                      showWorkerName={isAdmin}
                      onClick={() => {
                        // Prevent event bubbling
                        onShiftClick(shift);
                      }}
                    />
                  );
                })}

                {hiddenCount > 0 && (
                  <MoreShifts
                    count={hiddenCount}
                    onClick={() => onDayClick(dayInfo.dateStr)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

