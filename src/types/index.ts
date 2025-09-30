export interface SearchFilters {
  courseTitle: string;
  category: string;
  subcategory: string;
  date: string;
  time: string;
  location: string[];
  age: string;
}

export interface SearchResult {
  courseTitle: string;
  location: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  date: string;
  locationURL?: string | null;
  locationAddress?: string | null;
  category?: string;
  subcategory?: string;
  ageRange?: string;
  "Age Min"?: string;
  "Age Max"?: string;
}

export interface Location {
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

export interface DropInRecord {
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

export interface MapLocation {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  url?: string;
}

export type SortOrder = 'alphabetical' | 'earliest' | 'latest' | 'open-longest';
