"use client";

import { User, getDisplayName, DisplayNamePreference } from "@/lib/types";
import { Language } from "@/lib/i18n";
import { getWorkerColor } from "./Sidebar";
import styles from "./MobileFilterPanel.module.css";

interface MobileFilterPanelProps {
  users: User[];
  visibleWorkerIds: string[];
  language: Language;
  displayNamePreference?: DisplayNamePreference;
  isOpen: boolean;
  onWorkerFilterChange: (workerIds: string[]) => void;
  onClose: () => void;
}

export default function MobileFilterPanel({
  users,
  visibleWorkerIds,
  language,
  displayNamePreference = "nickname",
  isOpen,
  onWorkerFilterChange,
  onClose,
}: MobileFilterPanelProps) {
  const showAllSelected = visibleWorkerIds.length === 0;

  const handleAllWorkersToggle = () => {
    onWorkerFilterChange([]);
  };

  const handleWorkerToggle = (userId: string) => {
    if (showAllSelected) {
      onWorkerFilterChange([userId]);
    } else if (visibleWorkerIds.includes(userId)) {
      const newIds = visibleWorkerIds.filter((id) => id !== userId);
      onWorkerFilterChange(newIds.length > 0 ? newIds : []);
    } else {
      onWorkerFilterChange([...visibleWorkerIds, userId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>근로학생</span>
          <button className={styles.closeButton} onClick={onClose}>
            <ChevronDownIcon />
          </button>
        </div>
        <div className={styles.content}>
          <label className={styles.filterItem}>
            <input
              type="checkbox"
              checked={showAllSelected}
              onChange={handleAllWorkersToggle}
              className={styles.filterCheckbox}
            />
            <span className={styles.checkmark}>✓</span>
            <span className={styles.filterLabel}>전체</span>
          </label>

          {users.map((user, index) => {
            const color = getWorkerColor(index);
            const isSelected = showAllSelected || visibleWorkerIds.includes(user.id);

            return (
              <label key={user.id} className={styles.filterItem}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleWorkerToggle(user.id)}
                  className={styles.filterCheckbox}
                />
                <span className={styles.checkmark}>✓</span>
                <span className={styles.filterLabel}>{getDisplayName(user, displayNamePreference)}</span>
              </label>
            );
          })}
        </div>
        <div className={styles.footer}>
          <button className={styles.closeButtonBottom} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}
