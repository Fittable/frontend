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
        setCustomStart(customEntry.start ?? "13:00");
        setCustomEnd(customEntry.end ?? "14:45");
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

    // Validate that at least one day is selected when creating new shift
    if (!shift && allSelectedDates.length === 0 && selectedDays.length === 0) {
      setError(t(language, "shifts.errorNoDaySelected"));
      return;
    }
    
    setLoading(true);

    const times = vacationMode ? PRESETS.vacation : PRESETS.normal;

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
        if (customSelected) desired.push({ type: "custom", start: customStart, end: customEnd });

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
        // Use allSelectedDates if available (from calendar multi-selection), otherwise use week-based selection
        const datesToCreate = allSelectedDates.length > 0 
          ? allSelectedDates 
          : selectedDays.map((dayIndex) => formatDateStr(getWeekDates(date)[dayIndex]));

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
            await api.createShift({
              date: targetDate,
              start_time: toTime(customStart),
              end_time: toTime(customEnd),
              user_id: isAdmin ? userId : undefined,
            });
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

  // Count how many shifts will be created
  const timeOptionCount = (morningSelected ? 1 : 0) + (eveningSelected ? 1 : 0) + (customSelected ? 1 : 0);
  const dayCount = shift ? 1 : (allSelectedDates.length > 0 ? allSelectedDates.length : selectedDays.length);
  const shiftCount = timeOptionCount * dayCount;
  const isFullDay = morningSelected && eveningSelected && !customSelected;

  // Get week dates for day selection
  const weekDates = date ? getWeekDates(date) : [];
  const dayNamesKo = ["월", "화", "수", "목", "금"];
  const dayNamesEn = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dayNames = language === "ko" ? dayNamesKo : dayNamesEn;

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
      parts.push(`${customStart}–${customEnd}`);
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

          {/* Day selection - only show when creating new shift and not showing multi-week selection */}
          {!shift && allSelectedDates.length <= 1 && (
            <div className={styles.field}>
              <label className={styles.label}>
                {t(language, "shifts.selectDays")}
                {selectedDays.length > 0 && (
                  <span className={styles.badge}>
                    {selectedDays.length} {t(language, "shifts.daysSelected")}
                  </span>
                )}
              </label>
              <div className={styles.daySelection}>
                {weekDates.map((weekDate, index) => {
                  const isSelected = selectedDays.includes(index);
                  const dateStr = formatDateStr(weekDate);
                  const dayName = dayNames[index];
                  const dayNumber = weekDate.getDate();
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDayToggle(index)}
                      className={`${styles.dayBtn} ${isSelected ? styles.dayBtnActive : ""}`}
                    >
                      <span className={styles.checkbox}>{isSelected ? "✓" : ""}</span>
                      <div className={styles.dayInfo}>
                        <span className={styles.dayName}>{dayName}</span>
                        <span className={styles.dayNumber}>{dayNumber}</span>
                      </div>
                    </button>
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

          {/* Custom Time inputs - show when custom is selected */}
          {customSelected && (
            <div className={styles.field}>
              <label className={styles.label}>{t(language, "shifts.customTime")}</label>
              <div className={styles.timeRow}>
                <input
                  type="time"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className={styles.input}
                  required
                />
                <span className={styles.timeSeparator}>{t(language, "shifts.to")}</span>
                <input
                  type="time"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className={styles.input}
                  required
                />
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
