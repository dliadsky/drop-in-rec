import { useMemo, useEffect } from 'react';
import { formatTimeToAMPM } from '../utils/dateTimeUtils';

export const useTimeOptions = (filters: any, onFiltersChange: (filters: any) => void) => {
  const generateTimeOptions = () => {
    const times = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if the selected date is today
    const today = new Date();
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`; // YYYY-MM-DD format in local timezone
    const isToday = filters.date === todayString;
    
    for (let hour = 6; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Stop at 10:30 PM (22:30) - skip 11:00 PM and later
        if (hour === 21 && minute > 0) {
          break;
        }
        
        // If it's today, skip past times
        if (isToday) {
          // Skip if hour is less than current hour
          if (hour < currentHour) {
            continue;
          }
          // Skip if same hour but minute is less than or equal to current minute
          if (hour === currentHour && minute <= currentMinute) {
            continue;
          }
        }
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    
    // Sort the time strings and add "Any time" at the beginning
    times.sort((a, b) => a.localeCompare(b));
    return ['Any time', ...times];
  };

  const timeOptions = useMemo(() => generateTimeOptions(), [filters.date]);

  // Auto-update time if it becomes invalid (in the past)
  useEffect(() => {
    if (timeOptions.length > 0 && !timeOptions.includes(filters.time)) {
      // Current time is not in the valid options, set to the first available time
      // But don't change if it's already "Any time" to avoid duplicates
      if (filters.time !== 'Any time') {
        onFiltersChange({ ...filters, time: timeOptions[0] });
      }
    }
  }, [timeOptions, filters.time, filters, onFiltersChange]);

  // Generate day options for the next 7 days (to match "This Week" logic)
  const generateDayOptions = () => {
    const days = [];
    const today = new Date();
    
    // Add "This week" option first
    days.push({ label: 'This week', value: 'this-week' });
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      
      let label;
      if (i === 0) {
        label = 'Today';
      } else if (i === 1) {
        label = 'Tomorrow';
      } else {
        label = `${dayName}, ${month} ${day}`;
      }
      
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`; // YYYY-MM-DD format in local timezone
      
      days.push({ label, value });
    }
    
    return days;
  };

  const dayOptions = generateDayOptions();

  return {
    timeOptions,
    dayOptions,
    formatTimeToAMPM
  };
};
