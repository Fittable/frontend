"use client";

import { useState } from "react";
import {
  WorkMonth,
  getWorkMonthStartDate,
  getWorkMonthEndDate,
  getWorkMonthLabel,
  getWorkMonthLabelKo,
  getNextWorkMonth,
  getPrevWorkMonth,
  formatDateStr,
} from "@/lib/workMonth";
import { Language } from "@/lib/i18n";
import styles from "./MiniCalendar.module.css";

interface MiniCalendarProps {
  workMonth: WorkMonth;
  selectedDate: string | null;
  language?: Language;
  onDateSelect: (date: Date) => void;
}

export default function MiniCalendar({
  workMonth,
  selectedDate,
  language = "ko",
  onDateSelect,
}: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(workMonth);

  // Get start and end dates for the view month
  const startDate = getWorkMonthStartDate(viewMonth);
  const endDate = getWorkMonthEndDate(viewMonth);

  // Build array of dates
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Calculate padding for Monday start
  let startDayOfWeek = startDate.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const paddingBefore = startDayOfWeek;

  const totalDays = dates.length + paddingBefore;
  const totalWeeks = Math.ceil(totalDays / 7);
  const totalCells = totalWeeks * 7;
  const paddingAfter = totalCells - totalDays;

  const today = new Date();
  const todayStr = formatDateStr(today);

  const handlePrevMonth = () => {
    setViewMonth(getPrevWorkMonth(viewMonth));
  };

  const handleNextMonth = () => {
    setViewMonth(getNextWorkMonth(viewMonth));
  };

  const handleDayClick = (date: Date) => {
    onDateSelect(date);
  };

  const monthLabel =
    language === "ko" ? getWorkMonthLabelKo(viewMonth, true) : getWorkMonthLabel(viewMonth, true);

  const weekDays =
    language === "ko" ? ["월", "화", "수", "목", "금", "토", "일"] : ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={handlePrevMonth} className={styles.navButton} aria-label="Previous month">
          <ChevronLeftIcon />
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
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
        {/* Padding before */}
        {Array.from({ length: paddingBefore }).map((_, idx) => (
          <div key={`pad-${idx}`} className={styles.emptyDay} />
        ))}

        {/* Date cells */}
        {dates.map((date) => {
          const dateStr = formatDateStr(date);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isFirstMonth = date.getMonth() === viewMonth.startMonth;

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(date)}
              className={`${styles.day} ${isToday ? styles.today : ""} ${
                isSelected ? styles.selected : ""
              } ${!isFirstMonth ? styles.secondMonth : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}

        {/* Padding after */}
        {Array.from({ length: paddingAfter }).map((_, idx) => (
          <div key={`pad-after-${idx}`} className={styles.emptyDay} />
        ))}
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
