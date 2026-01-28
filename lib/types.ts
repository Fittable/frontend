export interface User {
  id: string;
  username: string;
  role: "admin" | "worker";
  created_at?: string;
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
  username?: string;
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

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiError {
  detail: string;
}

export interface UserHoursSummary {
  user_id: string;
  username: string | null;
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

