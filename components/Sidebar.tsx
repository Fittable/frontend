"use client";

import { useState, useEffect, useRef } from "react";
import { User, Shift, DisplayNamePreference, ProfileSettings } from "@/lib/types";
import { WorkMonth } from "@/lib/workMonth";
import { api } from "@/lib/api";
import MiniCalendar from "./MiniCalendar";
import ProfileCard from "./ProfileCard";
import { t, Language } from "@/lib/i18n";
import { getDisplayName } from "@/lib/types";
import { useTheme } from "@/components/ThemeProvider";
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
  displayNamePreference?: DisplayNamePreference;
  onDisplayNamePreferenceChange?: (pref: DisplayNamePreference) => void;
  onProfileUpdated?: (profile: ProfileSettings) => void;
  /** Cached profile for settings modal; when provided, settings open without an API call. */
  profile?: ProfileSettings | null;
  onDownloadSchedulePDF?: (highlight?: "all" | "102" | "103" | "none") => void;
  scheduleHighlight?: "all" | "102" | "103" | "none";
  onScheduleHighlightChange?: (value: "all" | "102" | "103" | "none") => void;
  onDownloadWorklog?: () => void;
  onDownloadWorklogDocx?: () => void;
  downloadDisabled?: boolean;
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
  displayNamePreference = "nickname",
  onDisplayNamePreferenceChange,
  onProfileUpdated,
  profile: profileProp,
  onDownloadSchedulePDF,
  scheduleHighlight = "all",
  onScheduleHighlightChange,
  onDownloadWorklog,
  onDownloadWorklogDocx,
  downloadDisabled,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const showAllSelected = visibleWorkerIds.length === 0;
  const [userHours, setUserHours] = useState<Record<string, number>>({});
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [workLogMenuOpen, setWorkLogMenuOpen] = useState(false);
  const workLogDropdownRef = useRef<HTMLDivElement>(null);
  const [scheduleMenuOpen, setScheduleMenuOpen] = useState(false);
  const scheduleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!workLogMenuOpen && !scheduleMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (workLogMenuOpen && workLogDropdownRef.current && !workLogDropdownRef.current.contains(e.target as Node)) {
        setWorkLogMenuOpen(false);
      }
      if (scheduleMenuOpen && scheduleDropdownRef.current && !scheduleDropdownRef.current.contains(e.target as Node)) {
        setScheduleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [workLogMenuOpen, scheduleMenuOpen]);

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
          hoursByUser[userSummary.user_id] = userSummary.monthly_total;
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

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${scheduleMenuOpen || workLogMenuOpen ? styles.dropdownOpen : ""}`}
      >
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
                    <span className={styles.filterLabel}>{getDisplayName(w, displayNamePreference)}</span>
                    {hours !== undefined && hours > 0 && (
                      <span className={styles.hoursLabel}>{hours.toFixed(2)}h</span>
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
          {/* Download Buttons */}
          {(onDownloadSchedulePDF || onDownloadWorklog || onDownloadWorklogDocx) && (
            <div className={styles.downloadSection}>
              {onDownloadSchedulePDF && (
                <div
                  ref={scheduleDropdownRef}
                  className={styles.workLogDropdownWrap}
                >
                  <button
                    type="button"
                    className={styles.downloadButton}
                    disabled={downloadDisabled}
                    aria-haspopup="true"
                    aria-expanded={scheduleMenuOpen}
                    onClick={() => setScheduleMenuOpen((open) => !open)}
                  >
                    <DownloadIcon />
                    <span>{language === "ko" ? "시간표" : "Schedule"}</span>
                  </button>
                  {scheduleMenuOpen && (
                    <div className={styles.workLogDropdown} role="menu">
                      {([
                        { value: "all" as const, label: language === "ko" ? "전체" : "All" },
                        { value: "102" as const, label: "102호", color: "#f472b6" },
                        { value: "103" as const, label: "103호", color: "#4ade80" },
                        { value: "none" as const, label: language === "ko" ? "없음" : "None" },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          role="menuitem"
                          className={`${styles.workLogDropdownItem} ${scheduleHighlight === opt.value ? styles.workLogDropdownItemActive : ""}`}
                          onClick={() => {
                            if (onScheduleHighlightChange) {
                              onScheduleHighlightChange(opt.value);
                            }
                            onDownloadSchedulePDF(opt.value);
                            setScheduleMenuOpen(false);
                          }}
                          disabled={downloadDisabled}
                        >
                          {opt.color && (
                            <span
                              className={styles.highlightDot}
                              style={{ background: opt.color }}
                            />
                          )}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {(onDownloadWorklog || onDownloadWorklogDocx) && (
                <div
                  ref={workLogDropdownRef}
                  className={styles.workLogDropdownWrap}
                >
                  <button
                    type="button"
                    className={styles.downloadButton}
                    disabled={downloadDisabled}
                    aria-haspopup="true"
                    aria-expanded={workLogMenuOpen}
                    onClick={() => setWorkLogMenuOpen((open) => !open)}
                  >
                    <DownloadIcon />
                    <span>{language === "ko" ? "근무일지" : "Work Log"}</span>
                  </button>
                  {workLogMenuOpen && (
                    <div className={styles.workLogDropdown} role="menu">
                      {onDownloadWorklog && (
                        <button
                          type="button"
                          role="menuitem"
                          className={styles.workLogDropdownItem}
                          onClick={() => {
                            onDownloadWorklog();
                            setWorkLogMenuOpen(false);
                          }}
                          disabled={downloadDisabled}
                        >
                          PDF
                        </button>
                      )}
                      {onDownloadWorklogDocx && (
                        <button
                          type="button"
                          role="menuitem"
                          className={styles.workLogDropdownItem}
                          onClick={() => {
                            onDownloadWorklogDocx();
                            setWorkLogMenuOpen(false);
                          }}
                          disabled={downloadDisabled}
                        >
                          {language === "ko" ? "Word" : "Word"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className={styles.userInfo}>
            <div className={styles.userMeta}>
              <div className={styles.userAvatar}>
                <span className={styles.userAvatarLetter}>
                  {getDisplayName(user, "fullName").charAt(0).toUpperCase()}
                </span>
                <img
                  src="/default-avatar.png"
                  alt=""
                  className={styles.userAvatarImage}
                />
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userNameRow}>
                  <span className={styles.userName}>{getDisplayName(user, "fullName")}</span>
                  <div className={styles.userNameRowActions}>
                    <button
                      type="button"
                      className={styles.settingsButton}
                      onClick={() => setShowProfileCard(true)}
                      aria-label={t(language, "profile.settings")}
                      title={t(language, "profile.settings")}
                    >
                      <SettingsIcon />
                    </button>
                    <button
                      type="button"
                      className={styles.themeToggle}
                      onClick={toggleTheme}
                      aria-label={theme === "dark" ? (language === "ko" ? "라이트 모드로 전환" : "Switch to light mode") : (language === "ko" ? "다크 모드로 전환" : "Switch to dark mode")}
                      title={theme === "dark" ? (language === "ko" ? "라이트 모드" : "Light mode") : (language === "ko" ? "다크 모드" : "Dark mode")}
                    >
                      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </button>
                  </div>
                </div>
                <span className={styles.userRole}>{user.role}</span>
              </div>
            </div>
          </div>
          <button onClick={onLogout} className={styles.logoutButton}>
            <LogoutIcon />
            <span>{t(language, "common.logout")}</span>
          </button>
        </div>
      </aside>

      {showProfileCard && (
        <ProfileCard
          language={language}
          onClose={() => setShowProfileCard(false)}
          onLanguageChange={onLanguageChange}
          displayNamePreference={displayNamePreference}
          onDisplayNamePreferenceChange={onDisplayNamePreferenceChange}
          onProfileUpdated={onProfileUpdated}
          initialSettings={profileProp ?? undefined}
          userDisplayName={getDisplayName(user, displayNamePreference)}
          userInitial={(user.name || user.student_id || "?").charAt(0)}
        />
      )}
    </>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
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

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
