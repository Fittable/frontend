"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User, Shift } from "@/lib/types";
import TopBar from "@/components/TopBar";
import CalendarMonth from "@/components/CalendarMonth";
import ShiftList from "@/components/ShiftList";
import ShiftEditorModal from "@/components/ShiftEditorModal";

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const formatMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const loadShifts = useCallback(async () => {
    try {
      const month = formatMonth(currentDate);
      const data = await api.getShifts(month, filterUserId || undefined);
      setShifts(data);
    } catch (err) {
      console.error("Failed to load shifts:", err);
    }
  }, [currentDate, filterUserId]);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.getMe();
        setUser(me);

        if (me.role === "admin") {
          const userList = await api.getUsers();
          setUsers(userList);
        }
      } catch {
        router.push("/login");
        return;
      }
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadShifts();
    }
  }, [user, loadShifts]);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleAddShift = () => {
    setEditingShift(null);
    setShowModal(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShowModal(true);
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm("Delete this shift?")) return;
    try {
      await api.deleteShift(shiftId);
      await loadShifts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSaveShift = async () => {
    setShowModal(false);
    await loadShifts();
  };

  const shiftsForDate = selectedDate
    ? shifts.filter((s) => s.date === selectedDate)
    : [];

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
    );
  }

  if (!user) return null;

  return (
    <div style={styles.container}>
      <TopBar
        user={user}
        users={users}
        filterUserId={filterUserId}
        onFilterChange={setFilterUserId}
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onLogout={handleLogout}
      />

      <div style={styles.content}>
        <div style={styles.calendarSection}>
          <CalendarMonth
            currentDate={currentDate}
            shifts={shifts}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />
        </div>

        <div style={styles.sidePanel}>
          {selectedDate ? (
            <>
              <div style={styles.sidePanelHeader}>
                <h3 style={{ margin: 0 }}>
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { weekday: "long", month: "short", day: "numeric" }
                  )}
                </h3>
                <button onClick={handleAddShift} style={styles.addButton}>
                  + Add Shift
                </button>
              </div>
              <ShiftList
                shifts={shiftsForDate}
                isAdmin={user.role === "admin"}
                currentUserId={user.id}
                onEdit={handleEditShift}
                onDelete={handleDeleteShift}
              />
            </>
          ) : (
            <p style={styles.placeholder}>Select a day to view shifts</p>
          )}
        </div>
      </div>

      {showModal && (
        <ShiftEditorModal
          shift={editingShift}
          date={selectedDate || ""}
          users={users}
          isAdmin={user.role === "admin"}
          currentUserId={user.id}
          onSave={handleSaveShift}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
  },
  content: {
    display: "flex",
    padding: "1rem",
    gap: "1rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  calendarSection: {
    flex: 2,
    background: "white",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sidePanel: {
    flex: 1,
    background: "white",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    minWidth: "280px",
  },
  sidePanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #eee",
  },
  addButton: {
    padding: "0.375rem 0.75rem",
    background: "#333",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  placeholder: {
    color: "#999",
    textAlign: "center",
    padding: "2rem 0",
  },
};

