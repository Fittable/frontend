"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Shift, User } from "@/lib/types";

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
        // Update existing
        await api.updateShift(shift.id, {
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          note: note || undefined,
          user_id: isAdmin ? userId : undefined,
        });
      } else {
        // Create new
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

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>{shift ? "Edit Shift" : "Add Shift"}</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Date</label>
            <input type="text" value={date} disabled style={styles.input} />
          </div>

          {isAdmin && users.length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}>Assign to</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={styles.input}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={styles.input}
              placeholder="Add a note..."
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" style={styles.saveBtn} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    borderBottom: "1px solid #eee",
  },
  closeBtn: {
    border: "none",
    background: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
    padding: 0,
    lineHeight: 1,
  },
  form: {
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  row: {
    display: "flex",
    gap: "1rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  input: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  error: {
    color: "#c00",
    margin: 0,
    fontSize: "0.875rem",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  cancelBtn: {
    padding: "0.5rem 1rem",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: "4px",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "0.5rem 1rem",
    border: "none",
    background: "#333",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

