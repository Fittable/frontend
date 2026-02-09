"use client";

import { User } from "@/lib/types";

interface TopBarProps {
  user: User;
  users: User[];
  filterUserId: string;
  onFilterChange: (userId: string) => void;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onLogout: () => void;
}

export default function TopBar({
  user,
  users,
  filterUserId,
  onFilterChange,
  currentDate,
  onPrevMonth,
  onNextMonth,
  onLogout,
}: TopBarProps) {
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <h1 style={styles.title}>Scheduler</h1>

        <div style={styles.monthNav}>
          <button onClick={onPrevMonth} style={styles.navButton}>
            ←
          </button>
          <span style={styles.monthLabel}>{monthYear}</span>
          <button onClick={onNextMonth} style={styles.navButton}>
            →
          </button>
        </div>

        {user.role === "admin" && users.length > 0 && (
          <select
            value={filterUserId}
            onChange={(e) => onFilterChange(e.target.value)}
            style={styles.select}
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.student_id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={styles.right}>
        <span style={styles.userInfo}>
          {user.name || user.student_id}{" "}
          <span style={styles.role}>({user.role})</span>
        </span>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  bar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.5rem",
    background: "white",
    borderBottom: "1px solid #e5e5e5",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  monthNav: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  navButton: {
    padding: "0.25rem 0.5rem",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  monthLabel: {
    minWidth: "140px",
    textAlign: "center",
    fontWeight: 500,
  },
  select: {
    padding: "0.375rem 0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "0.875rem",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  userInfo: {
    fontSize: "0.875rem",
  },
  role: {
    color: "#666",
  },
  logoutButton: {
    padding: "0.375rem 0.75rem",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
};

