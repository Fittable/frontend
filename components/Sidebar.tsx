"use client";

import { useState, useEffect } from "react";
import { User, Shift } from "@/lib/types";
import { WorkMonth } from "@/lib/workMonth";
import { api } from "@/lib/api";
import MiniCalendar from "./MiniCalendar";
import { t, Language } from "@/lib/i18n";
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
  shifts: Shift[];
  workMonth: WorkMonth;
  selectedDate: string | null;
  language: Language;
  visibleWorkerIds: string[];
  onDateSelect: (date: Date) => void;
  onWorkerFilterChange: (workerIds: string[]) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  onLanguageChange: (lang: "ko" | "en") => void;
}

export default function Sidebar({
  user,
  users,
  shifts,
  workMonth,
  selectedDate,
  language,
  visibleWorkerIds,
  onDateSelect,
  onWorkerFilterChange,
  onLogout,
  isOpen,
  onClose,
  onLanguageChange,
}: SidebarProps) {
  const showAllSelected = visibleWorkerIds.length === 0;
  const [userHours, setUserHours] = useState<Record<string, number>>({});
  const [profileImageError, setProfileImageError] = useState(false);

  // Fetch hours for the current work month (25th to 24th)
  // Re-fetch when shifts change (after create/update/delete); depend on shifts so edits (same length) also trigger refetch
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
  }, [workMonth, shifts]);

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

  // All users can see all workers
  const workerList = users;

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

        {/* Worker Filter - Show for all users */}
        {workerList.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t(language, "sidebar.workers")}</h3>
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
                <span className={styles.filterLabel}>
                  {t(language, "sidebar.allWorkers")}
                </span>
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
                    <span className={styles.filterLabel}>{w.name || w.student_id}</span>
                    {hours !== undefined && hours > 0 && (
                      <span className={styles.hoursLabel}>{hours}h</span>
                    )}
                    {w.role === "admin" && (
                      <span className={styles.adminBadge}>{t(language, "common.admin")}</span>
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
            <div className={styles.userMeta}>
              <div className={styles.userAvatar}>
                <span className={styles.userAvatarLetter}>
                  {(user.name || user.student_id).charAt(0).toUpperCase()}
                </span>
                {!profileImageError && (
                  <img
                    src="/api/profile/image"
                    alt=""
                    className={styles.userAvatarImage}
                    onError={() => setProfileImageError(true)}
                  />
                )}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user.name || user.student_id}</span>
                <span className={styles.userRole}>{user.role}</span>
              </div>
            </div>
            <div className={styles.langToggle} aria-label="Language">
              <button
                type="button"
                className={`${styles.langButton} ${
                  language === "ko" ? styles.langButtonActive : ""
                }`}
                onClick={() => onLanguageChange("ko")}
              >
                한
              </button>
              <button
                type="button"
                className={`${styles.langButton} ${
                  language === "en" ? styles.langButtonActive : ""
                }`}
                onClick={() => onLanguageChange("en")}
              >
                En
              </button>
            </div>
          </div>
          <button onClick={onLogout} className={styles.logoutButton}>
            <LogoutIcon />
            <span>{t(language, "common.logout")}</span>
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
