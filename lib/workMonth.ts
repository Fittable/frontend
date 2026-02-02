// Work month runs from 25th of one month to 24th of the next month
// Example: "January-February" = Jan 25 to Feb 24

export interface WorkMonth {
  // The starting month (where 25th begins)
  startMonth: number; // 0-11
  startYear: number;
  // The ending month (where 24th ends)
  endMonth: number; // 0-11
  endYear: number;
}

// Get work month from a reference date
// If date is before 25th, it belongs to previous work month
// If date is 25th or after, it belongs to current work month starting this month
export function getWorkMonth(date: Date): WorkMonth {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (day >= 25) {
    // Work month starts this month
    const endMonth = month === 11 ? 0 : month + 1;
    const endYear = month === 11 ? year + 1 : year;
    return {
      startMonth: month,
      startYear: year,
      endMonth,
      endYear,
    };
  } else {
    // Work month started last month
    const startMonth = month === 0 ? 11 : month - 1;
    const startYear = month === 0 ? year - 1 : year;
    return {
      startMonth,
      startYear: startYear,
      endMonth: month,
      endYear: year,
    };
  }
}

// Get the start date of a work month (25th of start month)
export function getWorkMonthStartDate(workMonth: WorkMonth): Date {
  return new Date(workMonth.startYear, workMonth.startMonth, 25);
}

// Get the end date of a work month (24th of end month)
export function getWorkMonthEndDate(workMonth: WorkMonth): Date {
  return new Date(workMonth.endYear, workMonth.endMonth, 24);
}

// Navigate to next work month
export function getNextWorkMonth(workMonth: WorkMonth): WorkMonth {
  const nextStartMonth = workMonth.endMonth;
  const nextStartYear = workMonth.endYear;
  const nextEndMonth = nextStartMonth === 11 ? 0 : nextStartMonth + 1;
  const nextEndYear = nextStartMonth === 11 ? nextStartYear + 1 : nextStartYear;

  return {
    startMonth: nextStartMonth,
    startYear: nextStartYear,
    endMonth: nextEndMonth,
    endYear: nextEndYear,
  };
}

// Navigate to previous work month
export function getPrevWorkMonth(workMonth: WorkMonth): WorkMonth {
  const prevEndMonth = workMonth.startMonth;
  const prevEndYear = workMonth.startYear;
  const prevStartMonth = prevEndMonth === 0 ? 11 : prevEndMonth - 1;
  const prevStartYear = prevEndMonth === 0 ? prevEndYear - 1 : prevEndYear;

  return {
    startMonth: prevStartMonth,
    startYear: prevStartYear,
    endMonth: prevEndMonth,
    endYear: prevEndYear,
  };
}

// Get display label for work month (e.g., "January – February 2026")
export function getWorkMonthLabel(workMonth: WorkMonth, short: boolean = false): string {
  const monthFormat = short ? "short" : "long";
  const startMonthName = new Date(workMonth.startYear, workMonth.startMonth, 1)
    .toLocaleDateString("en-US", { month: monthFormat });
  const endMonthName = new Date(workMonth.endYear, workMonth.endMonth, 1)
    .toLocaleDateString("en-US", { month: monthFormat });

  // If same year, show year once at the end
  if (workMonth.startYear === workMonth.endYear) {
    return `${startMonthName} – ${endMonthName} ${workMonth.endYear}`;
  } else {
    return `${startMonthName} ${workMonth.startYear} – ${endMonthName} ${workMonth.endYear}`;
  }
}

// Get all dates in a work month as an array
export function getWorkMonthDates(workMonth: WorkMonth): Date[] {
  const dates: Date[] = [];
  const startDate = getWorkMonthStartDate(workMonth);
  const endDate = getWorkMonthEndDate(workMonth);

  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Format a date to YYYY-MM-DD string
export function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get the months needed to fetch shifts for a work month (both months)
export function getMonthsToFetch(workMonth: WorkMonth): string[] {
  const startMonthStr = `${workMonth.startYear}-${String(workMonth.startMonth + 1).padStart(2, "0")}`;
  const endMonthStr = `${workMonth.endYear}-${String(workMonth.endMonth + 1).padStart(2, "0")}`;
  
  if (startMonthStr === endMonthStr) {
    return [startMonthStr];
  }
  return [startMonthStr, endMonthStr];
}

