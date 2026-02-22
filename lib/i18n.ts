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
  | "calendar.day"
  | "calendar.all"
  | "calendar.mySchedule"
  // Shifts / detail panel
  | "shifts.none"
  | "shifts.add"
  | "shifts.addShort"
  | "shifts.editShiftTitle"
  | "shifts.newShiftTitle"
  | "shifts.morning"
  | "shifts.evening"
  | "shifts.fullDay"
  | "shifts.fullDayDescription"
  | "shifts.custom"
  | "shifts.customTimeDescription"
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
  | "shifts.errorNoSelection"
  | "shifts.selectDays"
  | "shifts.daysSelected"
  | "shifts.errorNoDaySelected"
  | "shifts.selectedDates"
  | "shifts.delete"
  | "shifts.deleting"
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
  | "login.workerLabel"
  // Profile / settings
  | "profile.settings"
  | "profile.name"
  | "profile.studentId"
  | "profile.major"
  | "profile.dateOfBirth"
  | "profile.gender"
  | "profile.nationality"
  | "profile.roomNo"
  | "profile.nickname"
  | "profile.deptName"
  | "profile.workCategory"
  | "profile.language"
  | "profile.displayNamePreference"
  | "profile.displayName"
  | "profile.displayNickname"
  | "profile.displayFullName"
  | "profile.save"
  | "profile.saving"
  | "profile.loading"
  | "profile.close"
  | "profile.download"
  | "profile.viewProfile"
  | "profile.studentIdCard";

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
    "calendar.day": "일",
    "calendar.all": "전체",
    "calendar.mySchedule": "내 일정",

    // Shifts / detail panel
    "shifts.none": "등록된 근무가 없습니다",
    "shifts.add": "근무 추가",
    "shifts.addShort": "근무 추가",
    "shifts.editShiftTitle": "근무 수정",
    "shifts.newShiftTitle": "새 근무",
    "shifts.morning": "오전",
    "shifts.evening": "오후",
    "shifts.fullDay": "종일",
    "shifts.fullDayDescription": "오전 + 오후",
    "shifts.custom": "직접 입력",
    "shifts.customTimeDescription": "직접 시간 입력",
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
    "shifts.errorNoSelection": "최소 하나의 근무 옵션을 선택해주세요",
    "shifts.selectDays": "날짜 선택",
    "shifts.daysSelected": "일",
    "shifts.errorNoDaySelected": "최소 하나의 날짜를 선택해주세요",
    "shifts.selectedDates": "선택된 날짜",
    "shifts.delete": "삭제",
    "shifts.deleting": "삭제 중...",

    // Login
    "login.title": "핏테이블",
    "login.subtitle": "국제교류팀 근로학생을 위한 시간 관리 프렛폼",
    "login.studentIdLabel": "학번",
    "login.studentIdPlaceholder": "학번을 입력하세요",
    "login.passwordLabel": "비밀번호",
    "login.passwordPlaceholder": "비밀번호를 입력하세요",
    "login.signIn": "로그인",
    "login.signingIn": "로그인 중...",
    "login.demoCredentials": "데모 계정",
    "login.adminLabel": "관리자",
    "login.workerLabel": "근로학생",

    // Profile / settings
    "profile.settings": "설정",
    "profile.name": "이름",
    "profile.studentId": "학번",
    "profile.major": "전공",
    "profile.dateOfBirth": "생년월일",
    "profile.gender": "성별",
    "profile.nationality": "국적",
    "profile.roomNo": "사무실",
    "profile.nickname": "닉네임",
    "profile.deptName": "대학",
    "profile.workCategory": "구분",
    "profile.language": "언어",
    "profile.displayNamePreference": "캘린더에 표시할 이름",
    "profile.displayName": "이름",
    "profile.displayNickname": "닉네임",
    "profile.displayFullName": "이름",
    "profile.save": "저장",
    "profile.saving": "저장 중...",
    "profile.loading": "불러오는 중...",
    "profile.close": "닫기",
    "profile.download": "다운로드",
    "profile.viewProfile": "프로필 보기",
    "profile.studentIdCard": "근로학생증",
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
    "calendar.day": "Day",
    "calendar.all": "All",
    "calendar.mySchedule": "My schedule",

    // Shifts / detail panel
    "shifts.none": "No shifts scheduled",
    "shifts.add": "Add a shift",
    "shifts.addShort": "Add Shift",
    "shifts.editShiftTitle": "Edit Shift",
    "shifts.newShiftTitle": "New Shift",
    "shifts.morning": "Morning",
    "shifts.evening": "Evening",
    "shifts.fullDay": "Full Day",
    "shifts.fullDayDescription": "Morning + Evening",
    "shifts.custom": "Custom",
    "shifts.customTimeDescription": "Add custom time",
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
    "shifts.errorNoSelection": "Please select at least one shift option",
    "shifts.selectDays": "Select Days",
    "shifts.daysSelected": "days",
    "shifts.errorNoDaySelected": "Please select at least one day",
    "shifts.selectedDates": "Selected Dates",
    "shifts.delete": "Delete",
    "shifts.deleting": "Deleting...",

    // Login
    "login.title": "Fittable",
    "login.subtitle": "Time manager for OIA students",
    "login.studentIdLabel": "Student ID",
    "login.studentIdPlaceholder": "Enter your student ID",
    "login.passwordLabel": "Password",
    "login.passwordPlaceholder": "Enter your password",
    "login.signIn": "Sign In",
    "login.signingIn": "Signing in...",
    "login.demoCredentials": "Demo credentials",
    "login.adminLabel": "Admin:",
    "login.workerLabel": "Worker:",

    // Profile / settings
    "profile.settings": "Settings",
    "profile.name": "Name",
    "profile.studentId": "Student ID",
    "profile.major": "Major",
    "profile.dateOfBirth": "Date of birth",
    "profile.gender": "Gender",
    "profile.nationality": "Nationality",
    "profile.roomNo": "Office",
    "profile.nickname": "Nickname",
    "profile.deptName": "Department",
    "profile.workCategory": "Category",
    "profile.language": "Language",
    "profile.displayNamePreference": "Name to display in calendar",
    "profile.displayName": "Display name",
    "profile.displayNickname": "Nickname",
    "profile.displayFullName": "Full name",
    "profile.save": "Save",
    "profile.saving": "Saving...",
    "profile.loading": "Loading...",
    "profile.close": "Close",
    "profile.download": "Download",
    "profile.viewProfile": "View profile",
    "profile.studentIdCard": "Student ID Card",
  },
};

export function t(language: Language, key: TranslationKey): string {
  return translations[language][key];
}

