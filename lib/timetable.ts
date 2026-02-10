import type { TimetableResponse, CourseEvent } from "./types";
import { formatDateStr } from "./workMonth";

/**
 * Expand timetable courses into per-date course events for a given date range.
 * API day_num: 0 = Monday, 1 = Tuesday, ... 4 = Friday.
 * JS getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday.
 * So we need date.getDay() === schedule.day_num + 1.
 */
export function timetableToCourseEvents(
  response: TimetableResponse,
  startDate: Date,
  endDate: Date
): CourseEvent[] {
  const events: CourseEvent[] = [];
  if (!response.success || !response.courses) return events;

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const jsDay = current.getDay(); // 0=Sun, 1=Mon, ...
    const dateStr = formatDateStr(current);

    for (const course of Object.values(response.courses)) {
      for (const schedule of course.schedules) {
        // day_num 0 = Monday => jsDay 1, day_num 1 = Tuesday => jsDay 2, ...
        if (jsDay === schedule.day_num + 1) {
          events.push({
            date: dateStr,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            course_title: course.course_title,
            course_code: course.course_code,
            location: schedule.location,
            professor: schedule.professor,
          });
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return events;
}

/**
 * Semester from current date: January–June => 1, July–December => 2.
 */
export function getSemesterFromDate(date: Date): number {
  const month = date.getMonth(); // 0-11
  return month >= 0 && month <= 5 ? 1 : 2;
}
