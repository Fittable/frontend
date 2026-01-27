"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Shift, User } from "@/lib/types";
import styles from "./ShiftEditorModal.module.css";

interface ShiftEditorModalProps {
  shift: Shift | null;
  date: string;
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
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
  users,
  isAdmin,
  currentUserId,
  onSave,
  onClose,
}: ShiftEditorModalProps) {
  // Selection state - can select multiple
  const [morningSelected, setMorningSelected] = useState(true);
  const [eveningSelected, setEveningSelected] = useState(false);
  const [customSelected, setCustomSelected] = useState(false);
  
  const [vacationMode, setVacationMode] = useState(false);
  const [customStart, setCustomStart] = useState("09:00");
  const [customEnd, setCustomEnd] = useState("12:00");
  const [note, setNote] = useState("");
  const [userId, setUserId] = useState(currentUserId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Detect preset from existing shift times
  const detectFromShift = (start: string, end: string) => {
    const s = start.slice(0, 5);
    const e = end.slice(0, 5);
    
    // Check if it matches morning preset
    if ((s === "09:00" || s === "10:00") && e === "12:00") {
      return { morning: true, evening: false, vacation: s === "10:00" };
    }
    // Check if it matches evening preset
    if (s === "13:00" && (e === "17:30" || e === "16:00")) {
      return { morning: false, evening: true, vacation: e === "16:00" };
    }
    // Custom
    return { morning: false, evening: false, custom: true, start: s, end: e };
  };

  useEffect(() => {
    if (shift) {
      const detected = detectFromShift(shift.start_time, shift.end_time);
      setMorningSelected(detected.morning);
      setEveningSelected(detected.evening);
      setCustomSelected(!detected.morning && !detected.evening);
      setVacationMode(detected.vacation || false);
      if (detected.custom) {
        setCustomStart(detected.start || "09:00");
        setCustomEnd(detected.end || "17:00");
      }
      setNote(shift.note || "");
      setUserId(shift.user_id);
    } else {
      setMorningSelected(true);
      setEveningSelected(false);
      setCustomSelected(false);
      setVacationMode(false);
      setCustomStart("09:00");
      setCustomEnd("12:00");
      setNote("");
      setUserId(currentUserId);
    }
  }, [shift, currentUserId]);

  // Toggle handlers
  const handleMorningToggle = () => {
    if (customSelected) {
      setCustomSelected(false);
      setMorningSelected(true);
    } else {
      setMorningSelected(!morningSelected);
      // Ensure at least one is selected
      if (morningSelected && !eveningSelected) {
        setEveningSelected(true);
      }
    }
  };

  const handleEveningToggle = () => {
    if (customSelected) {
      setCustomSelected(false);
      setEveningSelected(true);
    } else {
      setEveningSelected(!eveningSelected);
      // Ensure at least one is selected
      if (eveningSelected && !morningSelected) {
        setMorningSelected(true);
      }
    }
  };

  const handleFullDaySelect = () => {
    setMorningSelected(true);
    setEveningSelected(true);
    setCustomSelected(false);
  };

  const handleCustomSelect = () => {
    setCustomSelected(true);
    setMorningSelected(false);
    setEveningSelected(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const times = vacationMode ? PRESETS.vacation : PRESETS.normal;

    try {
      if (shift) {
        // Editing existing shift - just update with selected time
        let startTime: string, endTime: string;
        
        if (customSelected) {
          startTime = customStart;
          endTime = customEnd;
        } else if (morningSelected && !eveningSelected) {
          startTime = times.morning.start;
          endTime = times.morning.end;
        } else if (eveningSelected && !morningSelected) {
          startTime = times.evening.start;
          endTime = times.evening.end;
        } else {
          // Full day - for edit, default to morning (user can't edit to create 2 shifts)
          startTime = times.morning.start;
          endTime = times.morning.end;
        }

        await api.updateShift(shift.id, {
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          note: note || undefined,
          user_id: isAdmin ? userId : undefined,
        });
      } else {
        // Creating new shift(s)
        if (customSelected) {
          // Single custom shift
          await api.createShift({
            date,
            start_time: customStart + ":00",
            end_time: customEnd + ":00",
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        } else if (morningSelected && eveningSelected) {
          // Create both morning and evening shifts
          await api.createShift({
            date,
            start_time: times.morning.start + ":00",
            end_time: times.morning.end + ":00",
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
          await api.createShift({
            date,
            start_time: times.evening.start + ":00",
            end_time: times.evening.end + ":00",
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        } else if (morningSelected) {
          await api.createShift({
            date,
            start_time: times.morning.start + ":00",
            end_time: times.morning.end + ":00",
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        } else if (eveningSelected) {
          await api.createShift({
            date,
            start_time: times.evening.start + ":00",
            end_time: times.evening.end + ":00",
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
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const times = vacationMode ? PRESETS.vacation : PRESETS.normal;
  const isFullDay = morningSelected && eveningSelected && !customSelected;

  // Get summary of what will be created
  const getTimeSummary = () => {
    if (customSelected) {
      return `${customStart} – ${customEnd}`;
    }
    if (isFullDay) {
      return `${times.morning.start} – ${times.morning.end}, ${times.evening.start} – ${times.evening.end}`;
    }
    if (morningSelected) {
      return `${times.morning.start} – ${times.morning.end}`;
    }
    if (eveningSelected) {
      return `${times.evening.start} – ${times.evening.end}`;
    }
    return "";
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {shift ? "Edit Shift" : "New Shift"}
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

          {/* Worker select (admin only) */}
          {isAdmin && users.length > 0 && (
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

          {/* Shift Selection */}
          <div className={styles.field}>
            <label className={styles.label}>Shift</label>
            <div className={styles.shiftOptions}>
              {/* Morning */}
              <button
                type="button"
                onClick={handleMorningToggle}
                className={`${styles.shiftBtn} ${morningSelected && !customSelected ? styles.shiftActive : ""}`}
              >
                <span className={styles.shiftName}>Morning</span>
                <span className={styles.shiftTime}>{times.morning.start} – {times.morning.end}</span>
              </button>

              {/* Evening */}
              <button
                type="button"
                onClick={handleEveningToggle}
                className={`${styles.shiftBtn} ${eveningSelected && !customSelected ? styles.shiftActive : ""}`}
              >
                <span className={styles.shiftName}>Evening</span>
                <span className={styles.shiftTime}>{times.evening.start} – {times.evening.end}</span>
              </button>

              {/* Full Day */}
              <button
                type="button"
                onClick={handleFullDaySelect}
                className={`${styles.shiftBtn} ${isFullDay ? styles.shiftActive : ""}`}
              >
                <span className={styles.shiftName}>Full Day</span>
                <span className={styles.shiftTime}>Morning + Evening (lunch 12–1)</span>
              </button>

              {/* Custom */}
              <button
                type="button"
                onClick={handleCustomSelect}
                className={`${styles.shiftBtn} ${customSelected ? styles.shiftActive : ""}`}
              >
                <span className={styles.shiftName}>Custom</span>
                <span className={styles.shiftTime}>Set your own time</span>
              </button>
            </div>
          </div>

          {/* Custom Time inputs - only show when custom is selected */}
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
          <div className={styles.summary}>
            <span className={styles.summaryLabel}>
              {isFullDay && !shift ? "Creating 2 shifts:" : "Time:"}
            </span>
            <span className={styles.summaryValue}>{getTimeSummary()}</span>
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
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? "Saving..." : shift ? "Update" : isFullDay ? "Create 2 Shifts" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
