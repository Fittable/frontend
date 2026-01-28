import { User, Shift, ShiftCreate, ShiftUpdate, LoginCredentials, HoursSummaryResponse } from "./types";

const API_BASE = "/api";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

export const api = {
  // Auth
  login: (credentials: LoginCredentials) =>
    fetchApi<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    fetchApi<{ message: string }>("/auth/logout", {
      method: "POST",
    }),

  getMe: () => fetchApi<User>("/me"),

  // Users (admin only)
  getUsers: () => fetchApi<User[]>("/users"),

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
};

