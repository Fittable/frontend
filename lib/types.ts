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

