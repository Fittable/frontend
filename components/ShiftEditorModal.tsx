"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Shift, User } from "@/lib/types";
import { t, Language } from "@/lib/i18n";
import styles from "./ShiftEditorModal.module.css";

interface ShiftEditorModalProps {
  shift: Shift | null;
  date: string;
  /** All shifts on the selected date (used to detect full-day and set Full Day checked) */
  shiftsOnDate?: Shift[];
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
  language?: Language;
  onSave: () => void;
  onClose: () => void;
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
  shiftsOnDate = [],
  users,
  isAdmin,
  currentUserId,
  language = "ko",
  onSave,
  onClose,
}: ShiftEditorModalProps) {
  // Independent toggles - can select any combination
  const [morningSelected, setMorningSelected] = useState(false);
  const [eveningSelected, setEveningSelected] = useState(false);
  const [customSelected, setCustomSelected] = useState(false);

  const [vacationMode, setVacationMode] = useState(false);
  const [customStart, setCustomStart] = useState("13:00");
  const [customEnd, setCustomEnd] = useState("14:45");
  const [note, setNote] = useState("");
  const [userId, setUserId] = useState(currentUserId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Normalize time to HH:MM:00 for API
  const toTime = (hhm: string) => (hhm.length === 5 ? `${hhm}:00` : hhm);

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

      setNote(shift.note || "");
      setUserId(shift.user_id);
    } else {
      // New shift - default to morning
      setMorningSelected(true);
      setEveningSelected(false);
      setCustomSelected(false);
      setVacationMode(false);
      setCustomStart("13:00");
      setCustomEnd("14:45");
      setNote("");
      setUserId(currentUserId);
    }
  }, [shift, currentUserId, shiftsOnDate]);

  // Ensure at least one option is selected
  const handleMorningToggle = () => {
    const newValue = !morningSelected;
    // If turning off and nothing else selected, don't allow
    if (!newValue && !eveningSelected && !customSelected) return;
    setMorningSelected(newValue);
  };

  const handleEveningToggle = () => {
    const newValue = !eveningSelected;
    if (!newValue && !morningSelected && !customSelected) return;
    setEveningSelected(newValue);
  };

  const handleCustomToggle = () => {
    const newValue = !customSelected;
    if (!newValue && !morningSelected && !eveningSelected) return;
    setCustomSelected(newValue);
  };

  const handleFullDaySelect = () => {
    setMorningSelected(true);
    setEveningSelected(true);
    setCustomSelected(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        }
        for (const block of toCreate) {
          await api.createShift({
            date,
            start_time: toTime(block.start),
            end_time: toTime(block.end),
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        }
      } else {
        // Creating new shift(s) - create one for each selected option
        if (morningSelected) {
          await api.createShift({
            date,
            start_time: toTime(times.morning.start),
            end_time: toTime(times.morning.end),
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        }
        if (eveningSelected) {
          await api.createShift({
            date,
            start_time: toTime(times.evening.start),
            end_time: toTime(times.evening.end),
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        }
        if (customSelected) {
          await api.createShift({
            date,
            start_time: toTime(customStart),
            end_time: toTime(customEnd),
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
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

  const times = vacationMode ? PRESETS.vacation : PRESETS.normal;

  // Count how many shifts will be created
  const shiftCount = (morningSelected ? 1 : 0) + (eveningSelected ? 1 : 0) + (customSelected ? 1 : 0);
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
            <div className={styles.dateDisplay}>{formattedDate}</div>
          </div>

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
                    {u.name || u.student_id} {u.role === "admin" ? "(admin)" : ""}
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

          {/* Note input */}
          <div className={styles.field}>
            <label className={styles.label}>{t(language, "shifts.noteOptional")}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={styles.input}
              placeholder={t(language, "shifts.notePlaceholder")}
            />
          </div>

          {/* Error display */}
          {error && <div className={styles.error}>{error}</div>}

          {/* Action buttons */}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              {t(language, "shifts.cancel")}
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
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
