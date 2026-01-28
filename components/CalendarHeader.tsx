"use client";

import { WorkMonth, getWorkMonthLabel } from "@/lib/workMonth";
import styles from "./CalendarHeader.module.css";

interface CalendarHeaderProps {
  workMonth: WorkMonth;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onMenuToggle: () => void;
}

export default function CalendarHeader({
  workMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onMenuToggle,
}: CalendarHeaderProps) {
  const monthLabel = getWorkMonthLabel(workMonth);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Mobile menu button */}
        <button onClick={onMenuToggle} className={styles.menuButton} aria-label="Open menu">
          <MenuIcon />
        </button>

        {/* Month/Year title */}
        <h1 className={styles.title}>{monthLabel}</h1>
      </div>

      <div className={styles.right}>
        {/* Today button */}
        <button onClick={onToday} className={styles.todayButton}>
          Today
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
