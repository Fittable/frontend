"use client";

import styles from "./CalendarHeader.module.css";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onMenuToggle: () => void;
}

export default function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onMenuToggle,
}: CalendarHeaderProps) {
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Mobile menu button */}
        <button onClick={onMenuToggle} className={styles.menuButton} aria-label="Open menu">
          <MenuIcon />
        </button>

        {/* Month/Year title */}
        <h1 className={styles.title}>{monthYear}</h1>
      </div>

      <div className={styles.right}>
        {/* View mode dropdown (Month only for MVP, but styled for future) */}
        <div className={styles.viewSelector}>
          <button className={styles.viewButton}>
            <span>Month</span>
            <ChevronDownIcon />
          </button>
        </div>

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

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

