interface Location {
  _id: number;
  "Location ID": number;
  "Parent Location ID": number;
  "Location Name": string;
  "Location Type": string;
  "Accessibility": string;
  "Intersection": string;
  "TTC Information": string;
  "District": string;
  "Street No": string;
  "Street No Suffix": string;
  "Street Name": string;
  "Street Type": string;
  "Street Direction": string;
  "Postal Code": string;
  "Description": string;
}

interface DropInRecord {
  _id: number;
  "Location ID": number;
  "Course_ID": number;
  "Course Title": string;
  "Section": string;
  "Age Min": string;
  "Age Max": string;
  "Date Range": string;
  "Start Hour": number;
  "Start Minute": number;
  "End Hour": number;
  "End Min": number;
  "First Date": string;
  "Last Date": string;
}

// Load data from local JSON files
export const loadLocations = async (): Promise<Location[]> => {
  try {
    const response = await fetch('/Locations.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Loaded locations:', data.length);
    return data;
  } catch (error) {
    console.error('Error loading locations:', error);
    throw error;
  }
};

export const loadDropIns = async (): Promise<DropInRecord[]> => {
  try {
    const response = await fetch('/Drop-in.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Loaded drop-ins:', data.length);
    return data;
  } catch (error) {
    console.error('Error loading drop-ins:', error);
    throw error;
  }
};

// Mock data for development/testing
const getMockData = (): { locations: Location[], dropIns: DropInRecord[] } => {
  const mockDropIns: DropInRecord[] = [
    {
      _id: 1,
      Course_Title: "Lane Swim",
      Location: "Toronto Pan Am Sports Centre",
      Day_of_Week: "Monday",
      Start_Time: "6:00 AM",
      End_Time: "8:00 AM"
    },
    {
      _id: 2,
      Course_Title: "Lane Swim",
      Location: "Toronto Pan Am Sports Centre",
      Day_of_Week: "Tuesday",
      Start_Time: "5:00 PM",
      End_Time: "7:00 PM"
    },
    {
      _id: 3,
      Course_Title: "Basketball",
      Location: "Regent Park Community Centre",
      Day_of_Week: "Wednesday",
      Start_Time: "7:00 PM",
      End_Time: "9:00 PM"
    },
    {
      _id: 4,
      Course_Title: "Lane Swim",
      Location: "Regent Park Community Centre",
      Day_of_Week: "Thursday",
      Start_Time: "6:30 AM",
      End_Time: "8:30 AM"
    },
    {
      _id: 5,
      Course_Title: "Fitness Class",
      Location: "Toronto Pan Am Sports Centre",
      Day_of_Week: "Friday",
      Start_Time: "6:00 PM",
      End_Time: "7:00 PM"
    },
    {
      _id: 6,
      Course_Title: "Lane Swim",
      Location: "Regent Park Community Centre",
      Day_of_Week: "Saturday",
      Start_Time: "10:00 AM",
      End_Time: "12:00 PM"
    },
    {
      _id: 7,
      Course_Title: "Basketball",
      Location: "Toronto Pan Am Sports Centre",
      Day_of_Week: "Sunday",
      Start_Time: "2:00 PM",
      End_Time: "4:00 PM"
    }
  ];

  const mockLocations: Location[] = [
    { _id: 1, name: "Toronto Pan Am Sports Centre" },
    { _id: 2, name: "Regent Park Community Centre" }
  ];

  return { locations: mockLocations, dropIns: mockDropIns };
};

// Get all available resources and their data
export const getAllResources = async (): Promise<{ locations: Location[], dropIns: DropInRecord[] }> => {
  try {
    console.log('Loading data from local JSON files...');
    
    // Load both datasets in parallel
    const [locations, dropIns] = await Promise.all([
      loadLocations(),
      loadDropIns()
    ]);
    
    console.log('Successfully loaded data from local files');
    console.log(`Locations: ${locations.length}, Drop-ins: ${dropIns.length}`);
    
    return { locations, dropIns };
  } catch (error) {
    console.error('Error loading data from local files:', error);
    console.log('Falling back to mock data for development...');
    
    // Return mock data as fallback
    return getMockData();
  }
};

// Helper function to get day of week from date
export const getDayOfWeek = (dateString: string): string => {
  // Parse the date string as local time to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Helper function to format time for comparison (from hour/minute numbers)
export const formatTimeForComparison = (hour: number, minute: number): number => {
  return hour * 60 + minute;
};

// Helper function to format time string for comparison (from "HH:MM" format)
export const formatTimeStringForComparison = (timeString: string): number => {
  const [time, period] = timeString.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  
  return totalMinutes;
};

// Helper function to normalize date picker value to avoid timezone issues
export const normalizeDatePickerValue = (datePickerValue: string): string => {
  // The date picker gives us a string like "2025-09-23"
  // Just return it as-is since it's already in the correct format
  // The issue is in how we're comparing it, not in the format
  return datePickerValue;
};

// Helper function to check if a date falls within a date range
export const isDateInRange = (targetDate: string, dateRange: string): boolean => {
  const [startDate, endDate] = dateRange.split(' to ');
  
  // Simple string comparison - no Date objects to avoid timezone issues
  // All dates are in YYYY-MM-DD format, so string comparison works
  return targetDate >= startDate && targetDate <= endDate;
};
