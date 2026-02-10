"use client";

import { Shift, User, Holiday } from "@/lib/types";
import {
  WorkMonth,
  getWorkMonthStartDate,
  getWorkMonthEndDate,
  formatDateStr,
} from "@/lib/workMonth";
import { Language } from "@/lib/i18n";
import { getWorkerColor } from "./Sidebar";
import styles from "./WeeklyCalendarGrid.module.css";

interface WeeklyCalendarGridProps {
  workMonth: WorkMonth;
  shifts: Shift[];
  users: User[];
  holidays: Holiday[];
  selectedDate: string | null;
  language: Language;
  onDayClick: (dateStr: string) => void;
  onShiftClick: (shift: Shift) => void;
  onDayDoubleClick: (dateStr: string) => void;
}

// Time range for the vertical time axis (matches reference style roughly)
const START_HOUR = 4; // 4 AM
const END_HOUR = 24; // midnight

function parseTimeToMinutes(time: string): number {
  // Expect "HH:MM" or "HH:MM:SS"
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m || 0);
}

export default function WeeklyCalendarGrid({
  workMonth,
  shifts,
  users,
  holidays,
  selectedDate,
  language,
  onDayClick,
  onShiftClick,
  onDayDoubleClick,
}: WeeklyCalendarGridProps) {
  const userIndexMap = new Map<string, number>();
  users.forEach((u, idx) => {
    userIndexMap.set(u.id, idx);
  });

  const holidayMap = new Map<string, Holiday>();
  holidays.forEach((h) => {
    holidayMap.set(h.date, h);
  });

  const workStart = getWorkMonthStartDate(workMonth);
  const workEnd = getWorkMonthEndDate(workMonth);

  // Show the week containing selected date, or the current week (today) when none selected
  const anchorDate =
    selectedDate != null
      ? new Date(selectedDate + "T00:00:00")
      : new Date();

  // Find Monday of the week that contains anchorDate (Mon = 0 ... Sun = 6)
  const anchorDay = anchorDate.getDay(); // 0=Sun
  const offsetToMonday = anchorDay === 0 ? -6 : 1 - anchorDay;
  const weekStart = new Date(anchorDate);
  weekStart.setDate(weekStart.getDate() + offsetToMonday);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }

  // Group shifts by date for quick lookup
  const shiftsByDate = new Map<string, Shift[]>();
  shifts.forEach((shift) => {
    const existing = shiftsByDate.get(shift.date) || [];
    existing.push(shift);
    shiftsByDate.set(shift.date, existing);
  });

  const todayStr = formatDateStr(new Date());
  const totalMinutes = (END_HOUR - START_HOUR) * 60;

  const hours: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(h);
  }

  const formatHourLabel = (hour: number) => {
    const displayHour = hour === 0 || hour === 24 ? 12 : hour > 12 ? hour - 12 : hour;
    const suffix = hour < 12 || hour === 24 ? "AM" : "PM";
    return `${displayHour} ${suffix}`;
  };

  return (
    <div className={styles.container}>
      {/* Header row with days */}
      <div className={styles.headerRow}>
        <div className={styles.timeColumnHeader} />
        {days.map((date, idx) => {
          const dateStr = formatDateStr(date);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const inWorkMonth = date >= workStart && date <= workEnd;
          const holiday = holidayMap.get(dateStr);
          const isPublicHoliday = holiday?.type === "Public holiday";

          return (
            <button
              key={dateStr}
              className={`${styles.dayHeader} ${
                isSelected ? styles.dayHeaderSelected : ""
              } ${!inWorkMonth ? styles.dayHeaderOutside : ""} ${
                isPublicHoliday ? styles.dayHeaderHoliday : ""
              }`}
              onClick={() => onDayClick(dateStr)}
              onDoubleClick={() => onDayDoubleClick(dateStr)}
            >
              <div className={styles.dayHeaderLabel}>
                <span className={styles.dayName}>
                  {language === "ko"
                    ? ["월", "화", "수", "목", "금", "토", "일"][idx]
                    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                </span>
                <span
                  className={`${styles.dayNumber} ${
                    isToday ? styles.dayNumberToday : ""
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
              <span className={styles.dayMonth}>
                {date.toLocaleDateString("en-US", { month: "short" })}
              </span>
              {holiday && (
                <span
                  className={`${styles.holidayLabel} ${
                    isPublicHoliday ? styles.holidayLabelPublic : ""
                  }`}
                  title={`${holiday.name} (${holiday.localName})`}
                >
                  {holiday.localName}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.body}>
        {/* Time labels */}
        <div className={styles.timeColumn}>
          {hours.map((h) => (
            <div key={h} className={styles.timeSlotLabel}>
              <span>{formatHourLabel(h % 24)}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className={styles.weekColumns}>
          {days.map((date) => {
            const dateStr = formatDateStr(date);
            const dayShifts = shiftsByDate.get(dateStr) || [];
            const inWorkMonth = date >= workStart && date <= workEnd;

            return (
              <div
                key={dateStr}
                className={`${styles.dayColumn} ${
                  !inWorkMonth ? styles.dayColumnOutside : ""
                }`}
                onClick={() => onDayClick(dateStr)}
                onDoubleClick={() => onDayDoubleClick(dateStr)}
              >
                <div className={styles.dayColumnGrid}>
                  {hours.map((h) => (
                    <div key={h} className={styles.timeSlotCell} />
                  ))}
                  {dayShifts.map((shift) => {
                    const startMinutes =
                      parseTimeToMinutes(shift.start_time) - START_HOUR * 60;
                    const endMinutes =
                      parseTimeToMinutes(shift.end_time) - START_HOUR * 60;
                    const top = Math.max(0, (startMinutes / totalMinutes) * 100);
                    const bottom =
                      100 - Math.max(0, Math.min(100, (endMinutes / totalMinutes) * 100));
                    const height = Math.max(6, 100 - top - bottom);

                    const userIdx = userIndexMap.get(shift.user_id) ?? 0;
                    const color = getWorkerColor(userIdx);

                    return (
                      <button
                        key={shift.id}
                        className={styles.shiftBlock}
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          borderLeftColor: color,
                          backgroundColor: `${color}1A`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onShiftClick(shift);
                        }}
                        title={`${shift.name || "Unknown"} · ${shift.start_time.slice(
                          0,
                          5
                        )}–${shift.end_time.slice(0, 5)}`}
                      >
                        <span className={styles.shiftBlockTitle}>
                          {shift.name || "Unknown"}
                        </span>
                        <span className={styles.shiftBlockTime}>
                          {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

