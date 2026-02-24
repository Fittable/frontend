"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Shift, User, getDisplayName, DisplayNamePreference } from "@/lib/types";
import { t, Language } from "@/lib/i18n";
import { formatDateStr } from "@/lib/workMonth";
import styles from "./ShiftEditorModal.module.css";

interface ShiftEditorModalProps {
  shift: Shift | null;
  date: string;
  /** Pre-selected dates from calendar (for multi-day selection) */
  selectedDates?: string[];
  /** All shifts on the selected date (used to detect full-day and set Full Day checked) */
  shiftsOnDate?: Shift[];
  /** All shifts (needed for multi-date deletion) */
  allShifts?: Shift[];
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
  language?: Language;
  displayNamePreference?: DisplayNamePreference;
  onSave: () => void;
  onClose: () => void;
  onDelete?: (shiftId: string, skipConfirmation?: boolean) => void;
}

// Break time (12:00–13:00) is always excluded when using direct input
const BREAK_START = "12:00";
const BREAK_END = "13:00";

// Direct-input time picker: hours 9 AM–5 PM (24h: 09–17), minutes 00, 15, 30, 45 only; end max 5:30 PM
const ALLOWED_HOURS = ["09", "10", "11", "12", "13", "14", "15", "16", "17"];
const ALLOWED_MINUTES = ["00", "15", "30", "45"];
const END_MINUTES_WHEN_17 = ["00", "15", "30"]; // 5:30 PM max

/** Snap HH:MM to nearest allowed minute (00, 15, 30, 45); keep hour in 9–17. End time capped at 17:30 */
function snapToAllowedTime(hhmm: string, isEnd = false): string {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  let hour = Math.max(9, Math.min(17, h ?? 9));
  let min = m ?? 0;
  let snappedMin = Math.round(min / 15) * 15;
  if (snappedMin === 60) {
    hour = Math.min(17, hour + 1);
    snappedMin = 0;
  }
  snappedMin = Math.min(45, snappedMin);
  if (isEnd && hour === 17 && snappedMin > 30) snappedMin = 30;
  const hourStr = String(hour).padStart(2, "0");
  const minuteStr = String(snappedMin).padStart(2, "0");
  return `${hourStr}:${minuteStr}`;
}

/** Parse "HH:MM" to minutes since midnight for comparison */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Split a custom time range into morning/afternoon segments, excluding 12:00–13:00 break.
 * e.g. 09:00–17:00 → [09:00–12:00, 13:00–17:00]; 09:00–11:00 → [09:00–11:00].
 */
function splitCustomTimeAcrossBreak(
  start: string,
  end: string
): { start: string; end: string }[] {
  const s = start.slice(0, 5);
  const e = end.slice(0, 5);
  const startMin = toMinutes(s);
  const endMin = toMinutes(e);
  const breakStartMin = toMinutes(BREAK_START);
  const breakEndMin = toMinutes(BREAK_END);

  const segments: { start: string; end: string }[] = [];

  // Range entirely within break (12:00–13:00): no work time
  if (startMin >= breakStartMin && endMin <= breakEndMin) {
    return [];
  }

  // Morning: from start up to 12:00 (only if range begins before 12:00 and has time before break)
  if (startMin < breakStartMin && endMin > breakStartMin) {
    segments.push({ start: s, end: BREAK_START });
  }
  // Afternoon: from 13:00 to end (only if range ends after 13:00 and has time after break)
  if (startMin < breakEndMin && endMin > breakEndMin) {
    segments.push({ start: BREAK_END, end: e });
  }
  // No split: range is entirely before 12:00, entirely after 13:00
  if (segments.length === 0) {
    segments.push({ start: s, end: e });
  }

  return segments;
}

// Time presets
const PRESETS = {
  normal: {
    morning: { start: "09:00", end: "12:00" },
    evening: { start: "13:00", end: "17:30" },
  },
  vacation: {
    morning: { start: "10:00", end: "12:00" },
    evening: { start: "13:00", end: "16:00" },
  },
};

export default function ShiftEditorModal({
  shift,
  date,
  selectedDates: preSelectedDates,
  shiftsOnDate = [],
  allShifts = [],
  users,
  isAdmin,
  currentUserId,
  language = "ko",
  displayNamePreference = "nickname",
  onSave,
  onClose,
  onDelete,
}: ShiftEditorModalProps) {
  // Independent toggles - can select any combination
  const [morningSelected, setMorningSelected] = useState(false);
  const [eveningSelected, setEveningSelected] = useState(false);
  const [customSelected, setCustomSelected] = useState(false);

  const [vacationMode, setVacationMode] = useState(false);
  const [customStart, setCustomStart] = useState("13:00");
  const [customEnd, setCustomEnd] = useState("14:45");
  const [userId, setUserId] = useState(currentUserId);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  // Multi-day selection: selected day indices within the week (0=Mon, 1=Tue, ..., 4=Fri)
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  // All selected dates (for multi-week selections from calendar)
  const [allSelectedDates, setAllSelectedDates] = useState<string[]>([]);

  // Normalize time to HH:MM:00 for API
  const toTime = (hhm: string) => (hhm.length === 5 ? `${hhm}:00` : hhm);

  // Get week dates (Mon-Fri) based on the selected date
  const getWeekDates = (anchorDate: string): Date[] => {
    const anchor = new Date(anchorDate + "T00:00:00");
    const dayOfWeek = anchor.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Monday-start: Mon=0, Tue=1, ..., Sun=6
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() + mondayOffset);
    
    const weekDates: Date[] = [];
    for (let i = 0; i < 5; i++) { // Mon-Fri only
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  // Initialize selected days when creating new shift
  useEffect(() => {
    if (!shift && date) {
      if (preSelectedDates && preSelectedDates.length > 0) {
        // Use pre-selected dates from calendar (multi-day selection)
        setAllSelectedDates(preSelectedDates);
        
        // Also set week-based selection for dates within the anchor week
        const weekDates = getWeekDates(date);
        const selectedIndices: number[] = [];
        preSelectedDates.forEach((selectedDateStr) => {
          const selectedDate = new Date(selectedDateStr + "T00:00:00");
          const dayIndex = weekDates.findIndex(
            (d) => d.toDateString() === selectedDate.toDateString()
          );
          if (dayIndex !== -1) {
            selectedIndices.push(dayIndex);
          }
        });
        setSelectedDays(selectedIndices.sort());
      } else {
        // Default: select the anchor date's day
        setAllSelectedDates([date]);
        const weekDates = getWeekDates(date);
        const anchorDate = new Date(date + "T00:00:00");
        const dayIndex = weekDates.findIndex(
          (d) => d.toDateString() === anchorDate.toDateString()
        );
        if (dayIndex !== -1) {
          setSelectedDays([dayIndex]);
        } else {
          setSelectedDays([]);
        }
      }
    } else if (shift) {
      // When editing, only select the current date
      setSelectedDays([]);
      setAllSelectedDates([]);
    }
  }, [shift, date, preSelectedDates]);

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays((prev) => {
      const newSelection = prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort();
      
      // Update allSelectedDates based on week selection
      const weekDates = getWeekDates(date);
      const newAllDates = newSelection.map((idx) => formatDateStr(weekDates[idx]));
      setAllSelectedDates(newAllDates);
      
      return newSelection;
    });
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setAllSelectedDates((prev) => {
      const newDates = prev.filter((d) => d !== dateToRemove);
      // Also update week-based selection
      const weekDates = getWeekDates(date);
      const selectedIndices: number[] = [];
      newDates.forEach((selectedDateStr) => {
        const selectedDate = new Date(selectedDateStr + "T00:00:00");
        const dayIndex = weekDates.findIndex(
          (d) => d.toDateString() === selectedDate.toDateString()
        );
        if (dayIndex !== -1) {
          selectedIndices.push(dayIndex);
        }
      });
      setSelectedDays(selectedIndices.sort());
      return newDates;
    });
  };

  // Detect preset from existing shift times
  const detectFromShift = (start: string, end: string) => {
    const s = start.slice(0, 5);
    const e = end.slice(0, 5);

    // Check if it matches morning preset
    if ((s === "09:00" || s === "10:00") && e === "12:00") {
      return { type: "morning" as const, vacation: s === "10:00" };
    }
    // Check if it matches evening preset
    if (s === "13:00" && (e === "17:30" || e === "16:00")) {
      return { type: "evening" as const, vacation: e === "16:00" };
    }
    // Custom
    return { type: "custom" as const, start: s, end: e };
  };

  useEffect(() => {
    if (shift) {
      // Editing: show all blocks this user has on this date (so Full Day shows when both exist)
      const sameUserOnDate = shiftsOnDate.filter((s) => s.user_id === shift.user_id);
      const detectedList = sameUserOnDate.map((s) => ({ shift: s, ...detectFromShift(s.start_time, s.end_time) }));
      const hasMorning = detectedList.some((d) => d.type === "morning");
      const hasEvening = detectedList.some((d) => d.type === "evening");
      const hasCustom = detectedList.some((d) => d.type === "custom");
      const anyVacation = detectedList.some((d) => d.vacation);

      setMorningSelected(hasMorning);
      setEveningSelected(hasEvening);
      setCustomSelected(hasCustom);
      setVacationMode(!!anyVacation);

      const customEntry = detectedList.find((d) => d.type === "custom");
      if (customEntry && customEntry.type === "custom") {
        setCustomStart(snapToAllowedTime(customEntry.start ?? "13:00"));
        setCustomEnd(snapToAllowedTime(customEntry.end ?? "14:45", true));
      }

      setUserId(shift.user_id);
    } else {
      // New shift - no selection by default
      setMorningSelected(false);
      setEveningSelected(false);
      setCustomSelected(false);
      setVacationMode(false);
      setCustomStart("13:00");
      setCustomEnd("14:45");
      setUserId(currentUserId);
    }
  }, [shift, currentUserId, shiftsOnDate]);

  // Toggle handlers - allow unchecking freely
  const handleMorningToggle = () => {
    setMorningSelected(!morningSelected);
  };

  const handleEveningToggle = () => {
    setEveningSelected(!eveningSelected);
  };

  const handleCustomToggle = () => {
    setCustomSelected(!customSelected);
  };

  const handleFullDaySelect = () => {
    const isCurrentlyFullDay = morningSelected && eveningSelected && !customSelected;
    if (isCurrentlyFullDay) {
      // Uncheck full day: uncheck both morning and evening
      setMorningSelected(false);
      setEveningSelected(false);
    } else {
      // Check full day: check both morning and evening, uncheck custom
      setMorningSelected(true);
      setEveningSelected(true);
      setCustomSelected(false);
    }
  };

  const handleDelete = async () => {
    const datesToDelete = (allSelectedDates.length > 0 ? allSelectedDates : [date]);
    const targetUserId = shift ? shift.user_id : userId;
    
    // Check if there are any shifts to delete
    const shiftsToDelete = allShifts.filter((s) => 
      datesToDelete.includes(s.date) && s.user_id === targetUserId
    );
    
    if (shiftsToDelete.length === 0) {
      const noShiftsMessage = language === "ko"
        ? "삭제할 근무가 없습니다."
        : "No shifts to delete.";
      setError(noShiftsMessage);
      return;
    }
    
    const confirmMessage = language === "ko" 
      ? shift
        ? "이 근무를 삭제하시겠습니까?"
        : `선택한 ${datesToDelete.length}일의 근무를 삭제하시겠습니까?`
      : shift
        ? "Are you sure you want to delete this shift?"
        : `Are you sure you want to delete shifts for ${datesToDelete.length} selected day(s)?`;
    
    if (!confirm(confirmMessage)) return;

    setDeleting(true);
    setError("");

    try {
      // Delete all shifts for the target user on all selected dates
      for (const s of shiftsToDelete) {
        await api.deleteShift(s.id);
      }
      // Refresh the shifts list and close modal
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate that at least one shift option is selected
    if (!shift && !morningSelected && !eveningSelected && !customSelected) {
      setError(t(language, "shifts.errorNoSelection"));
      return;
    }

    // When custom is selected, range must not be entirely within break (12:00–13:00)
    if (customSelected) {
      const customSegments = splitCustomTimeAcrossBreak(customStart, customEnd);
      if (customSegments.length === 0) {
        setError(t(language, "shifts.errorBreakTimeOnly"));
        return;
      }
    }

    // Validate that at least one day is available when creating new shift
    if (!shift && allSelectedDates.length === 0 && !date) {
      setError(t(language, "shifts.errorNoDaySelected"));
      return;
    }
    
    setLoading(true);

    const times = vacationMode ? PRESETS.vacation : PRESETS.normal;
    const snappedCustomStart = customSelected ? snapToAllowedTime(customStart) : "";
    const snappedCustomEnd = customSelected ? snapToAllowedTime(customEnd, true) : "";

    try {
      if (shift) {
        // Editing: reconcile so this user/date has exactly the selected blocks (morning / evening / custom).
        const sameUserOnDate = shiftsOnDate.filter((s) => s.user_id === shift.user_id);

        type BlockType = "morning" | "evening" | "custom";
        const existingByType: Record<BlockType, Shift | null> = {
          morning: null,
          evening: null,
          custom: null,
        };
        for (const s of sameUserOnDate) {
          const d = detectFromShift(s.start_time, s.end_time);
          if (d.type !== "custom" && !existingByType[d.type]) existingByType[d.type] = s;
          if (d.type === "custom" && !existingByType.custom) existingByType.custom = s;
        }

        interface DesiredBlock {
          type: BlockType;
          start: string;
          end: string;
        }
        const desired: DesiredBlock[] = [];
        if (morningSelected) desired.push({ type: "morning", start: times.morning.start, end: times.morning.end });
        if (eveningSelected) desired.push({ type: "evening", start: times.evening.start, end: times.evening.end });
        if (customSelected) {
          const customSegments = splitCustomTimeAcrossBreak(snappedCustomStart, snappedCustomEnd);
          for (const seg of customSegments) {
            desired.push({ type: "custom", start: seg.start, end: seg.end });
          }
        }

        const assignable = [...sameUserOnDate];
        const assigned = new Set<string>();
        const toUpdate: { id: string; start: string; end: string }[] = [];
        const toCreate: DesiredBlock[] = [];

        for (const block of desired) {
          const existing = existingByType[block.type];
          const candidate = existing && !assigned.has(existing.id) ? existing : assignable.find((s) => !assigned.has(s.id));
          if (candidate) {
            assigned.add(candidate.id);
            toUpdate.push({ id: candidate.id, start: block.start, end: block.end });
          } else {
            toCreate.push(block);
          }
        }

        const toDelete = sameUserOnDate.filter((s) => !assigned.has(s.id));

        for (const s of toDelete) {
          await api.deleteShift(s.id);
        }
        for (const { id, start, end } of toUpdate) {
          await api.updateShift(id, {
            start_time: toTime(start),
            end_time: toTime(end),
            user_id: isAdmin ? userId : undefined,
          });
        }
        for (const block of toCreate) {
          await api.createShift({
            date,
            start_time: toTime(block.start),
            end_time: toTime(block.end),
            user_id: isAdmin ? userId : undefined,
          });
        }
      } else {
        // Creating new shift(s) - create for each selected day and each selected time option
        // Use allSelectedDates if available (from calendar multi-selection), otherwise use the anchor date
        const datesToCreate = allSelectedDates.length > 0 
          ? allSelectedDates 
          : [date];

        for (const targetDate of datesToCreate) {
          if (morningSelected) {
            await api.createShift({
              date: targetDate,
              start_time: toTime(times.morning.start),
              end_time: toTime(times.morning.end),
              user_id: isAdmin ? userId : undefined,
            });
          }
          if (eveningSelected) {
            await api.createShift({
              date: targetDate,
              start_time: toTime(times.evening.start),
              end_time: toTime(times.evening.end),
              user_id: isAdmin ? userId : undefined,
            });
          }
          if (customSelected) {
            const customSegments = splitCustomTimeAcrossBreak(snappedCustomStart, snappedCustomEnd);
            for (const seg of customSegments) {
              await api.createShift({
                date: targetDate,
                start_time: toTime(seg.start),
                end_time: toTime(seg.end),
                user_id: isAdmin ? userId : undefined,
              });
            }
          }
        }
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString(
        language === "ko" ? "ko-KR" : "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      )
    : "";

  // Format all selected dates for display
  const formatSelectedDates = (dates: string[]): string => {
    if (dates.length === 0) return "";
    if (dates.length === 1) {
      const d = new Date(dates[0] + "T00:00:00");
      return d.toLocaleDateString(
        language === "ko" ? "ko-KR" : "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );
    }
    // Multiple dates: show count and first/last dates
    const first = new Date(dates[0] + "T00:00:00");
    const last = new Date(dates[dates.length - 1] + "T00:00:00");
    if (language === "ko") {
      return `${dates.length}일 선택됨 (${first.getMonth() + 1}/${first.getDate()} ~ ${last.getMonth() + 1}/${last.getDate()})`;
    } else {
      return `${dates.length} days selected (${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ~ ${last.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
    }
  };

  const times = vacationMode ? PRESETS.vacation : PRESETS.normal;

  // Count how many shifts will be created (custom can yield multiple segments across break)
  const customSegmentCount = customSelected ? splitCustomTimeAcrossBreak(customStart, customEnd).length : 0;
  const timeOptionCount = (morningSelected ? 1 : 0) + (eveningSelected ? 1 : 0) + customSegmentCount;
  const dayCount = shift ? 1 : (allSelectedDates.length > 0 ? allSelectedDates.length : 1);
  const shiftCount = timeOptionCount * dayCount;
  const isFullDay = morningSelected && eveningSelected && !customSelected;

  // Get summary of what will be created
  const getTimeSummary = () => {
    const parts: string[] = [];
    if (morningSelected) {
      parts.push(`${times.morning.start}–${times.morning.end}`);
    }
    if (eveningSelected) {
      parts.push(`${times.evening.start}–${times.evening.end}`);
    }
    if (customSelected) {
      const customSegments = splitCustomTimeAcrossBreak(customStart, customEnd);
      for (const seg of customSegments) {
        parts.push(`${seg.start}–${seg.end}`);
      }
    }
    return parts.join(", ");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {shift ? t(language, "shifts.editShiftTitle") : t(language, "shifts.newShiftTitle")}
          </h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Date display */}
          <div className={styles.field}>
            <label className={styles.label}>{t(language, "shifts.date")}</label>
            <div className={styles.dateDisplay}>
              {allSelectedDates.length > 0 
                ? formatSelectedDates(allSelectedDates)
                : formattedDate}
            </div>
          </div>

          {/* Selected dates list - show when multiple dates from calendar */}
          {!shift && allSelectedDates.length > 1 && (
            <div className={styles.field}>
              <label className={styles.label}>
                {t(language, "shifts.selectedDates")} ({allSelectedDates.length} {t(language, "shifts.daysSelected")})
              </label>
              <div className={styles.selectedDatesList}>
                {allSelectedDates.map((dateStr) => {
                  const d = new Date(dateStr + "T00:00:00");
                  const dayOfWeek = d.getDay();
                  const dayNamesFullKo = ["일", "월", "화", "수", "목", "금", "토"];
                  const dayNamesFullEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                  const dayName = language === "ko" ? dayNamesFullKo[dayOfWeek] : dayNamesFullEn[dayOfWeek];
                  return (
                    <div key={dateStr} className={styles.selectedDateItem}>
                      <span className={styles.selectedDateText}>
                        {d.toLocaleDateString(
                          language === "ko" ? "ko-KR" : "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )} ({dayName})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(dateStr)}
                        className={styles.removeDateBtn}
                        aria-label="Remove date"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* Worker select (admin only) */}
          {isAdmin && users.length > 0 && (
            <div className={styles.field}>
                <label className={styles.label}>{t(language, "shifts.assignTo")}</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={styles.select}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getDisplayName(u, displayNamePreference)} {u.role === "admin" ? "(admin)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hours Mode */}
          <div className={styles.field}>
            <label className={styles.label}>{t(language, "shifts.hours")}</label>
            <div className={styles.toggleRow}>
              <button
                type="button"
                onClick={() => setVacationMode(false)}
                className={`${styles.toggleBtn} ${!vacationMode ? styles.toggleActive : ""}`}
              >
                {t(language, "shifts.modeRegular")}
              </button>
              <button
                type="button"
                onClick={() => setVacationMode(true)}
                className={`${styles.toggleBtn} ${vacationMode ? styles.toggleActive : ""}`}
              >
                {t(language, "shifts.modeVacation")}
              </button>
            </div>
          </div>

          {/* Shift Selection - checkboxes style */}
          <div className={styles.field}>
            <label className={styles.label}>
              {t(language, "shifts.sectionShift")}{" "}
              {!shift && shiftCount > 1 && (
                <span className={styles.badge}>{`${shiftCount} ${t(
                  language,
                  "shifts.sectionShift"
                )}`}</span>
              )}
            </label>
            <div className={styles.shiftOptions}>
              {/* Morning */}
              <button
                type="button"
                onClick={handleMorningToggle}
                className={`${styles.shiftBtn} ${morningSelected ? styles.shiftActive : ""}`}
              >
                <span className={styles.checkbox}>{morningSelected ? "✓" : ""}</span>
                <div className={styles.shiftInfo}>
                  <span className={styles.shiftName}>{t(language, "shifts.morning")}</span>
                  <span className={styles.shiftTime}>{times.morning.start} – {times.morning.end}</span>
                </div>
              </button>

              {/* Evening */}
              <button
                type="button"
                onClick={handleEveningToggle}
                className={`${styles.shiftBtn} ${eveningSelected ? styles.shiftActive : ""}`}
              >
                <span className={styles.checkbox}>{eveningSelected ? "✓" : ""}</span>
                <div className={styles.shiftInfo}>
                  <span className={styles.shiftName}>{t(language, "shifts.evening")}</span>
                  <span className={styles.shiftTime}>{times.evening.start} – {times.evening.end}</span>
                </div>
              </button>

              {/* Full Day shortcut */}
              <button
                type="button"
                onClick={handleFullDaySelect}
                className={`${styles.shiftBtn} ${isFullDay ? styles.shiftActive : ""}`}
              >
                <span className={styles.checkbox}>{isFullDay ? "✓" : ""}</span>
                <div className={styles.shiftInfo}>
                  <span className={styles.shiftName}>{t(language, "shifts.fullDay")}</span>
                  <span className={styles.shiftTime}>{t(language, "shifts.fullDayDescription")}</span>
                </div>
              </button>

              {/* Custom */}
              <button
                type="button"
                onClick={handleCustomToggle}
                className={`${styles.shiftBtn} ${customSelected ? styles.shiftActive : ""}`}
              >
                <span className={styles.checkbox}>{customSelected ? "✓" : ""}</span>
                <div className={styles.shiftInfo}>
                  <span className={styles.shiftName}>{t(language, "shifts.custom")}</span>
                  <span className={styles.shiftTime}>
                    {customSelected ? `${customStart} – ${customEnd}` : t(language, "shifts.customTimeDescription")}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Time inputs - show when custom is selected (hours 9–17, minutes 00/15/30/45 only) */}
          {customSelected && (
            <div className={styles.field}>
              <label className={styles.label}>{t(language, "shifts.customTime")}</label>
              <div className={styles.timeRow}>
                <div className={styles.timeSelectGroup}>
                  <select
                    className={styles.select}
                    value={customStart.slice(0, 2)}
                    onChange={(e) => {
                      const h = e.target.value;
                      const m = customStart.slice(3, 5);
                      setCustomStart(`${h}:${m}`);
                    }}
                    aria-label="Start hour"
                  >
                    {ALLOWED_HOURS.map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                  <span className={styles.timeColon}>:</span>
                  <select
                    className={styles.select}
                    value={customStart.slice(3, 5)}
                    onChange={(e) => {
                      const h = customStart.slice(0, 2);
                      const m = e.target.value;
                      setCustomStart(`${h}:${m}`);
                    }}
                    aria-label="Start minute"
                  >
                    {ALLOWED_MINUTES.map((min) => (
                      <option key={min} value={min}>{min}</option>
                    ))}
                  </select>
                </div>
                <span className={styles.timeSeparator}>{t(language, "shifts.to")}</span>
                <div className={styles.timeSelectGroup}>
                  <select
                    className={styles.select}
                    value={customEnd.slice(0, 2)}
                    onChange={(e) => {
                      const h = e.target.value;
                      const endMins = h === "17" ? END_MINUTES_WHEN_17 : ALLOWED_MINUTES;
                      const curM = customEnd.slice(3, 5);
                      const m = endMins.includes(curM) ? curM : endMins[endMins.length - 1];
                      setCustomEnd(`${h}:${m}`);
                    }}
                    aria-label="End hour"
                  >
                    {ALLOWED_HOURS.map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                  <span className={styles.timeColon}>:</span>
                  <select
                    className={styles.select}
                    value={
                      customEnd.slice(0, 2) === "17" && !END_MINUTES_WHEN_17.includes(customEnd.slice(3, 5))
                        ? "30"
                        : customEnd.slice(3, 5)
                    }
                    onChange={(e) => {
                      const h = customEnd.slice(0, 2);
                      const m = e.target.value;
                      setCustomEnd(`${h}:${m}`);
                    }}
                    aria-label="End minute"
                  >
                    {(customEnd.slice(0, 2) === "17" ? END_MINUTES_WHEN_17 : ALLOWED_MINUTES).map((min) => (
                      <option key={min} value={min}>{min}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Time Summary */}
          <div className={styles.summary}>
            <span className={styles.summaryLabel}>
              {!shift && shiftCount > 1
                ? `${t(language, "shifts.summaryCreatingPrefix")}`
                : t(language, "shifts.summaryTimeLabel")}
            </span>
            <span className={styles.summaryValue}>{getTimeSummary()}</span>
          </div>

          {/* Error display */}
          {error && <div className={styles.error}>{error}</div>}

          {/* Action buttons */}
          <div className={styles.actions}>
            {(shift || (allSelectedDates.length > 0 && !shift)) && (
              <button
                type="button"
                onClick={handleDelete}
                className={styles.deleteButton}
                disabled={loading || deleting}
              >
                {deleting ? t(language, "shifts.deleting") : t(language, "shifts.delete")}
              </button>
            )}
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              {t(language, "shifts.cancel")}
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading || deleting}>
              {loading
                ? t(language, "shifts.saving")
                : shift
                ? t(language, "shifts.update")
                : t(language, "shifts.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
