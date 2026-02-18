"use client";

import { Shift, User, Holiday, CourseEvent, getDisplayName, DisplayNamePreference } from "@/lib/types";
import { WorkMonth, getWorkMonthStartDate, getWorkMonthEndDate, formatDateStr } from "@/lib/workMonth";
import { Language } from "@/lib/i18n";
import { getWorkerColor } from "./Sidebar";
import styles from "./MobileDayCalendar.module.css";

interface MobileDayCalendarProps {
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
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
}

const START_HOUR = 8; // 8 AM (mobile timeline start)
const END_HOUR = 20; // 8 PM

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m || 0);
}

export default function MobileDayCalendar({
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
  onPrevWeek,
  onNextWeek,
}: MobileDayCalendarProps) {
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

  // For each date, ordered list of user_ids with shifts (for lane layout)
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
    workersByDate.set(dateStr, ordered);
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
      {/* Week navigation header */}
      {(onPrevWeek || onNextWeek) && (
        <div className={styles.weekHeader}>
          {onPrevWeek && (
            <button className={styles.navButton} onClick={onPrevWeek} aria-label="Previous week">
              <ChevronLeftIcon />
            </button>
          )}
          <div className={styles.weekInfo}>
            <span className={styles.weekRange}>
              {language === "ko"
                ? `${days[0].getMonth() + 1}월 ${days[0].getDate()}일 - ${days[4].getDate()}일`
                : `${days[0].toLocaleDateString("en-US", { month: "short" })} ${days[0].getDate()} - ${days[4].getDate()}`}
            </span>
          </div>
          {onNextWeek && (
            <button className={styles.navButton} onClick={onNextWeek} aria-label="Next week">
              <ChevronRightIcon />
            </button>
          )}
        </div>
      )}

      {/* Day headers */}
      <div className={styles.dayHeaders}>
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
              <span>{formatHourLabel(h)}</span>
            </div>
          ))}
        </div>

        {/* Day columns with horizontal scroll */}
        <div className={styles.weekColumns}>
          {days.map((date) => {
            const dateStr = formatDateStr(date);
            const dayShifts = shiftsByDate.get(dateStr) || [];
            const dayCourses = courseEventsByDate.get(dateStr) || [];
            const workersOnDay = workersByDate.get(dateStr) || [];
            const inWorkMonth = date >= workStart && date <= workEnd;

            // Use lanes (side-by-side) when 2+ shifts; otherwise single column
            const useLanes = dayShifts.length > 1 && workersOnDay.length > 0;
            const hasCourses = dayCourses.length > 0;
            const laneCount = useLanes
              ? workersOnDay.length + (hasCourses ? 1 : 0)
              : 1;

            const renderEventsInGrid = (laneShifts: Shift[]) => {
              const allEvents: Array<{
                type: "shift" | "course";
                data: Shift | CourseEvent;
                startMinutes: number;
                endMinutes: number;
              }> = [];
              laneShifts.forEach((shift) => {
                const startMinutes = parseTimeToMinutes(shift.start_time);
                const endMinutes = parseTimeToMinutes(shift.end_time);
                allEvents.push({
                  type: "shift",
                  data: shift,
                  startMinutes,
                  endMinutes,
                });
              });
              if (!useLanes) {
                dayCourses.forEach((course) => {
                  const startMinutes = parseTimeToMinutes(course.start_time);
                  const endMinutes = parseTimeToMinutes(course.end_time);
                  allEvents.push({
                    type: "course",
                    data: course,
                    startMinutes,
                    endMinutes,
                  });
                });
              }
              allEvents.sort((a, b) => a.startMinutes - b.startMinutes);

              return allEvents.map((event) => {
                const startMinutes = event.startMinutes;
                const endMinutes = event.endMinutes;
                const top = Math.max(0, ((startMinutes - START_HOUR * 60) / totalMinutes) * 100);
                const bottom =
                  100 - Math.max(0, Math.min(100, ((endMinutes - START_HOUR * 60) / totalMinutes) * 100));
                const height = Math.max(6, 100 - top - bottom);

                if (event.type === "shift") {
                  const shift = event.data as Shift;
                  const color = getWorkerColor(userIndexMap.get(shift.user_id) ?? 0);
                  return (
                    <button
                      key={`shift-${shift.id}`}
                      className={styles.eventBlock}
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
                    >
                      <span className={styles.eventTime}>
                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                      </span>
                      <span className={styles.eventTitle}>{displayNameMap.get(shift.user_id) ?? shift.name ?? "Unknown"}</span>
                    </button>
                  );
                } else {
                  const course = event.data as CourseEvent;
                  return (
                    <div
                      key={`course-${course.course_code}-${course.start_time}`}
                      className={styles.eventBlock}
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        borderLeftColor: "#2563eb",
                        backgroundColor: "rgba(37, 99, 235, 0.14)",
                      }}
                    >
                      <span className={styles.eventTime}>
                        {course.start_time.slice(0, 5)} - {course.end_time.slice(0, 5)}
                      </span>
                      <span className={styles.eventTitle}>{course.course_title}</span>
                    </div>
                  );
                }
              });
            };

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
                  style={{ gridTemplateColumns: `repeat(${laneCount}, 1fr)` }}
                >
                  {useLanes ? (
                    <>
                      {workersOnDay.map((userId) => (
                        <div key={userId} className={styles.dayLane}>
                          <div className={styles.dayColumnGrid}>
                            {hours.map((h) => (
                              <div key={h} className={styles.timeSlotCell} />
                            ))}
                            {renderEventsInGrid(dayShifts.filter((s) => s.user_id === userId))}
                          </div>
                        </div>
                      ))}
                      {hasCourses && (
                        <div key="__courses__" className={styles.dayLane}>
                          <div className={styles.dayColumnGrid}>
                            {hours.map((h) => (
                              <div key={h} className={styles.timeSlotCell} />
                            ))}
                            {dayCourses.map((course) => {
                              const startMinutes = parseTimeToMinutes(course.start_time);
                              const endMinutes = parseTimeToMinutes(course.end_time);
                              const top = Math.max(0, ((startMinutes - START_HOUR * 60) / totalMinutes) * 100);
                              const bottom =
                                100 - Math.max(0, Math.min(100, ((endMinutes - START_HOUR * 60) / totalMinutes) * 100));
                              const height = Math.max(6, 100 - top - bottom);
                              return (
                                <div
                                  key={`course-${course.course_code}-${course.start_time}`}
                                  className={styles.eventBlock}
                                  style={{
                                    top: `${top}%`,
                                    height: `${height}%`,
                                    borderLeftColor: "#2563eb",
                                    backgroundColor: "rgba(37, 99, 235, 0.14)",
                                  }}
                                >
                                  <span className={styles.eventTime}>
                                    {course.start_time.slice(0, 5)} - {course.end_time.slice(0, 5)}
                                  </span>
                                  <span className={styles.eventTitle}>{course.course_title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.dayLane}>
                      <div className={styles.dayColumnGrid}>
                        {hours.map((h) => (
                          <div key={h} className={styles.timeSlotCell} />
                        ))}
                        {renderEventsInGrid(dayShifts)}
                        {dayCourses.map((course) => {
                          const startMinutes = parseTimeToMinutes(course.start_time);
                          const endMinutes = parseTimeToMinutes(course.end_time);
                          const top = Math.max(0, ((startMinutes - START_HOUR * 60) / totalMinutes) * 100);
                          const bottom =
                            100 - Math.max(0, Math.min(100, ((endMinutes - START_HOUR * 60) / totalMinutes) * 100));
                          const height = Math.max(6, 100 - top - bottom);
                          return (
                            <div
                              key={`course-${course.course_code}-${course.start_time}`}
                              className={styles.eventBlock}
                              style={{
                                top: `${top}%`,
                                height: `${height}%`,
                                borderLeftColor: "#2563eb",
                                backgroundColor: "rgba(37, 99, 235, 0.14)",
                              }}
                            >
                              <span className={styles.eventTime}>
                                {course.start_time.slice(0, 5)} - {course.end_time.slice(0, 5)}
                              </span>
                              <span className={styles.eventTitle}>{course.course_title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,6 15,12 9,18" />
    </svg>
  );
}
