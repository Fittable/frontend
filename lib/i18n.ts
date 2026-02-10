export type Language = "ko" | "en";

export type TranslationKey =
  // Common
  | "common.logout"
  | "common.admin"
  // Sidebar / workers
  | "sidebar.workers"
  | "sidebar.allWorkers"
  // Calendar header / navigation
  | "calendar.today"
  | "calendar.month"
  | "calendar.week"
  // Shifts / detail panel
  | "shifts.none"
  | "shifts.add"
  | "shifts.addShort"
  | "shifts.editShiftTitle"
  | "shifts.newShiftTitle"
  | "shifts.date"
  | "shifts.assignTo"
  | "shifts.hours"
  | "shifts.modeRegular"
  | "shifts.modeVacation"
  | "shifts.sectionShift"
  | "shifts.customTime"
  | "shifts.to"
  | "shifts.noteOptional"
  | "shifts.notePlaceholder"
  | "shifts.summaryCreatingPrefix"
  | "shifts.summaryTimeLabel"
  | "shifts.cancel"
  | "shifts.saving"
  | "shifts.update"
  | "shifts.create"
  | "shifts.edit"
  // Login
  | "login.title"
  | "login.subtitle"
  | "login.studentIdLabel"
  | "login.studentIdPlaceholder"
  | "login.passwordLabel"
  | "login.passwordPlaceholder"
  | "login.signIn"
  | "login.signingIn"
  | "login.demoCredentials"
  | "login.adminLabel"
  | "login.workerLabel";

const translations: Record<Language, Record<TranslationKey, string>> = {
  ko: {
    // Common
    "common.logout": "로그아웃",
    "common.admin": "관리자",

    // Sidebar / workers
    "sidebar.workers": "근로학생",
    "sidebar.allWorkers": "전체 근로학생",

    // Calendar header / navigation
    "calendar.today": "오늘",
    "calendar.month": "월",
    "calendar.week": "주",

    // Shifts / detail panel
    "shifts.none": "등록된 근무가 없습니다",
    "shifts.add": "근무 추가",
    "shifts.addShort": "근무 추가",
    "shifts.editShiftTitle": "근무 수정",
    "shifts.newShiftTitle": "새 근무",
    "shifts.date": "날짜",
    "shifts.assignTo": "근무자",
    "shifts.hours": "근무 시간",
    "shifts.modeRegular": "학기",
    "shifts.modeVacation": "방학",
    "shifts.sectionShift": "근무",
    "shifts.customTime": "직접 입력",
    "shifts.to": "부터",
    "shifts.noteOptional": "비고 (선택)",
    "shifts.notePlaceholder": "메모를 입력하세요...",
    "shifts.summaryCreatingPrefix": "다음 근무 생성:",
    "shifts.summaryTimeLabel": "시간:",
    "shifts.cancel": "취소",
    "shifts.saving": "저장 중...",
    "shifts.update": "수정",
    "shifts.create": "생성",
    "shifts.edit": "수정",

    // Login
    "login.title": "근로 스케줄러",
    "login.subtitle": "근무 일정을 관리하려면 로그인하세요",
    "login.studentIdLabel": "학번",
    "login.studentIdPlaceholder": "학번을 입력하세요",
    "login.passwordLabel": "비밀번호",
    "login.passwordPlaceholder": "비밀번호를 입력하세요",
    "login.signIn": "로그인",
    "login.signingIn": "로그인 중...",
    "login.demoCredentials": "데모 계정",
    "login.adminLabel": "관리자",
    "login.workerLabel": "근로학생",
  },
  en: {
    // Common
    "common.logout": "Log out",
    "common.admin": "admin",

    // Sidebar / workers
    "sidebar.workers": "Workers",
    "sidebar.allWorkers": "All Workers",

    // Calendar header / navigation
    "calendar.today": "Today",
    "calendar.month": "Month",
    "calendar.week": "Week",

    // Shifts / detail panel
    "shifts.none": "No shifts scheduled",
    "shifts.add": "Add a shift",
    "shifts.addShort": "Add Shift",
    "shifts.editShiftTitle": "Edit Shift",
    "shifts.newShiftTitle": "New Shift",
    "shifts.date": "Date",
    "shifts.assignTo": "Assign to",
    "shifts.hours": "Hours",
    "shifts.modeRegular": "Regular",
    "shifts.modeVacation": "Vacation",
    "shifts.sectionShift": "Shift",
    "shifts.customTime": "Custom Time",
    "shifts.to": "to",
    "shifts.noteOptional": "Note (optional)",
    "shifts.notePlaceholder": "Add a note...",
    "shifts.summaryCreatingPrefix": "Creating shifts:",
    "shifts.summaryTimeLabel": "Time:",
    "shifts.cancel": "Cancel",
    "shifts.saving": "Saving...",
    "shifts.update": "Update",
    "shifts.create": "Create",
    "shifts.edit": "Edit",

    // Login
    "login.title": "Part-time Scheduler",
    "login.subtitle": "Sign in to manage your shifts",
    "login.studentIdLabel": "Student ID",
    "login.studentIdPlaceholder": "Enter your student ID",
    "login.passwordLabel": "Password",
    "login.passwordPlaceholder": "Enter your password",
    "login.signIn": "Sign In",
    "login.signingIn": "Signing in...",
    "login.demoCredentials": "Demo credentials",
    "login.adminLabel": "Admin:",
    "login.workerLabel": "Worker:",
  },
};

export function t(language: Language, key: TranslationKey): string {
  return translations[language][key];
}

