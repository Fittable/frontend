"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Shift, User } from "@/lib/types";
import styles from "./ShiftEditorModal.module.css";

interface ShiftEditorModalProps {
  existingShifts: Shift[]; // All shifts for the user on this date
  date: string;
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
  editingUserId?: string; // The user whose shifts we're editing (for edit mode)
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

// Detect shift type from times
function detectShiftType(start: string, end: string): { type: "morning" | "evening" | "custom"; vacation?: boolean; start?: string; end?: string } {
  const s = start.slice(0, 5);
  const e = end.slice(0, 5);

  // Check if it matches morning preset
  if ((s === "09:00" || s === "10:00") && e === "12:00") {
    return { type: "morning", vacation: s === "10:00" };
  }
  // Check if it matches evening preset
  if (s === "13:00" && (e === "17:30" || e === "16:00")) {
    return { type: "evening", vacation: e === "16:00" };
  }
  // Custom
  return { type: "custom", start: s, end: e };
}

export default function ShiftEditorModal({
  existingShifts,
  date,
  users,
  isAdmin,
  currentUserId,
  editingUserId,
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
  const [userId, setUserId] = useState(editingUserId || currentUserId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Track existing shift IDs for each type
  const [morningShiftId, setMorningShiftId] = useState<string | null>(null);
  const [eveningShiftId, setEveningShiftId] = useState<string | null>(null);
  const [customShiftId, setCustomShiftId] = useState<string | null>(null);

  const isEditMode = existingShifts.length > 0;

  useEffect(() => {
    if (isEditMode) {
      // Analyze existing shifts to determine state
      let hasMorning = false;
      let hasEvening = false;
      let hasCustom = false;
      let detectedVacation = false;
      let customStartTime = "13:00";
      let customEndTime = "14:45";
      let shiftNote = "";

      existingShifts.forEach((shift) => {
        const detected = detectShiftType(shift.start_time, shift.end_time);
        
        if (detected.type === "morning") {
          hasMorning = true;
          setMorningShiftId(shift.id);
          if (detected.vacation) detectedVacation = true;
        } else if (detected.type === "evening") {
          hasEvening = true;
          setEveningShiftId(shift.id);
          if (detected.vacation) detectedVacation = true;
        } else {
          hasCustom = true;
          setCustomShiftId(shift.id);
          customStartTime = detected.start || "13:00";
          customEndTime = detected.end || "14:45";
        }
        
        if (shift.note) shiftNote = shift.note;
      });

      setMorningSelected(hasMorning);
      setEveningSelected(hasEvening);
      setCustomSelected(hasCustom);
      setVacationMode(detectedVacation);
      setCustomStart(customStartTime);
      setCustomEnd(customEndTime);
      setNote(shiftNote);
      setUserId(editingUserId || currentUserId);
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
      setMorningShiftId(null);
      setEveningShiftId(null);
      setCustomShiftId(null);
    }
  }, [existingShifts, currentUserId, editingUserId, isEditMode]);

  // Simple toggles - can check/uncheck freely
  // If nothing is checked = no shifts (delete all)
  const handleMorningToggle = () => setMorningSelected(!morningSelected);
  const handleEveningToggle = () => setEveningSelected(!eveningSelected);
  const handleCustomToggle = () => setCustomSelected(!customSelected);

  const handleFullDaySelect = () => {
    // If already full day, clear all
    if (morningSelected && eveningSelected && !customSelected) {
      setMorningSelected(false);
      setEveningSelected(false);
    } else {
      setMorningSelected(true);
      setEveningSelected(true);
      setCustomSelected(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const times = vacationMode ? PRESETS.vacation : PRESETS.normal;
    const targetUserId = isAdmin ? userId : currentUserId;

    try {
      // Handle morning shift
      if (morningSelected) {
        if (morningShiftId) {
          // Update existing morning shift
          await api.updateShift(morningShiftId, {
            start_time: times.morning.start + ":00",
            end_time: times.morning.end + ":00",
            note: note || undefined,
          });
        } else {
          // Create new morning shift
          await api.createShift({
            date,
            start_time: times.morning.start + ":00",
            end_time: times.morning.end + ":00",
            note: note || undefined,
            user_id: isAdmin ? targetUserId : undefined,
          });
        }
      } else if (morningShiftId) {
        // Delete morning shift (was selected, now unchecked)
        await api.deleteShift(morningShiftId);
      }

      // Handle evening shift
      if (eveningSelected) {
        if (eveningShiftId) {
          // Update existing evening shift
          await api.updateShift(eveningShiftId, {
            start_time: times.evening.start + ":00",
            end_time: times.evening.end + ":00",
            note: note || undefined,
          });
        } else {
          // Create new evening shift
          await api.createShift({
            date,
            start_time: times.evening.start + ":00",
            end_time: times.evening.end + ":00",
            note: note || undefined,
            user_id: isAdmin ? targetUserId : undefined,
          });
        }
      } else if (eveningShiftId) {
        // Delete evening shift
        await api.deleteShift(eveningShiftId);
      }

      // Handle custom shift
      if (customSelected) {
        if (customShiftId) {
          // Update existing custom shift
          await api.updateShift(customShiftId, {
            start_time: customStart + ":00",
            end_time: customEnd + ":00",
            note: note || undefined,
          });
        } else {
          // Create new custom shift
          await api.createShift({
            date,
            start_time: customStart + ":00",
            end_time: customEnd + ":00",
            note: note || undefined,
            user_id: isAdmin ? targetUserId : undefined,
          });
        }
      } else if (customShiftId) {
        // Delete custom shift
        await api.deleteShift(customShiftId);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const times = vacationMode ? PRESETS.vacation : PRESETS.normal;

  // Count how many shifts will exist after save
  const shiftCount = (morningSelected ? 1 : 0) + (eveningSelected ? 1 : 0) + (customSelected ? 1 : 0);
  const isFullDay = morningSelected && eveningSelected && !customSelected;

  // Check if we're removing all shifts
  const isRemovingAll = shiftCount === 0 && isEditMode;

  // Get summary of times
  const getTimeSummary = () => {
    if (shiftCount === 0) {
      return isEditMode ? "Remove all shifts" : "Select a time";
    }
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

  // Get the username being edited
  const editingUsername = users.find(u => u.id === userId)?.username;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditMode ? "Edit Shifts" : "New Shift"}
            {isEditMode && editingUsername && (
              <span className={styles.subtitle}> – {editingUsername}</span>
            )}
          </h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Date display */}
          <div className={styles.field}>
            <label className={styles.label}>Date</label>
            <div className={styles.dateDisplay}>{formattedDate}</div>
          </div>

          {/* Worker select (admin only, only for new shifts) */}
          {isAdmin && users.length > 0 && !isEditMode && (
            <div className={styles.field}>
              <label className={styles.label}>Assign to</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={styles.select}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} {u.role === "admin" ? "(admin)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hours Mode */}
          <div className={styles.field}>
            <label className={styles.label}>Hours</label>
            <div className={styles.toggleRow}>
              <button
                type="button"
                onClick={() => setVacationMode(false)}
                className={`${styles.toggleBtn} ${!vacationMode ? styles.toggleActive : ""}`}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => setVacationMode(true)}
                className={`${styles.toggleBtn} ${vacationMode ? styles.toggleActive : ""}`}
              >
                Vacation
              </button>
            </div>
          </div>

          {/* Shift Selection - checkboxes style */}
          <div className={styles.field}>
            <label className={styles.label}>
              Shift {shiftCount > 1 && <span className={styles.badge}>{shiftCount} shifts</span>}
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
                  <span className={styles.shiftName}>Morning</span>
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
                  <span className={styles.shiftName}>Evening</span>
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
                  <span className={styles.shiftName}>Full Day</span>
                  <span className={styles.shiftTime}>Morning + Evening</span>
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
                  <span className={styles.shiftName}>Custom</span>
                  <span className={styles.shiftTime}>{customSelected ? `${customStart} – ${customEnd}` : "Add custom time"}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Time inputs - show when custom is selected */}
          {customSelected && (
            <div className={styles.field}>
              <label className={styles.label}>Custom Time</label>
              <div className={styles.timeRow}>
                <input
                  type="time"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className={styles.input}
                  required
                />
                <span className={styles.timeSeparator}>to</span>
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
          <div className={`${styles.summary} ${isRemovingAll ? styles.summaryWarning : ""}`}>
            <span className={styles.summaryLabel}>
              {shiftCount === 0 ? "" : shiftCount > 1 ? `${shiftCount} shifts:` : "Time:"}
            </span>
            <span className={`${styles.summaryValue} ${isRemovingAll ? styles.warningText : ""}`}>
              {getTimeSummary()}
            </span>
          </div>

          {/* Note input */}
          <div className={styles.field}>
            <label className={styles.label}>Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={styles.input}
              placeholder="Add a note..."
            />
          </div>

          {/* Error display */}
          {error && <div className={styles.error}>{error}</div>}

          {/* Action buttons */}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`${styles.saveButton} ${isRemovingAll ? styles.deleteButton : ""}`} 
              disabled={loading || (shiftCount === 0 && !isEditMode)}
            >
              {loading 
                ? "Saving..." 
                : isRemovingAll 
                  ? "Remove Shifts" 
                  : "Save"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
