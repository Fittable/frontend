"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User, UserMe, Shift, Holiday } from "@/lib/types";
import {
  WorkMonth,
  getWorkMonth,
  getNextWorkMonth,
  getPrevWorkMonth,
  getMonthsToFetch,
  formatDateStr,
} from "@/lib/workMonth";
import Sidebar from "@/components/Sidebar";
import CalendarHeader from "@/components/CalendarHeader";
import CalendarGrid from "@/components/CalendarGrid";
import WeeklyCalendarGrid from "@/components/WeeklyCalendarGrid";
import ShiftDetailPanel from "@/components/ShiftDetailPanel";
import ShiftEditorModal from "@/components/ShiftEditorModal";
import styles from "./page.module.css";

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workMonth, setWorkMonth] = useState<WorkMonth>(() => getWorkMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [visibleWorkerIds, setVisibleWorkerIds] = useState<string[]>([]);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const loadShifts = useCallback(async () => {
    try {
      // Need to fetch shifts for both months in the work month range
      const monthsToFetch = getMonthsToFetch(workMonth);
      const allShifts: Shift[] = [];

      for (const month of monthsToFetch) {
        const data = await api.getShifts(month);
        allShifts.push(...data);
      }

      // Remove duplicates (by id) in case of overlap
      const uniqueShifts = Array.from(
        new Map(allShifts.map((s) => [s.id, s])).values()
      );

      setShifts(uniqueShifts);
    } catch (err) {
      console.error("Failed to load shifts:", err);
    }
  }, [workMonth]);

  const loadHolidays = useCallback(async () => {
    try {
      // Fetch holidays for both years in the work month (in case it spans Dec-Jan)
      const years = [workMonth.startYear, workMonth.endYear];
      const uniqueYears = Array.from(new Set(years));
      const allHolidays: Holiday[] = [];

      for (const year of uniqueYears) {
        const data = await api.getHolidays(year);
        allHolidays.push(...data.holidays);
      }

      // Remove duplicates by date
      const uniqueHolidays = Array.from(
        new Map(allHolidays.map((h) => [h.date, h])).values()
      );

      setHolidays(uniqueHolidays);
    } catch (err) {
      console.error("Failed to load holidays:", err);
    }
  }, [workMonth.startYear, workMonth.endYear]);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        const me = await api.getMe();
        if (!isMounted) return;
        
        // Convert UserMe to User format (they're compatible)
        setUser(me as User);

        // All users can see all workers (for shared schedule visibility)
        try {
          const userList = await api.getUsers();
          if (!isMounted) return;
          setUsers(userList);
        } catch (err) {
          console.error("Failed to load users:", err);
          // Continue even if users list fails - user can still use the app
          if (isMounted) setUsers([]);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        if (!isMounted) return;
        setLoading(false);
        const message = err instanceof Error ? err.message : "Please sign in again.";
        router.push(`/login?error=${encodeURIComponent(message)}`);
        return;
      }
      if (isMounted) setLoading(false);
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (user) {
      loadShifts();
      loadHolidays();
    }
  }, [user, loadShifts, loadHolidays]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [workMonth]);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  const handlePrevMonth = () => {
    setWorkMonth(getPrevWorkMonth(workMonth));
  };

  const handleNextMonth = () => {
    setWorkMonth(getNextWorkMonth(workMonth));
  };

  const handleToday = () => {
    const today = new Date();
    setWorkMonth(getWorkMonth(today));
    setSelectedDate(formatDateStr(today));
  };

  const handleDateSelect = (date: Date) => {
    // Navigate to the work month containing this date
    setWorkMonth(getWorkMonth(date));
    setSelectedDate(formatDateStr(date));
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
        shifts={shifts}
        workMonth={workMonth}
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
          workMonth={workMonth}
            viewMode={viewMode}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
            onViewModeChange={setViewMode}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Calendar and Panel Container */}
        <div className={styles.content}>
          {/* Calendar Grid */}
          <div className={styles.calendarContainer}>
            {viewMode === "month" ? (
              <CalendarGrid
                workMonth={workMonth}
                shifts={filteredShifts}
                users={users}
                holidays={holidays}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
                onShiftClick={handleShiftClick}
                onDayDoubleClick={handleDayDoubleClick}
              />
            ) : (
              <WeeklyCalendarGrid
                workMonth={workMonth}
                shifts={filteredShifts}
                users={users}
                holidays={holidays}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
                onShiftClick={handleShiftClick}
                onDayDoubleClick={handleDayDoubleClick}
              />
            )}
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
