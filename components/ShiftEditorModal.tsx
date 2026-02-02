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

  // Detect preset from existing shift times
  const detectFromShift = (start: string, end: string) => {
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
  };

  useEffect(() => {
    if (shift) {
      // Editing existing shift
      const detected = detectFromShift(shift.start_time, shift.end_time);
      setMorningSelected(detected.type === "morning");
      setEveningSelected(detected.type === "evening");
      setCustomSelected(detected.type === "custom");
      setVacationMode(detected.vacation || false);
      if (detected.type === "custom") {
        setCustomStart(detected.start || "13:00");
        setCustomEnd(detected.end || "14:45");
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
  }, [shift, currentUserId]);

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
        // Editing existing shift - update with first selected option
        let startTime: string, endTime: string;

        if (morningSelected) {
          startTime = times.morning.start;
          endTime = times.morning.end;
        } else if (eveningSelected) {
          startTime = times.evening.start;
          endTime = times.evening.end;
        } else {
          startTime = customStart;
          endTime = customEnd;
        }

        await api.updateShift(shift.id, {
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          note: note || undefined,
          user_id: isAdmin ? userId : undefined,
        });
      } else {
        // Creating new shift(s) - create one for each selected option
        if (morningSelected) {
          await api.createShift({
            date,
            start_time: times.morning.start + ":00",
            end_time: times.morning.end + ":00",
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        }

        if (eveningSelected) {
          await api.createShift({
            date,
            start_time: times.evening.start + ":00",
            end_time: times.evening.end + ":00",
            note: note || undefined,
            user_id: isAdmin ? userId : undefined,
          });
        }

        if (customSelected) {
          await api.createShift({
            date,
            start_time: customStart + ":00",
            end_time: customEnd + ":00",
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

          {/* Shift Selection - checkboxes style */}
          <div className={styles.field}>
            <label className={styles.label}>
              Shift {!shift && shiftCount > 1 && <span className={styles.badge}>{shiftCount} shifts</span>}
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
          <div className={styles.summary}>
            <span className={styles.summaryLabel}>
              {!shift && shiftCount > 1 ? `Creating ${shiftCount} shifts:` : "Time:"}
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
              {loading ? "Saving..." : shift ? "Update" : shiftCount > 1 ? `Create ${shiftCount} Shifts` : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
