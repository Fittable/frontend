"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User, Shift } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import CalendarHeader from "@/components/CalendarHeader";
import CalendarGrid from "@/components/CalendarGrid";
import ShiftDetailPanel from "@/components/ShiftDetailPanel";
import ShiftEditorModal from "@/components/ShiftEditorModal";
import styles from "./page.module.css";

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleWorkerIds, setVisibleWorkerIds] = useState<string[]>([]);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const formatMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const loadShifts = useCallback(async () => {
    try {
      const month = formatMonth(currentDate);
      // If filtering by specific workers, we need to load all and filter client-side
      // Or load for each worker - for simplicity, load all and filter
      const data = await api.getShifts(month);
      setShifts(data);
    } catch (err) {
      console.error("Failed to load shifts:", err);
    }
  }, [currentDate]);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.getMe();
        setUser(me);

        if (me.role === "admin") {
          const userList = await api.getUsers();
          setUsers(userList);
        } else {
          // For workers, just add themselves to the users list
          setUsers([me]);
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          handlePrevMonth();
          break;
        case "ArrowRight":
          handleNextMonth();
          break;
        case "t":
        case "T":
          handleToday();
          break;
        case "Escape":
          setSelectedDate(null);
          setShowModal(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    // Format today's date and select it
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setSelectedDate(todayStr);
  };

  const handleDateSelect = (date: Date) => {
    // Navigate to the month containing this date
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    // Select the date
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    setSelectedDate(dateStr);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleDayDoubleClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditingShift(null);
    setShowModal(true);
  };

  const handleAddShift = () => {
    setEditingShift(null);
    setShowModal(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShowModal(true);
  };

  const handleShiftClick = (shift: Shift) => {
    // Select the day and open edit modal
    setSelectedDate(shift.date);
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

  const handleClosePanel = () => {
    setSelectedDate(null);
  };

  // Filter shifts based on visible worker IDs
  const filteredShifts = visibleWorkerIds.length === 0
    ? shifts
    : shifts.filter((s) => visibleWorkerIds.includes(s.user_id));

  const shiftsForDate = selectedDate
    ? filteredShifts.filter((s) => s.date === selectedDate)
    : [];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <Sidebar
        user={user}
        users={users}
        currentDate={currentDate}
        selectedDate={selectedDate}
        visibleWorkerIds={visibleWorkerIds}
        onDateSelect={handleDateSelect}
        onWorkerFilterChange={setVisibleWorkerIds}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Calendar and Panel Container */}
        <div className={styles.content}>
          {/* Calendar Grid */}
          <div className={styles.calendarContainer}>
            <CalendarGrid
              currentDate={currentDate}
              shifts={filteredShifts}
              users={users}
              selectedDate={selectedDate}
              isAdmin={user.role === "admin"}
              onDayClick={handleDayClick}
              onShiftClick={handleShiftClick}
              onDayDoubleClick={handleDayDoubleClick}
            />
          </div>

          {/* Shift Detail Panel */}
          {selectedDate && (
            <ShiftDetailPanel
              selectedDate={selectedDate}
              shifts={shiftsForDate}
              users={users}
              isAdmin={user.role === "admin"}
              currentUserId={user.id}
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
              onDeleteShift={handleDeleteShift}
              onClose={handleClosePanel}
            />
          )}
        </div>
      </main>

      {/* Modal */}
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
