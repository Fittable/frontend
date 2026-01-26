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

export default function ShiftEditorModal({
  shift,
  date,
  users,
  isAdmin,
  currentUserId,
  onSave,
  onClose,
}: ShiftEditorModalProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [userId, setUserId] = useState(currentUserId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shift) {
      setStartTime(shift.start_time.slice(0, 5));
      setEndTime(shift.end_time.slice(0, 5));
      setNote(shift.note || "");
      setUserId(shift.user_id);
    } else {
      setStartTime("09:00");
      setEndTime("17:00");
      setNote("");
      setUserId(currentUserId);
    }
  }, [shift, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (shift) {
        await api.updateShift(shift.id, {
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          note: note || undefined,
          user_id: isAdmin ? userId : undefined,
        });
      } else {
        await api.createShift({
          date,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          note: note || undefined,
          user_id: isAdmin ? userId : undefined,
        });
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {shift ? "Edit Shift" : "New Shift"}
          </h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Date display */}
          <div className={styles.field}>
            <label className={styles.label}>Date</label>
            <div className={styles.dateDisplay}>
              <CalendarIcon />
              <span>{formattedDate}</span>
            </div>
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

          {/* Time inputs */}
          <div className={styles.timeRow}>
            <div className={styles.field}>
              <label className={styles.label}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.timeSeparator}>
              <ArrowIcon />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Note input */}
          <div className={styles.field}>
            <label className={styles.label}>Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={styles.textarea}
              placeholder="Add a note about this shift..."
              rows={3}
            />
          </div>

          {/* Error display */}
          {error && (
            <div className={styles.error}>
              <ErrorIcon />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{shift ? "Update" : "Create"} Shift</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12,5 19,12 12,19" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
