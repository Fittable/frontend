"use client";

import { useState } from "react";
import styles from "./MiniCalendar.module.css";

interface MiniCalendarProps {
  currentDate: Date;
  selectedDate: string | null;
  onDateSelect: (date: Date) => void;
}

export default function MiniCalendar({
  currentDate,
  selectedDate,
  onDateSelect,
}: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Calculate calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Start from Monday (1) instead of Sunday (0)
  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1; // Adjust for Monday start

  // Previous month days to show
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays: number[] = [];
  for (let i = startDay - 1; i >= 0; i--) {
    prevMonthDays.push(prevMonthLastDay - i);
  }

  // Current month days
  const currentMonthDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentMonthDays.push(d);
  }

  // Next month days to fill remaining cells (ensure 6 rows)
  const totalCells = 42; // 6 rows x 7 days
  const nextMonthDaysCount = totalCells - prevMonthDays.length - currentMonthDays.length;
  const nextMonthDays: number[] = [];
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    nextMonthDays.push(d);
  }

  // Format date string for comparison
  const formatDateStr = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number, monthOffset: number) => {
    const newDate = new Date(year, month + monthOffset, day);
    onDateSelect(newDate);
    if (monthOffset !== 0) {
      setViewDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const monthYearLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={handlePrevMonth} className={styles.navButton} aria-label="Previous month">
          <ChevronLeftIcon />
        </button>
        <span className={styles.monthLabel}>{monthYearLabel}</span>
        <button onClick={handleNextMonth} className={styles.navButton} aria-label="Next month">
          <ChevronRightIcon />
        </button>
      </div>

      {/* Weekday headers */}
      <div className={styles.weekdays}>
        {weekDays.map((day, i) => (
          <div key={i} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.grid}>
        {/* Previous month days */}
        {prevMonthDays.map((day) => {
          const dateStr = formatDateStr(
            month === 0 ? year - 1 : year,
            month === 0 ? 11 : month - 1,
            day
          );
          return (
            <button
              key={`prev-${day}`}
              onClick={() => handleDayClick(day, -1)}
              className={`${styles.day} ${styles.otherMonth} ${
                dateStr === selectedDate ? styles.selected : ""
              }`}
            >
              {day}
            </button>
          );
        })}

        {/* Current month days */}
        {currentMonthDays.map((day) => {
          const dateStr = formatDateStr(year, month, day);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={`curr-${day}`}
              onClick={() => handleDayClick(day, 0)}
              className={`${styles.day} ${isToday ? styles.today : ""} ${
                isSelected ? styles.selected : ""
              }`}
            >
              {day}
            </button>
          );
        })}

        {/* Next month days */}
        {nextMonthDays.map((day) => {
          const dateStr = formatDateStr(
            month === 11 ? year + 1 : year,
            month === 11 ? 0 : month + 1,
            day
          );
          return (
            <button
              key={`next-${day}`}
              onClick={() => handleDayClick(day, 1)}
              className={`${styles.day} ${styles.otherMonth} ${
                dateStr === selectedDate ? styles.selected : ""
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,6 15,12 9,18" />
    </svg>
  );
}

