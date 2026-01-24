"use client";

import { Shift } from "@/lib/types";

interface CalendarMonthProps {
  currentDate: Date;
  shifts: Shift[];
  selectedDate: string | null;
  onDayClick: (dateStr: string) => void;
}

export default function CalendarMonth({
  currentDate,
  shifts,
  selectedDate,
  onDayClick,
}: CalendarMonthProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // Build calendar grid
  const days: (number | null)[] = [];

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  // Count shifts per day
  const shiftCountByDate: { [key: string]: number } = {};
  shifts.forEach((s) => {
    shiftCountByDate[s.date] = (shiftCountByDate[s.date] || 0) + 1;
  });

  const formatDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const today = new Date();
  const todayStr =
    today.getFullYear() === year && today.getMonth() === month
      ? formatDateStr(today.getDate())
      : null;

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {weekDays.map((d) => (
          <div key={d} style={styles.headerCell}>
            {d}
          </div>
        ))}
      </div>
      <div style={styles.grid}>
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} style={styles.emptyCell} />;
          }

          const dateStr = formatDateStr(day);
          const count = shiftCountByDate[dateStr] || 0;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              style={{
                ...styles.dayCell,
                ...(isSelected ? styles.selectedCell : {}),
                ...(isToday && !isSelected ? styles.todayCell : {}),
              }}
            >
              <span style={styles.dayNumber}>{day}</span>
              {count > 0 && (
                <span style={styles.shiftBadge}>
                  {count} shift{count > 1 ? "s" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "100%",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    borderBottom: "1px solid #eee",
    marginBottom: "0.5rem",
  },
  headerCell: {
    padding: "0.5rem",
    textAlign: "center",
    fontWeight: 500,
    fontSize: "0.75rem",
    color: "#666",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
  },
  emptyCell: {
    aspectRatio: "1",
    padding: "0.5rem",
  },
  dayCell: {
    aspectRatio: "1",
    padding: "0.5rem",
    border: "1px solid #eee",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.25rem",
    transition: "background 0.15s",
  },
  selectedCell: {
    background: "#333",
    color: "white",
    borderColor: "#333",
  },
  todayCell: {
    borderColor: "#333",
    borderWidth: "2px",
  },
  dayNumber: {
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  shiftBadge: {
    fontSize: "0.625rem",
    background: "#e0e0e0",
    padding: "0.125rem 0.25rem",
    borderRadius: "2px",
  },
};

