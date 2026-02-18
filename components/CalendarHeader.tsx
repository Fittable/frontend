"use client";

import { WorkMonth, getWorkMonthLabel, getWorkMonthLabelKo } from "@/lib/workMonth";
import { t, Language } from "@/lib/i18n";
import styles from "./CalendarHeader.module.css";

export type ViewScope = "all" | "me";

interface CalendarHeaderProps {
  workMonth: WorkMonth;
  language: Language;
  viewMode: "month" | "week" | "day";
  viewScope: ViewScope;
  selectedDate?: string | null;
  downloadDisabled?: boolean;
  onViewModeChange: (mode: "month" | "week" | "day") => void;
  onViewScopeChange: (scope: ViewScope) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onMenuToggle: () => void;
  onDownloadWorklog?: () => void;
  onLanguageChange?: (lang: Language) => void;
}

export default function CalendarHeader({
  workMonth,
  language,
  viewMode,
  viewScope,
  selectedDate = null,
  downloadDisabled,
  onPrevMonth,
  onNextMonth,
  onToday,
  onViewModeChange,
  onViewScopeChange,
  onMenuToggle,
  onDownloadWorklog,
  onLanguageChange,
}: CalendarHeaderProps) {
  const monthLabel =
    language === "ko" ? getWorkMonthLabelKo(workMonth) : getWorkMonthLabel(workMonth);

  // Get current date for mobile header
  const currentDate = selectedDate 
    ? new Date(selectedDate + "T12:00:00")
    : new Date();
  const dayOfMonth = currentDate.getDate();
  const monthName = language === "ko" 
    ? `${currentDate.getMonth() + 1}월`
    : currentDate.toLocaleDateString("en-US", { month: "short" });

  // Format header label based on view mode
  const getHeaderLabel = () => {
    if (viewMode === "day") {
      const date = selectedDate 
        ? new Date(selectedDate + "T12:00:00")
        : new Date();
      if (language === "ko") {
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
      } else {
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      }
    }
    return monthLabel;
  };

  return (
    <header className={styles.header}>
      {/* Desktop layout */}
      <div className={styles.desktopLayout}>
        <div className={styles.left}>
          {/* Mobile menu button */}
          <button onClick={onMenuToggle} className={styles.menuButton} aria-label="Open menu">
            <MenuIcon />
          </button>

          {/* Month/Year title */}
          <h1 className={styles.title}>{getHeaderLabel()}</h1>

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
            <button
              type="button"
              className={`${styles.viewToggleButton} ${
                viewMode === "day" ? styles.viewToggleButtonActive : ""
              }`}
              onClick={() => onViewModeChange("day")}
            >
              {t(language, "calendar.day")}
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
      </div>

      {/* Mobile layout */}
      <div className={styles.mobileLayout}>
        <div className={styles.mobileTop}>
          <div className={styles.mobileTopLeft}>
            <button onClick={onMenuToggle} className={styles.mobileMenuButton} aria-label="Open menu">
              <MenuIcon />
            </button>
            <span className={styles.mobileDate}>{monthName} {dayOfMonth}{language === "ko" ? "일" : ""}</span>
          </div>
          <div className={styles.mobileTopRight}>
            {/* View scope toggle */}
            <div className={styles.mobileScopeToggle}>
              <button
                type="button"
                className={`${styles.mobileScopeButton} ${
                  viewScope === "all" ? styles.mobileScopeButtonActive : ""
                }`}
                onClick={() => onViewScopeChange("all")}
              >
                {t(language, "calendar.all")}
              </button>
              <button
                type="button"
                className={`${styles.mobileScopeButton} ${
                  viewScope === "me" ? styles.mobileScopeButtonActive : ""
                }`}
                onClick={() => onViewScopeChange("me")}
              >
                {t(language, "calendar.mySchedule")}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.mobileBottom}>
          <div className={styles.mobileCenter}>
            <div className={styles.mobileViewToggle}>
              <button
                type="button"
                className={`${styles.mobileViewButton} ${
                  viewMode === "month" ? styles.mobileViewButtonActive : ""
                }`}
                onClick={() => onViewModeChange("month")}
              >
                월
              </button>
              <button
                type="button"
                className={`${styles.mobileViewButton} ${
                  viewMode === "week" ? styles.mobileViewButtonActive : ""
                }`}
                onClick={() => onViewModeChange("week")}
              >
                주
              </button>
              <button
                type="button"
                className={`${styles.mobileViewButton} ${
                  viewMode === "day" ? styles.mobileViewButtonActive : ""
                }`}
                onClick={() => onViewModeChange("day")}
              >
                일
              </button>
            </div>
          </div>
          <div className={styles.mobileBottomRight}>
            {onDownloadWorklog && (
              <button
                type="button"
                className={styles.mobileDownloadButton}
                onClick={onDownloadWorklog}
                disabled={downloadDisabled}
                title="근무일지 다운로드"
              >
                <DownloadIcon />
              </button>
            )}
            <button onClick={onToday} className={styles.mobileTodayButton} title={t(language, "calendar.today")}>
              <TodayIcon />
            </button>
            <div className={styles.mobileNavGroup}>
              <button onClick={onPrevMonth} className={styles.mobileNavButton} aria-label="Previous">
                <ChevronLeftIcon />
              </button>
              <button onClick={onNextMonth} className={styles.mobileNavButton} aria-label="Next">
                <DoubleChevronRightIcon />
              </button>
            </div>
          </div>
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

function DoubleChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13,17 18,12 13,7" />
      <polyline points="6,17 11,12 6,7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TodayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}
