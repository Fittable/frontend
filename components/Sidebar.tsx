"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { WorkMonth } from "@/lib/workMonth";
import { api } from "@/lib/api";
import MiniCalendar from "./MiniCalendar";
import styles from "./Sidebar.module.css";

// Worker color palette
export const WORKER_COLORS = [
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
  "#22d3d8", // cyan
];

export function getWorkerColor(index: number): string {
  return WORKER_COLORS[index % WORKER_COLORS.length];
}

interface SidebarProps {
  user: User;
  users: User[];
  workMonth: WorkMonth;
  selectedDate: string | null;
  visibleWorkerIds: string[];
  onDateSelect: (date: Date) => void;
  onWorkerFilterChange: (workerIds: string[]) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  user,
  users,
  workMonth,
  selectedDate,
  visibleWorkerIds,
  onDateSelect,
  onWorkerFilterChange,
  onLogout,
  isOpen,
  onClose,
}: SidebarProps) {
  const isAdmin = user.role === "admin";
  const showAllSelected = visibleWorkerIds.length === 0;
  const [userHours, setUserHours] = useState<Record<string, number>>({});

  // Fetch hours for the current work month (25th to 24th)
  useEffect(() => {
    const fetchHours = async () => {
      try {
        // Format the work month start as YYYY-MM
        const workMonthStart = `${workMonth.startYear}-${String(workMonth.startMonth + 1).padStart(2, "0")}`;
        
        const data = await api.getHours(workMonthStart);
        const hoursByUser: Record<string, number> = {};
        
        for (const userSummary of data.users) {
          hoursByUser[userSummary.user_id] = Math.round(userSummary.monthly_total * 10) / 10;
        }

        setUserHours(hoursByUser);
      } catch (err) {
        console.error("Failed to fetch hours:", err);
      }
    };

    fetchHours();
  }, [workMonth]);

  const handleAllWorkersToggle = () => {
    onWorkerFilterChange([]);
  };

  const handleWorkerToggle = (userId: string) => {
    if (showAllSelected) {
      onWorkerFilterChange([userId]);
    } else if (visibleWorkerIds.includes(userId)) {
      const newIds = visibleWorkerIds.filter((id) => id !== userId);
      onWorkerFilterChange(newIds);
    } else {
      onWorkerFilterChange([...visibleWorkerIds, userId]);
    }
  };

  const workerList = isAdmin ? users : users.filter((u) => u.id === user.id);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        {/* Mini Calendar */}
        <div className={styles.section}>
          <MiniCalendar
            workMonth={workMonth}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
          />
        </div>

        {/* Worker Filter - Only show for admin with multiple workers */}
        {isAdmin && workerList.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Workers</h3>
            <div className={styles.filterList}>
              {/* All Workers option */}
              <label className={styles.filterItem}>
                <input
                  type="radio"
                  name="workerFilter"
                  checked={showAllSelected}
                  onChange={handleAllWorkersToggle}
                  className={styles.filterRadio}
                />
                <span className={styles.filterDot} style={{ background: "var(--text-muted)" }} />
                <span className={styles.filterLabel}>All Workers</span>
              </label>

              {/* Individual workers */}
              {workerList.map((w, index) => {
                const color = getWorkerColor(index);
                const isSelected = !showAllSelected && visibleWorkerIds.includes(w.id);
                const hours = userHours[w.id];

                return (
                  <label key={w.id} className={styles.filterItem}>
                    <input
                      type="checkbox"
                      checked={showAllSelected || isSelected}
                      onChange={() => handleWorkerToggle(w.id)}
                      className={styles.filterCheckbox}
                    />
                    <span className={styles.filterDot} style={{ background: color }} />
                    <span className={styles.filterLabel}>{w.username}</span>
                    {hours !== undefined && hours > 0 && (
                      <span className={styles.hoursLabel}>{hours}h</span>
                    )}
                    {w.role === "admin" && (
                      <span className={styles.adminBadge}>admin</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className={styles.spacer} />

        {/* User Info */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.username}</span>
              <span className={styles.userRole}>{user.role}</span>
            </div>
          </div>
          <button onClick={onLogout} className={styles.logoutButton}>
            <LogoutIcon />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
