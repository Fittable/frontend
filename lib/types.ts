export interface User {
  id: string;
  student_id: string;
  name: string | null;
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
  token: string | null;
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
