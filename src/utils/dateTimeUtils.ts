// Helper function to get current date in YYYY-MM-DD format (local timezone)
export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get default date - if it's late in the day, default to tomorrow (local timezone)
export const getDefaultDate = (): string => {
  const now = new Date();
  const hour = now.getHours();
  
  // If it's after 10 PM, default to tomorrow
  if (hour >= 22) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const day = tomorrow.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return getCurrentDate();
};

// Helper function to get default time - return the next closest available time
export const getDefaultTime = (): string => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // If it's after 10 PM, default to "Any time" (for tomorrow)
  if (hour >= 22) {
    return 'Any time';
  }
  
  // If it's before 6 AM, default to "Any time"
  if (hour < 6) {
    return 'Any time';
  }
  
  // Find the next closest time slot
  let nextHour = hour;
  let nextMinute = minute;
  
  // Round to next 30-minute interval
  if (minute <= 0) {
    nextMinute = 30;
  } else if (minute <= 30) {
    nextMinute = 30;
  } else {
    nextMinute = 0;
    nextHour = (nextHour + 1) % 24;
  }
  
  // If we've gone past 11:30 PM, default to "Any time"
  if (nextHour >= 24 || (nextHour === 23 && nextMinute > 30)) {
    return 'Any time';
  }
  
  // Format the time
  const timeString = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
  return timeString;
};

// Helper function to convert 24-hour time to 12-hour AM/PM format
export const formatTimeToAMPM = (time24: string): string => {
  if (time24 === 'Any time') return time24;
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${period}`;
};

// Helper function to format date for display without timezone issues
export const formatDateForDisplay = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to calculate program duration in minutes
export const calculateDuration = (startTime: string, endTime: string): number => {
  if (startTime === 'Any time' || endTime === 'Any time') return 0;
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Handle case where end time is next day (e.g., 23:30 to 01:30)
  if (endMinutes < startMinutes) {
    return (24 * 60) - startMinutes + endMinutes;
  }
  
  return endMinutes - startMinutes;
};
