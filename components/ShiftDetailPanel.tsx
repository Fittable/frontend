"use client";

import { Shift, User } from "@/lib/types";
import { getWorkerColor } from "./Sidebar";
import styles from "./ShiftDetailPanel.module.css";

interface ShiftDetailPanelProps {
  selectedDate: string | null;
  shifts: Shift[];
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
  onAddShift: () => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onClose: () => void;
}

export default function ShiftDetailPanel({
  selectedDate,
  shifts,
  users,
  isAdmin,
  currentUserId,
  onAddShift,
  onEditShift,
  onDeleteShift,
  onClose,
}: ShiftDetailPanelProps) {
  if (!selectedDate) return null;

  // Build user index map
  const userIndexMap = new Map<string, number>();
  users.forEach((u, idx) => {
    userIndexMap.set(u.id, idx);
  });

  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  const formatTime = (time: string) => time.slice(0, 5);

  const canModify = (shift: Shift) => {
    return isAdmin || shift.user_id === currentUserId;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.date}>{formattedDate}</h2>
          <span className={styles.shiftCount}>
            {shifts.length} shift{shifts.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button onClick={onClose} className={styles.closeButton} aria-label="Close panel">
          <CloseIcon />
        </button>
      </div>

      <div className={styles.content}>
        {shifts.length === 0 ? (
          <div className={styles.empty}>
            <CalendarIcon />
            <p>No shifts scheduled</p>
            <button onClick={onAddShift} className={styles.addButtonEmpty}>
              Add a shift
            </button>
          </div>
        ) : (
          <div className={styles.shiftList}>
            {shifts.map((shift) => {
              const userIdx = userIndexMap.get(shift.user_id) ?? 0;
              const color = getWorkerColor(userIdx);

              return (
                <div key={shift.id} className={styles.shiftItem}>
                  <div
                    className={styles.shiftColor}
                    style={{ backgroundColor: color }}
                  />
                  <div className={styles.shiftDetails}>
                    <div className={styles.shiftTime}>
                      {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                    </div>
                    {isAdmin && shift.username && (
                      <div className={styles.shiftWorker}>{shift.username}</div>
                    )}
                    {shift.note && (
                      <div className={styles.shiftNote}>{shift.note}</div>
                    )}
                  </div>
                  {canModify(shift) && (
                    <div className={styles.shiftActions}>
                      <button
                        onClick={() => onEditShift(shift)}
                        className={styles.actionButton}
                        aria-label="Edit shift"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => onDeleteShift(shift.id)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        aria-label="Delete shift"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button onClick={onAddShift} className={styles.addButton}>
          <PlusIcon />
          <span>Add Shift</span>
        </button>
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

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

