"use client";

import { Shift, User, getDisplayName, DisplayNamePreference } from "@/lib/types";
import { getWorkerColor } from "./Sidebar";
import { t, Language } from "@/lib/i18n";
import styles from "./ShiftDetailPanel.module.css";

interface ShiftDetailPanelProps {
  selectedDate: string | null;
  shifts: Shift[];
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
  language?: Language;
  displayNamePreference?: DisplayNamePreference;
  onAddShift: () => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onClose: () => void;
}

// Group shifts by user
type UserShifts = {
  userId: string;
  name: string;
  shifts: Shift[];
};

function groupShiftsByUser(
  shifts: Shift[],
  users: User[],
  displayNamePreference: DisplayNamePreference = "nickname"
): UserShifts[] {
  const userMap = new Map<string, User>();
  users.forEach((u) => userMap.set(u.id, u));

  const grouped = new Map<string, UserShifts>();

  shifts.forEach((shift) => {
    const existing = grouped.get(shift.user_id);
    if (existing) {
      existing.shifts.push(shift);
    } else {
      const user = userMap.get(shift.user_id);
      const displayName = user ? getDisplayName(user, displayNamePreference) : (shift.name || "Unknown");
      grouped.set(shift.user_id, {
        userId: shift.user_id,
        name: displayName,
        shifts: [shift],
      });
    }
  });

  grouped.forEach((userShifts) => {
    userShifts.shifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  return Array.from(grouped.values());
}

export default function ShiftDetailPanel({
  selectedDate,
  shifts,
  users,
  isAdmin,
  currentUserId,
  language = "ko",
  displayNamePreference = "nickname",
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
    language === "ko" ? "ko-KR" : "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  const formatTime = (time: string) => time.slice(0, 5);

  const groupedShifts = groupShiftsByUser(shifts, users, displayNamePreference);

  const canModify = (userId: string) => {
    return isAdmin || userId === currentUserId;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.date}>{formattedDate}</h2>
          <span className={styles.shiftCount}>
            {language === "ko"
              ? `${groupedShifts.length}명, ${shifts.length}개 근무`
              : `${groupedShifts.length} ${
                  groupedShifts.length === 1 ? "person" : "people"
                }, ${shifts.length} shift${shifts.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <button onClick={onClose} className={styles.closeButton} aria-label="Close panel">
          ×
        </button>
      </div>

      <div className={styles.content}>
        {groupedShifts.length === 0 ? (
          <div className={styles.empty}>
            <p>{t(language, "shifts.none")}</p>
            <button onClick={onAddShift} className={styles.addButtonEmpty}>
              {t(language, "shifts.add")}
            </button>
          </div>
        ) : (
          <div className={styles.shiftList}>
            {groupedShifts.map((userShifts) => {
              const userIdx = userIndexMap.get(userShifts.userId) ?? 0;
              const color = getWorkerColor(userIdx);
              
              // Combine times for display
              const timesDisplay = userShifts.shifts
                .map(s => `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`)
                .join(", ");

              // Get notes if any
              const notes = userShifts.shifts
                .filter(s => s.note)
                .map(s => s.note)
                .join("; ");

              return (
                <div key={userShifts.userId} className={styles.shiftItem}>
                  <div
                    className={styles.shiftColor}
                    style={{ backgroundColor: color }}
                  />
                  <div className={styles.shiftDetails}>
                    {isAdmin && (
                      <div className={styles.shiftWorker}>{userShifts.name}</div>
                    )}
                    <div className={styles.shiftTime}>{timesDisplay}</div>
                    {notes && (
                      <div className={styles.shiftNote}>{notes}</div>
                    )}
                  </div>
                  {canModify(userShifts.userId) && (
                    <div className={styles.shiftActions}>
                      {userShifts.shifts.map((shift, idx) => (
                        <button
                          key={shift.id}
                          onClick={() => onEditShift(shift)}
                          className={styles.actionButton}
                          title={`Edit ${formatTime(shift.start_time)}–${formatTime(shift.end_time)}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                      {userShifts.shifts.map((shift) => (
                        <button
                          key={`del-${shift.id}`}
                          onClick={() => onDeleteShift(shift.id)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          title={`Delete ${formatTime(shift.start_time)}–${formatTime(shift.end_time)}`}
                        >
                          ×
                        </button>
                      ))}
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
          + {t(language, "shifts.addShort")}
        </button>
      </div>
    </div>
  );
}
