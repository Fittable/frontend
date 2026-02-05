"use client";

import { Shift } from "@/lib/types";
import styles from "./ShiftBar.module.css";

interface ShiftBarProps {
  shift: Shift;
  color: string;
  showWorkerName: boolean;
  onClick: () => void;
}

export default function ShiftBar({
  shift,
  color,
  showWorkerName,
  onClick,
}: ShiftBarProps) {
  const formatTime = (time: string) => time.slice(0, 5);

  const timeRange = `${formatTime(shift.start_time)}–${formatTime(shift.end_time)}`;
  const displayText = showWorkerName && shift.name 
    ? `${shift.name}` 
    : timeRange;

  return (
    <button
      onClick={onClick}
      className={styles.bar}
      style={{ 
        backgroundColor: `${color}20`,
        borderLeftColor: color,
      }}
      title={`${shift.name || 'Shift'}: ${timeRange}${shift.note ? ` - ${shift.note}` : ''}`}
    >
      <span className={styles.text} style={{ color }}>
        {displayText}
      </span>
    </button>
  );
}

interface MoreShiftsProps {
  count: number;
  onClick: () => void;
}

export function MoreShifts({ count, onClick }: MoreShiftsProps) {
  return (
    <button onClick={onClick} className={styles.more}>
      +{count} more
    </button>
  );
}

