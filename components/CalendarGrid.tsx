"use client";

import { Shift, User } from "@/lib/types";
import { getWorkerColor } from "./Sidebar";
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

// Group shifts by user for a given day
type UserShifts = {
  userId: string;
  username: string;
  shifts: Shift[];
};

function groupShiftsByUser(shifts: Shift[]): UserShifts[] {
  const grouped = new Map<string, UserShifts>();
  
  shifts.forEach((shift) => {
    const existing = grouped.get(shift.user_id);
    if (existing) {
      existing.shifts.push(shift);
    } else {
      grouped.set(shift.user_id, {
        userId: shift.user_id,
        username: shift.username || "Unknown",
        shifts: [shift],
      });
    }
  });

  // Sort shifts within each user by start time
  grouped.forEach((userShifts) => {
    userShifts.shifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  return Array.from(grouped.values());
}

const MAX_VISIBLE_USERS = 3;

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

  const formatTime = (time: string) => time.slice(0, 5);

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
          const groupedShifts = groupShiftsByUser(dayShifts);
          const isSelected = dayInfo.dateStr === selectedDate;
          const isToday = dayInfo.dateStr === todayStr;
          const isWeekend = idx % 7 >= 5;

          const visibleUsers = groupedShifts.slice(0, MAX_VISIBLE_USERS);
          const hiddenCount = groupedShifts.length - MAX_VISIBLE_USERS;

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
                {visibleUsers.map((userShifts) => {
                  const userIdx = userIndexMap.get(userShifts.userId) ?? 0;
                  const color = getWorkerColor(userIdx);
                  
                  // Combine times for display
                  const timesDisplay = userShifts.shifts
                    .map(s => `${formatTime(s.start_time)}–${formatTime(s.end_time)}`)
                    .join(", ");

                  const displayText = isAdmin 
                    ? `${userShifts.username} · ${timesDisplay}` 
                    : timesDisplay;

                  return (
                    <button
                      key={userShifts.userId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onShiftClick(userShifts.shifts[0]);
                      }}
                      className={styles.shiftBar}
                      style={{ 
                        backgroundColor: `${color}20`,
                        borderLeftColor: color,
                      }}
                      title={`${userShifts.username}: ${timesDisplay}`}
                    >
                      <span className={styles.shiftText} style={{ color }}>
                        {displayText}
                      </span>
                    </button>
                  );
                })}

                {hiddenCount > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(dayInfo.dateStr);
                    }} 
                    className={styles.moreShifts}
                  >
                    +{hiddenCount} more
                  </button>
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
