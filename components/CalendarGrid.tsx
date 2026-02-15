"use client";

import { Shift, User, Holiday, CourseEvent } from "@/lib/types";
import {
  WorkMonth,
  getWorkMonthStartDate,
  getWorkMonthEndDate,
  formatDateStr,
} from "@/lib/workMonth";
import { Language } from "@/lib/i18n";
import { getWorkerColor } from "./Sidebar";
import styles from "./CalendarGrid.module.css";

interface CalendarGridProps {
  workMonth: WorkMonth;
  shifts: Shift[];
  courseEvents: CourseEvent[];
  users: User[];
  holidays: Holiday[];
  selectedDate: string | null;
  language: Language;
  onDayClick: (dateStr: string) => void;
  onShiftClick: (shift: Shift) => void;
  onDayDoubleClick: (dateStr: string) => void;
}

// Group shifts by user for a given day
type UserShifts = {
  userId: string;
  name: string;
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
        name: shift.name || "Unknown",
        shifts: [shift],
      });
    }
  });

  grouped.forEach((userShifts) => {
    userShifts.shifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  return Array.from(grouped.values());
}

const MAX_VISIBLE_USERS = 6;

export default function CalendarGrid({
  workMonth,
  shifts,
  courseEvents,
  users,
  holidays,
  selectedDate,
  language,
  onDayClick,
  onShiftClick,
  onDayDoubleClick,
}: CalendarGridProps) {
  // Build a user index map for colors
  const userIndexMap = new Map<string, number>();
  users.forEach((u, idx) => {
    userIndexMap.set(u.id, idx);
  });

  // Build holiday lookup map
  const holidayMap = new Map<string, Holiday>();
  holidays.forEach((h) => {
    holidayMap.set(h.date, h);
  });

  // Group course events by date
  const courseEventsByDate = new Map<string, CourseEvent[]>();
  courseEvents.forEach((ev) => {
    const existing = courseEventsByDate.get(ev.date) || [];
    existing.push(ev);
    courseEventsByDate.set(ev.date, existing);
  });
  courseEventsByDate.forEach((list) =>
    list.sort((a, b) => a.start_time.localeCompare(b.start_time))
  );

  // Get start and end dates for the work month
  const startDate = getWorkMonthStartDate(workMonth);
  const endDate = getWorkMonthEndDate(workMonth);

  // Build array of dates from 25th to 24th
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Calculate padding for the grid to start on Monday
  // Get day of week for start date (0=Sun, 1=Mon, etc)
  let startDayOfWeek = startDate.getDay();
  // Convert to Monday-start (Mon=0, Tue=1, ..., Sun=6)
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Add empty cells for padding at start
  const paddingBefore = startDayOfWeek;
  
  // Calculate total cells needed (round up to complete weeks)
  const totalDays = dates.length + paddingBefore;
  const totalWeeks = Math.ceil(totalDays / 7);
  const totalCells = totalWeeks * 7;
  const paddingAfter = totalCells - totalDays;

  // Group shifts by date
  const shiftsByDate = new Map<string, Shift[]>();
  shifts.forEach((shift) => {
    const existing = shiftsByDate.get(shift.date) || [];
    existing.push(shift);
    shiftsByDate.set(shift.date, existing);
  });

  // Today's date string
  const today = new Date();
  const todayStr = formatDateStr(today);

  // Weekday headers (Monday start)
  const weekDays =
    language === "ko"
      ? ["월", "화", "수", "목", "금", "토", "일"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
      <div 
        className={styles.grid}
        style={{ gridTemplateRows: `repeat(${totalWeeks}, 1fr)` }}
      >
        {/* Padding cells before */}
        {Array.from({ length: paddingBefore }).map((_, idx) => (
          <div key={`pad-before-${idx}`} className={`${styles.dayCell} ${styles.emptyCell}`} />
        ))}

        {/* Actual date cells */}
        {dates.map((date, idx) => {
          const dateStr = formatDateStr(date);
          const dayShifts = shiftsByDate.get(dateStr) || [];
          const dayCourses = courseEventsByDate.get(dateStr) || [];
          const groupedShifts = groupShiftsByUser(dayShifts);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const dayOfWeek = (paddingBefore + idx) % 7;
          const isWeekend = dayOfWeek >= 5;

          // Check if this date is in the first month or second month of work period
          const isFirstMonth = date.getMonth() === workMonth.startMonth;

          // Check for holiday
          const holiday = holidayMap.get(dateStr);
          const isPublicHoliday = holiday?.type === "Public holiday";

          const visibleUsers = groupedShifts.slice(0, MAX_VISIBLE_USERS);
          const hiddenCount = groupedShifts.length - MAX_VISIBLE_USERS;

          return (
            <div
              key={dateStr}
              className={`${styles.dayCell} ${isSelected ? styles.selected : ""} ${
                isWeekend ? styles.weekend : ""
              } ${!isFirstMonth ? styles.secondMonth : ""} ${
                isPublicHoliday ? styles.publicHoliday : ""
              }`}
              onClick={() => onDayClick(dateStr)}
              onDoubleClick={() => onDayDoubleClick(dateStr)}
            >
              <div className={styles.dayHeader}>
                <span className={`${styles.dayNumber} ${isToday ? styles.today : ""} ${
                  isPublicHoliday ? styles.holidayDay : ""
                }`}>
                  {date.getDate()}
                </span>
                {/* Show month indicator on 1st of month or first day shown */}
                {(date.getDate() === 1 || date.getDate() === 25) && (
                  <span className={styles.monthIndicator}>
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                )}
              </div>

              {/* Holiday name */}
              {holiday && (
                <div 
                  className={`${styles.holidayName} ${isPublicHoliday ? styles.publicHolidayName : ""}`}
                  title={`${holiday.name} (${holiday.localName})`}
                >
                  {holiday.localName}
                </div>
              )}

              <div className={styles.shiftsContainer}>
                {dayCourses.map((ev) => (
                  <div
                    key={`${ev.date}-${ev.course_code}-${ev.start_time}`}
                    className={styles.courseBar}
                    title={`${ev.course_title} · ${ev.start_time.slice(0, 5)}–${ev.end_time.slice(0, 5)} · ${ev.location}`}
                  >
                    <span className={styles.courseBarText}>
                      {ev.course_title} · {formatTime(ev.start_time)}–{formatTime(ev.end_time)}
                    </span>
                  </div>
                ))}
                {visibleUsers.map((userShifts) => {
                  const userIdx = userIndexMap.get(userShifts.userId) ?? 0;
                  const color = getWorkerColor(userIdx);

                  const timesDisplay = userShifts.shifts
                    .map((s) => `${formatTime(s.start_time)}–${formatTime(s.end_time)}`)
                    .join(", ");

                  // Show name for all users (shared schedule visibility)
                  const displayText = `${userShifts.name} · ${timesDisplay}`;

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
                      title={`${userShifts.name}: ${timesDisplay}`}
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
                      onDayClick(dateStr);
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

        {/* Padding cells after */}
        {Array.from({ length: paddingAfter }).map((_, idx) => (
          <div key={`pad-after-${idx}`} className={`${styles.dayCell} ${styles.emptyCell}`} />
        ))}
      </div>
    </div>
  );
}
