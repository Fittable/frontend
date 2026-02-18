"use client";

import { Shift, User, Holiday, CourseEvent, getDisplayName, DisplayNamePreference } from "@/lib/types";
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
  courseEvents: CourseEvent[];
  users: User[];
  holidays: Holiday[];
  selectedDate: string | null;
  language: Language;
  displayNamePreference?: DisplayNamePreference;
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

/** Two time ranges overlap if one starts before the other ends */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

function dayHasOverlappingShiftAndCourse(
  dayShifts: Shift[],
  dayCourses: CourseEvent[]
): boolean {
  for (const shift of dayShifts) {
    for (const course of dayCourses) {
      if (
        timeRangesOverlap(
          shift.start_time,
          shift.end_time,
          course.start_time,
          course.end_time
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

export default function WeeklyCalendarGrid({
  workMonth,
  shifts,
  courseEvents,
  users,
  holidays,
  selectedDate,
  language,
  displayNamePreference = "nickname",
  onDayClick,
  onShiftClick,
  onDayDoubleClick,
}: WeeklyCalendarGridProps) {
  const userIndexMap = new Map<string, number>();
  const displayNameMap = new Map<string, string>();
  users.forEach((u, idx) => {
    userIndexMap.set(u.id, idx);
    displayNameMap.set(u.id, getDisplayName(u, displayNamePreference));
  });

  const holidayMap = new Map<string, Holiday>();
  holidays.forEach((h) => {
    holidayMap.set(h.date, h);
  });

  const courseEventsByDate = new Map<string, CourseEvent[]>();
  courseEvents.forEach((ev) => {
    const existing = courseEventsByDate.get(ev.date) || [];
    existing.push(ev);
    courseEventsByDate.set(ev.date, existing);
  });
  courseEventsByDate.forEach((list) =>
    list.sort((a, b) => a.start_time.localeCompare(b.start_time))
  );

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

  // Week view: Mon–Fri only (no Saturday/Sunday)
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
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

  // For each date, ordered list of user_ids that have at least one shift (order = users order)
  const workersByDate = new Map<string, string[]>();
  days.forEach((date) => {
    const dateStr = formatDateStr(date);
    const dayShifts = shiftsByDate.get(dateStr) || [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    users.forEach((u) => {
      if (dayShifts.some((s) => s.user_id === u.id) && !seen.has(u.id)) {
        seen.add(u.id);
        ordered.push(u.id);
      }
    });
    workersByDate.set(dateStr, ordered.length ? ordered : []);
  });

  const hasCoursesByDate = new Map<string, boolean>();
  days.forEach((date) => {
    const dateStr = formatDateStr(date);
    hasCoursesByDate.set(
      dateStr,
      (courseEventsByDate.get(dateStr)?.length ?? 0) > 0
    );
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
                    ? ["월", "화", "수", "목", "금"][idx]
                    : ["Mon", "Tue", "Wed", "Thu", "Fri"][idx]}
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

        {/* Day columns: each day split into worker lanes (side-by-side) */}
        <div className={styles.weekColumns}>
          {days.map((date) => {
            const dateStr = formatDateStr(date);
            const dayShifts = shiftsByDate.get(dateStr) || [];
            const dayCourses = courseEventsByDate.get(dateStr) || [];
            const workersOnDay = workersByDate.get(dateStr) || [];
            const hasCourses = hasCoursesByDate.get(dateStr) ?? false;
            const inWorkMonth = date >= workStart && date <= workEnd;
            const hasOverlap = dayHasOverlappingShiftAndCourse(dayShifts, dayCourses);

            // Use merged lane only when single shift and no overlap; otherwise lanes (side-by-side) to avoid overlap
            const useMergedLane =
              !hasOverlap &&
              dayShifts.length <= 1 &&
              (workersOnDay.length > 0 || hasCourses);

            const laneItems: (string | null)[] = useMergedLane
              ? ["__merged__"]
              : workersOnDay.length > 0
                ? [...workersOnDay]
                : hasCourses
                  ? []
                  : [null];
            if (!useMergedLane && hasCourses) laneItems.push("__courses__");
            const laneCount = Math.max(1, laneItems.length);

            return (
              <div
                key={dateStr}
                className={`${styles.dayColumn} ${
                  !inWorkMonth ? styles.dayColumnOutside : ""
                }`}
                onClick={() => onDayClick(dateStr)}
                onDoubleClick={() => onDayDoubleClick(dateStr)}
              >
                <div
                  className={styles.dayColumnLanes}
                  style={{
                    gridTemplateColumns: `repeat(${laneCount}, 1fr)`,
                  }}
                >
                  {laneItems.map((laneId) => {
                    const isCourseLane = laneId === "__courses__";
                    const isMergedLane = laneId === "__merged__";
                    const laneShifts =
                      laneId && !isCourseLane && !isMergedLane
                        ? dayShifts.filter((s) => s.user_id === laneId)
                        : isMergedLane
                          ? dayShifts
                          : [];

                    return (
                      <div key={laneId ?? "empty"} className={styles.dayLane}>
                        <div className={styles.dayColumnGrid}>
                          {hours.map((h) => (
                            <div key={h} className={styles.timeSlotCell} />
                          ))}
                          {isMergedLane ? (
                            <>
                              {laneShifts.map((shift) => {
                                const startMinutes =
                                  parseTimeToMinutes(shift.start_time) - START_HOUR * 60;
                                const endMinutes =
                                  parseTimeToMinutes(shift.end_time) - START_HOUR * 60;
                                const top = Math.max(0, (startMinutes / totalMinutes) * 100);
                                const bottom =
                                  100 - Math.max(0, Math.min(100, (endMinutes / totalMinutes) * 100));
                                const height = Math.max(6, 100 - top - bottom);
                                const color = getWorkerColor(userIndexMap.get(shift.user_id) ?? 0);
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
                                    title={`${displayNameMap.get(shift.user_id) || shift.name || "Unknown"} · ${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}`}
                                  >
                                    <span className={styles.shiftBlockTitle}>
                                      {displayNameMap.get(shift.user_id) || shift.name || "Unknown"}
                                    </span>
                                    <span className={styles.shiftBlockTime}>
                                      {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                                    </span>
                                  </button>
                                );
                              })}
                              {dayCourses.map((ev) => {
                                const startMinutes =
                                  parseTimeToMinutes(ev.start_time) - START_HOUR * 60;
                                const endMinutes =
                                  parseTimeToMinutes(ev.end_time) - START_HOUR * 60;
                                const top = Math.max(0, (startMinutes / totalMinutes) * 100);
                                const bottom =
                                  100 - Math.max(0, Math.min(100, (endMinutes / totalMinutes) * 100));
                                const height = Math.max(6, 100 - top - bottom);
                                return (
                                  <div
                                    key={`${ev.course_code}-${ev.start_time}`}
                                    className={styles.courseBlock}
                                    style={{ top: `${top}%`, height: `${height}%` }}
                                    title={`${ev.course_title} · ${ev.start_time.slice(0, 5)}–${ev.end_time.slice(0, 5)} · ${ev.location}`}
                                  >
                                    <span className={styles.courseBlockTitle}>
                                      {ev.course_title}
                                    </span>
                                    <span className={styles.courseBlockTime}>
                                      {ev.start_time.slice(0, 5)} – {ev.end_time.slice(0, 5)}
                                    </span>
                                  </div>
                                );
                              })}
                            </>
                          ) : isCourseLane ? (
                            dayCourses.map((ev) => {
                                const startMinutes =
                                  parseTimeToMinutes(ev.start_time) -
                                  START_HOUR * 60;
                                const endMinutes =
                                  parseTimeToMinutes(ev.end_time) -
                                  START_HOUR * 60;
                                const top = Math.max(
                                  0,
                                  (startMinutes / totalMinutes) * 100
                                );
                                const bottom =
                                  100 -
                                  Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      (endMinutes / totalMinutes) * 100
                                    )
                                  );
                                const height = Math.max(
                                  6,
                                  100 - top - bottom
                                );
                                return (
                                  <div
                                    key={`${ev.course_code}-${ev.start_time}`}
                                    className={styles.courseBlock}
                                    style={{
                                      top: `${top}%`,
                                      height: `${height}%`,
                                    }}
                                    title={`${ev.course_title} · ${ev.start_time.slice(0, 5)}–${ev.end_time.slice(0, 5)} · ${ev.location}`}
                                  >
                                    <span className={styles.courseBlockTitle}>
                                      {ev.course_title}
                                    </span>
                                    <span className={styles.courseBlockTime}>
                                      {ev.start_time.slice(0, 5)} –{" "}
                                      {ev.end_time.slice(0, 5)}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              laneShifts.map((shift) => {
                                const startMinutes =
                                  parseTimeToMinutes(shift.start_time) - START_HOUR * 60;
                                const endMinutes =
                                  parseTimeToMinutes(shift.end_time) - START_HOUR * 60;
                                const top = Math.max(0, (startMinutes / totalMinutes) * 100);
                                const bottom =
                                  100 - Math.max(0, Math.min(100, (endMinutes / totalMinutes) * 100));
                                const height = Math.max(6, 100 - top - bottom);

                                const color = getWorkerColor(userIndexMap.get(shift.user_id) ?? 0);

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
                                    title={`${displayNameMap.get(shift.user_id) || shift.name || "Unknown"} · ${shift.start_time.slice(
                                      0,
                                      5
                                    )}–${shift.end_time.slice(0, 5)}`}
                                  >
                                    <span className={styles.shiftBlockTitle}>
                                      {displayNameMap.get(shift.user_id) || shift.name || "Unknown"}
                                    </span>
                                    <span className={styles.shiftBlockTime}>
                                      {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                        </div>
                      </div>
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

