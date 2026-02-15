"use client";

import { WorkMonth, getWorkMonthLabel, getWorkMonthLabelKo } from "@/lib/workMonth";
import { t, Language } from "@/lib/i18n";
import styles from "./CalendarHeader.module.css";

export type ViewScope = "all" | "me";

interface CalendarHeaderProps {
  workMonth: WorkMonth;
  language: Language;
  viewMode: "month" | "week";
  viewScope: ViewScope;
  downloadDisabled?: boolean;
  onViewModeChange: (mode: "month" | "week") => void;
  onViewScopeChange: (scope: ViewScope) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onMenuToggle: () => void;
  onDownloadWorklog?: () => void;
}

export default function CalendarHeader({
  workMonth,
  language,
  viewMode,
  viewScope,
  downloadDisabled,
  onPrevMonth,
  onNextMonth,
  onToday,
  onViewModeChange,
  onViewScopeChange,
  onMenuToggle,
  onDownloadWorklog,
}: CalendarHeaderProps) {
  const monthLabel =
    language === "ko" ? getWorkMonthLabelKo(workMonth) : getWorkMonthLabel(workMonth);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Mobile menu button */}
        <button onClick={onMenuToggle} className={styles.menuButton} aria-label="Open menu">
          <MenuIcon />
        </button>

        {/* Month/Year title */}
        <h1 className={styles.title}>{monthLabel}</h1>

        {/* Scope toggle: All / My schedule */}
        <div className={styles.scopeToggle} aria-label="Calendar scope">
          <button
            type="button"
            className={`${styles.scopeToggleButton} ${
              viewScope === "all" ? styles.scopeToggleButtonActive : ""
            }`}
            onClick={() => onViewScopeChange("all")}
          >
            {t(language, "calendar.all")}
          </button>
          <button
            type="button"
            className={`${styles.scopeToggleButton} ${
              viewScope === "me" ? styles.scopeToggleButtonActive : ""
            }`}
            onClick={() => onViewScopeChange("me")}
          >
            {t(language, "calendar.mySchedule")}
          </button>
        </div>
      </div>

      <div className={styles.right}>
        {onDownloadWorklog && (
          <button
            type="button"
            className={styles.downloadButton}
            onClick={onDownloadWorklog}
            disabled={downloadDisabled}
          >
            이번달 근무일지 다운로드
          </button>
        )}

        {/* View mode toggle */}
        <div className={styles.viewToggle} aria-label="Calendar view">
          <button
            type="button"
            className={`${styles.viewToggleButton} ${
              viewMode === "month" ? styles.viewToggleButtonActive : ""
            }`}
            onClick={() => onViewModeChange("month")}
          >
            {t(language, "calendar.month")}
          </button>
          <button
            type="button"
            className={`${styles.viewToggleButton} ${
              viewMode === "week" ? styles.viewToggleButtonActive : ""
            }`}
            onClick={() => onViewModeChange("week")}
          >
            {t(language, "calendar.week")}
          </button>
        </div>

        {/* Today button */}
        <button onClick={onToday} className={styles.todayButton}>
          {t(language, "calendar.today")}
        </button>

        {/* Navigation arrows */}
        <div className={styles.navGroup}>
          <button onClick={onPrevMonth} className={styles.navButton} aria-label="Previous month">
            <ChevronLeftIcon />
          </button>
          <button onClick={onNextMonth} className={styles.navButton} aria-label="Next month">
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,6 15,12 9,18" />
    </svg>
  );
}
