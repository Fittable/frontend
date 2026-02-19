import { 
  User, 
  UserMe,
  Shift, 
  ShiftCreate, 
  ShiftUpdate, 
  LoginCredentials,
  LoginResponse,
  HoursSummaryResponse,
  Holiday,
  HolidayCreate,
  HolidayUpdate,
  HolidaysResponse,
  SyncResponse,
  TimetableResponse,
  ProfileSettings,
  ProfileSettingsUpdate,
} from "./types";

const API_BASE = "/api";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: `Request failed with status ${res.status}` }));
      const message = error.detail ?? error.message ?? `Request failed with status ${res.status}`;
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return null as T;
    }

    return res.json();
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error or invalid response");
  }
}

export const api = {
  // Auth
  login: (credentials: LoginCredentials) =>
    fetchApi<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    fetchApi<{ message: string }>("/auth/logout", {
      method: "POST",
    }),

  getMe: () => fetchApi<UserMe>("/me"),

  // Users (admin only)
  getUsers: () => fetchApi<User[]>("/users"),

  updateUserRole: (userId: string, role: "admin" | "worker") =>
    fetchApi<User>(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  // Shifts
  getShifts: (month: string, userId?: string) => {
    const params = new URLSearchParams({ month });
    if (userId) params.append("user_id", userId);
    return fetchApi<Shift[]>(`/shifts?${params}`);
  },

  createShift: (data: ShiftCreate) =>
    fetchApi<Shift>("/shifts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateShift: (id: string, data: ShiftUpdate) =>
    fetchApi<Shift>(`/shifts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteShift: (id: string) =>
    fetchApi<null>(`/shifts/${id}`, {
      method: "DELETE",
    }),

  // Hours Summary
  getHours: (month: string, userId?: string) => {
    const params = new URLSearchParams({ month });
    if (userId) params.append("user_id", userId);
    return fetchApi<HoursSummaryResponse>(`/shifts/hours?${params}`);
  },

  // Holidays
  getHolidays: (year?: number) => {
    const params = year ? `?year=${year}` : "";
    return fetchApi<HolidaysResponse>(`/holidays${params}`);
  },

  createHoliday: (data: HolidayCreate) =>
    fetchApi<Holiday>("/holidays", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateHoliday: (id: string, data: HolidayUpdate) =>
    fetchApi<Holiday>(`/holidays/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteHoliday: (id: string) =>
    fetchApi<null>(`/holidays/${id}`, {
      method: "DELETE",
    }),

  syncHolidays: (year: number) =>
    fetchApi<SyncResponse>(`/holidays/sync?year=${year}`, {
      method: "POST",
    }),

  // Timetable (courses)
  getTimetable: (year: number, semester: number) =>
    fetchApi<TimetableResponse>(`/timetable?year=${year}&semester=${semester}`),

  // Profile settings
  getProfileSettings: () => fetchApi<ProfileSettings>("/profile/settings"),

  updateProfileSettings: (data: ProfileSettingsUpdate) =>
    fetchApi<ProfileSettings>("/profile/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Schedule PDF download
  downloadSchedulePDF: async (month?: string, startDate?: string, endDate?: string): Promise<void> => {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.append("start_date", startDate);
      params.append("end_date", endDate);
    } else if (month) {
      params.append("month", month);
    } else {
      throw new Error("Either month or start_date+end_date required");
    }

    const res = await fetch(`${API_BASE}/shifts/schedule/pdf?${params}`, {
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: `Request failed with status ${res.status}` }));
      const message = error.detail ?? error.message ?? `Request failed with status ${res.status}`;
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = res.headers.get("Content-Disposition");
    let filename = month ? `schedule-${month}.pdf` : "schedule.pdf";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

