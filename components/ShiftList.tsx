"use client";

import { Shift } from "@/lib/types";
import { t, Language } from "@/lib/i18n";

interface ShiftListProps {
  shifts: Shift[];
  isAdmin: boolean;
  currentUserId: string;
  onEdit: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
  language?: Language;
}

export default function ShiftList({
  shifts,
  isAdmin,
  currentUserId,
  onEdit,
  onDelete,
  language = "ko",
}: ShiftListProps) {
  if (shifts.length === 0) {
    return <p style={styles.empty}>{t(language, "shifts.none")}</p>;
  }

  const formatTime = (time: string) => {
    // time is HH:MM:SS, display as HH:MM
    return time.slice(0, 5);
  };

  const canModify = (shift: Shift) => {
    return isAdmin || shift.user_id === currentUserId;
  };

  return (
    <div style={styles.list}>
      {shifts.map((shift) => (
        <div key={shift.id} style={styles.item}>
          <div style={styles.itemMain}>
            <div style={styles.time}>
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
            </div>
            {isAdmin && shift.name && (
              <div style={styles.username}>{shift.name}</div>
            )}
            {shift.note && <div style={styles.note}>{shift.note}</div>}
          </div>
          {canModify(shift) && (
            <div style={styles.actions}>
              <button onClick={() => onEdit(shift)} style={styles.editBtn}>
                {t(language, "shifts.edit")}
              </button>
              <button
                onClick={() => onDelete(shift.id)}
                style={styles.deleteBtn}
              >
                ×
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  empty: {
    color: "#999",
    textAlign: "center",
    padding: "1rem 0",
    fontSize: "0.875rem",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "0.75rem",
    background: "#f9f9f9",
    borderRadius: "4px",
    border: "1px solid #eee",
  },
  itemMain: {
    flex: 1,
  },
  time: {
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  username: {
    fontSize: "0.75rem",
    color: "#666",
    marginTop: "0.125rem",
  },
  note: {
    fontSize: "0.75rem",
    color: "#888",
    marginTop: "0.25rem",
  },
  actions: {
    display: "flex",
    gap: "0.25rem",
  },
  editBtn: {
    padding: "0.25rem 0.5rem",
    fontSize: "0.75rem",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: "3px",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "0.25rem 0.5rem",
    fontSize: "0.875rem",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: "3px",
    cursor: "pointer",
    color: "#c00",
  },
};

