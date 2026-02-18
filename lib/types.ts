export interface User {
  id: string;
  student_id: string;
  name: string | null;
  nickname?: string | null;
  role: "admin" | "worker";
  created_at?: string;
  status?: string;
}

export interface Shift {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  note: string | null;
  created_by: string;
  updated_at: string;
  name?: string | null;
  task_name?: string | null;
  segments?: {
    start: string;
    end: string;
  }[];
}

export interface ShiftCreate {
  date: string;
  start_time: string;
  end_time: string;
  note?: string;
  user_id?: string;
}

export interface ShiftUpdate {
  date?: string;
  start_time?: string;
  end_time?: string;
  note?: string;
  user_id?: string;
}

/** Request body for POST /api/auth/login (LoginRequest in OpenAPI) */
export interface LoginRequest {
  student_id?: string;
  password: string;
}

/** Alias for form/UI use */
export type LoginCredentials = LoginRequest;

/** Response from POST /api/auth/login (LoginResponse in OpenAPI) */
export interface LoginResponse {
  success: boolean;
  message: string;
  /** KLAS session token – use only for endpoints that still expect it (e.g. /api/auth/me) */
  token: string | null;
  /** JWT – use for shifts, users, holidays, and all other protected API routes */
  access_token: string | null;
}

export interface ApiError {
  detail: string;
}

export interface UserHoursSummary {
  user_id: string;
  name: string | null;
  daily: Record<string, number>;
  monthly_total: number;
  shift_count: number;
}

export interface HoursSummaryResponse {
  month: string;
  users: UserHoursSummary[];
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  localName: string;
  type: string;  // "Public holiday" or "Observance"
  localType: string;  // "공휴일" or "기념일"
  source: string;  // "google" or "manual"
}

export interface HolidayCreate {
  date: string;
  name: string;
  localName: string;
  type: string;
  localType: string;
}

export interface HolidayUpdate {
  date?: string;
  name?: string;
  localName?: string;
  type?: string;
  localType?: string;
}

export interface HolidaysResponse {
  year: number;
  count: number;
  holidays: Holiday[];
}

export interface SyncResponse {
  year: number;
  synced: number;
  message: string;
}

export interface UserMe {
  id: string;
  student_id: string;
  name: string | null;
  role: string;
  status: string;
}

/** Timetable: course schedule from KLAS / backend */
export interface TimetableSchedule {
  day: string;
  day_num: number;
  start_time: string;
  end_time: string;
  location: string;
  professor: string;
}

export interface TimetableCourse {
  course_title: string;
  course_code: string;
  schedules: TimetableSchedule[];
}

export interface TimetableResponse {
  success: boolean;
  courses: Record<string, TimetableCourse>;
  message: string | null;
}

/** One course occurrence on a specific date (for calendar display) */
export interface CourseEvent {
  date: string;
  start_time: string;
  end_time: string;
  course_title: string;
  course_code: string;
  location: string;
  professor: string;
}

/** Profile settings from GET /api/profile/settings */
export interface ProfileSettings {
  name: string | null;
  student_id: string;
  major: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  profile_image: string | null;
  room_no: string | null;
  nickname: string | null;
  dept_name: string | null;
  work_category: string | null;
}

/** Editable fields for PATCH /api/profile/settings */
export interface ProfileSettingsUpdate {
  room_no?: string | null;
  nickname?: string | null;
  dept_name?: string | null;
  work_category?: string | null;
}

export type DisplayNamePreference = "nickname" | "fullName";

/** Returns display name for a user. When preferFullName, skips nickname and uses name/student_id. */
export function getDisplayName(
  user: { nickname?: string | null; name?: string | null; student_id: string },
  preference: DisplayNamePreference = "nickname"
): string {
  if (preference === "fullName") {
    return user.name || user.student_id || "Unknown";
  }
  return (user.nickname && user.nickname.trim()) || user.name || user.student_id || "Unknown";
}
