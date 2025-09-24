import React, { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import LocationMap from './components/LocationMap';
import { getAllResources, getDayOfWeek, formatTimeForComparison, formatTimeStringForComparison, isDateInRange, normalizeDatePickerValue } from './services/api';
import { getCourseTitlesForCategory, categorizeCourse } from './services/categories';
import { loadGeoJSONData, createLocationURLMap, createLocationCoordsMap } from './services/geojson';

// Helper function to get current date in YYYY-MM-DD format
const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get current time rounded to nearest 30 minutes, ensuring it's in the future
const getCurrentTime = (): string => {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  
  // Round to nearest 30 minutes, but always round UP to ensure it's in the future
  if (minute <= 0) {
    minute = 30;
  } else if (minute <= 30) {
    minute = 30;
  } else {
    minute = 0;
    hour = (hour + 1) % 24;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};


interface SearchFilters {
  courseTitle: string;
  category: string;
  subcategory: string;
  date: string;
  time: string;
  location: string;
}

interface SearchResult {
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
}

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

function App() {
  const [filters, setFilters] = useState<SearchFilters>({
    courseTitle: '',
    category: '',
    subcategory: '',
    date: getCurrentDate(),
    time: getCurrentTime(),
    location: ''
  });
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allCourseTitles, setAllCourseTitles] = useState<string[]>([]);
  const [allDropIns, setAllDropIns] = useState<DropInRecord[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [locationURLMap, setLocationURLMap] = useState<Map<string, string>>(new Map());
  const [locationAddressMap, setLocationAddressMap] = useState<Map<string, string>>(new Map());
  const [locationCoordsMap, setLocationCoordsMap] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'earliest' | 'latest'>('alphabetical');
  const [mapKey, setMapKey] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResultCount, setLastResultCount] = useState(0);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsInitialLoading(true);
        setError(null);
        
        // Load recreation data and GeoJSON data in parallel
        const [{ locations, dropIns }, geoJSONData] = await Promise.all([
          getAllResources(),
          loadGeoJSONData()
        ]);
        
        // Extract unique course titles and locations
        const uniqueCourseTitles = [...new Set(dropIns.map(d => d["Course Title"]).filter(Boolean))].sort();
        
        
        // Create URL, address, and coordinates maps from GeoJSON data
        const urlMap = createLocationURLMap(geoJSONData);
        const coordsMap = createLocationCoordsMap(geoJSONData);
        const addressMap = new Map<string, string>();
        
        
        geoJSONData.features.forEach(feature => {
          const locationId = feature.properties.LOCATIONID;
          const address = feature.properties.ADDRESS;
          if (locationId && address && address !== 'None') {
            addressMap.set(locationId, address);
          }
        });
        
        
        setAllCourseTitles(uniqueCourseTitles);
        setAllDropIns(dropIns);
        setAllLocations(locations);
        setLocationURLMap(urlMap);
        setLocationAddressMap(addressMap);
        setLocationCoordsMap(coordsMap);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load recreation data. Please try again later.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter course titles based on selected category and subcategory

  const clearSearchResults = () => {
    setResults([]);
    setHasSearched(false);
    setSelectedLocation(undefined);
    setSortOrder('alphabetical');
    setMapKey(prev => prev + 1); // Force map remount
  };

  const handleLocationSelect = (location: string) => {
    // Toggle selection: if clicking the same location, deselect it
    const newSelectedLocation = selectedLocation === location ? undefined : location;
    setSelectedLocation(newSelectedLocation);
    
    // Trigger search refresh when location selection changes
    performSearch();
  };

  // Extract unique locations with coordinates for the map
  const mapLocations = React.useMemo(() => {
    const uniqueLocations = new Map<string, { name: string; lat: number; lng: number; address?: string; url?: string }>();
    
    // Create a mapping from location name to location ID
    const locationNameToIdMap = new Map<string, string>();
    allLocations.forEach(loc => {
      locationNameToIdMap.set(loc["Location Name"], loc["Location ID"].toString());
    });
    
    results.forEach(result => {
      if (!uniqueLocations.has(result.location)) {
        const locationId = locationNameToIdMap.get(result.location);
        
        if (locationId) {
          const coords = locationCoordsMap.get(locationId);
          
          if (coords) {
            // Find the location data from allLocations for address formatting
            const locationData = allLocations.find(loc => loc["Location ID"].toString() === locationId);
            
            // Format address from Locations.json data
            let formattedAddress = '';
            if (locationData) {
              const streetNo = locationData["Street No"] && locationData["Street No"] !== "None" ? locationData["Street No"] : '';
              const streetNoSuffix = locationData["Street No Suffix"] && locationData["Street No Suffix"] !== "None" ? locationData["Street No Suffix"] : '';
              const streetName = locationData["Street Name"] && locationData["Street Name"] !== "None" ? locationData["Street Name"] : '';
              const streetType = locationData["Street Type"] && locationData["Street Type"] !== "None" ? locationData["Street Type"] : '';
              const streetDirection = locationData["Street Direction"] && locationData["Street Direction"] !== "None" ? locationData["Street Direction"] : '';
              const postalCode = locationData["Postal Code"] && locationData["Postal Code"] !== "None" ? locationData["Postal Code"] : '';
              
              // Format: {Street Number}{Street No Suffix} {Street Name} {Street Type} {Street Direction}
              const streetAddress = [streetNo, streetNoSuffix, streetName, streetType, streetDirection]
                .filter(part => part && part !== "None")
                .join(' ');
              
              // Format: Toronto, ON  {Postal Code}
              const cityLine = postalCode ? `Toronto, ON  ${postalCode}` : 'Toronto, ON';
              
              formattedAddress = streetAddress ? `${streetAddress}\n${cityLine}` : cityLine;
            }
            
            uniqueLocations.set(result.location, {
              name: result.location,
              lat: coords.lat,
              lng: coords.lng,
              address: formattedAddress || undefined,
              url: result.locationURL || undefined
            });
          }
        }
      }
    });
    
    return Array.from(uniqueLocations.values());
  }, [results, locationCoordsMap, allLocations]);

  // Force map remount when transitioning from no results to having results
  useEffect(() => {
    const wasEmpty = lastResultCount === 0;
    const nowHasResults = results.length > 0;
    
    if (wasEmpty && nowHasResults) {
      setMapKey(prev => prev + 1);
    }
    
    setLastResultCount(results.length);
  }, [results.length, lastResultCount]);

  const performSearch = async (searchFilters?: SearchFilters) => {
    const currentFilters = searchFilters || filters;
    
    if (!currentFilters.date && !currentFilters.courseTitle && !currentFilters.location && !currentFilters.time && !currentFilters.category) {
      setResults([]);
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      let filteredResults = allDropIns;

      // Filter by category/subcategory first
      if (currentFilters.category) {
        const categoryFilteredTitles = getCourseTitlesForCategory(
          allCourseTitles,
          currentFilters.category,
          currentFilters.subcategory // Pass the actual subcategory value (empty string means "all subcategories")
        );
        
        
        filteredResults = filteredResults.filter(dropIn => 
          categoryFilteredTitles.includes(dropIn["Course Title"])
        );
      } else if (currentFilters.subcategory) {
        // When no category is selected but a subcategory is, filter by that subcategory across all categories
        filteredResults = filteredResults.filter(dropIn => {
          const categorizations = categorizeCourse(dropIn["Course Title"]);
          return categorizations.some(cat => cat.subcategory === currentFilters.subcategory);
        });
      }

      // Filter by specific course title (if selected)
      if (currentFilters.courseTitle) {
        filteredResults = filteredResults.filter(dropIn => 
          dropIn["Course Title"] === currentFilters.courseTitle
        );
      }

      // Filter by location
      if (currentFilters.location) {
        // Find the location ID for the selected location name
        const locationMap = new Map(allLocations.map(loc => [loc["Location Name"], loc["Location ID"]]));
        const selectedLocationId = locationMap.get(currentFilters.location);
        
        if (selectedLocationId) {
          filteredResults = filteredResults.filter(dropIn => 
            dropIn["Location ID"] === selectedLocationId
          );
        }
      }

      // Filter by date (if date is provided)
      if (currentFilters.date) {
        if (currentFilters.date === 'this-week') {
          // For "This week", show results from all days in the next 7 days
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          
          const todayStr = today.toISOString().split('T')[0];
          const nextWeekStr = nextWeek.toISOString().split('T')[0];
          
          filteredResults = filteredResults.filter(dropIn => {
            const firstDate = dropIn["First Date"];
            const lastDate = dropIn["Last Date"];
            
            // Check if the program runs during the next week
            return (firstDate <= nextWeekStr && lastDate >= todayStr);
          });
        } else {
          // For specific dates, use the existing logic
          const normalizedDate = normalizeDatePickerValue(currentFilters.date);
          filteredResults = filteredResults.filter(dropIn => 
            isDateInRange(normalizedDate, dropIn["Date Range"])
          );
        }
      }

      // Filter by time (if time is provided and not "Any Time")
      if (currentFilters.time && currentFilters.time !== 'Any Time') {
        const targetTime = formatTimeStringForComparison(currentFilters.time);
        filteredResults = filteredResults.filter(dropIn => {
          const startTime = formatTimeForComparison(dropIn["Start Hour"], dropIn["Start Minute"]);
          const endTime = formatTimeForComparison(dropIn["End Hour"], dropIn["End Min"]);
          // Show programs that start at or before the target time and end after the target time
          // This includes programs that start exactly at the target time
          return targetTime >= startTime && targetTime < endTime;
        });
      }

      // Convert to search results format
      const locationMap = new Map(allLocations.map(loc => [loc["Location ID"], loc["Location Name"]]));
      const searchResults: SearchResult[] = filteredResults.map(dropIn => {
        const locationName = locationMap.get(dropIn["Location ID"]) || 'Unknown Location';
        const startTime = `${dropIn["Start Hour"].toString().padStart(2, '0')}:${dropIn["Start Minute"].toString().padStart(2, '0')}`;
        const endTime = `${dropIn["End Hour"].toString().padStart(2, '0')}:${dropIn["End Min"].toString().padStart(2, '0')}`;
        
        const resultDate = currentFilters.date && currentFilters.date !== 'this-week' ? normalizeDatePickerValue(currentFilters.date) : dropIn["First Date"];
        
        // Get URL and address for this location using location ID
        const locationId = dropIn["Location ID"].toString();
        const locationURL = locationURLMap.get(locationId) || null;
        const locationAddress = locationAddressMap.get(locationId) || null;
        
        // Debug logging
        console.log('Location mapping for:', locationName, 'ID:', locationId, {
          hasURL: !!locationURL,
          hasAddress: !!locationAddress,
          address: locationAddress
        });
        
        // Get category information for this program
        const categorizations = categorizeCourse(dropIn["Course Title"]);
        const primaryCategory = categorizations.length > 0 ? categorizations[0] : null;
        
        return {
          courseTitle: dropIn["Course Title"],
          location: locationName,
          dayOfWeek: getDayOfWeek(dropIn["First Date"]),
          startTime: startTime,
          endTime: endTime,
          date: resultDate,
          locationURL: locationURL,
          locationAddress: locationAddress,
          category: primaryCategory?.category,
          subcategory: primaryCategory?.subcategory
        };
      });

      setResults(searchResults);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin mx-auto h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-600">Loading recreation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#f6f7f8] text-slate-800">
      <div className="flex flex-1 flex-col min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200/80 bg-white px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 text-[#13a4ec]">
              <svg width="98" height="32" preserveAspectRatio="xMidYMid" version="1.0" viewBox="0 0 441 144" xmlns="http://www.w3.org/2000/svg" zoomAndPan="magnify"><defs><clipPath id="ee99ce914c"><path d="m31.5 0h144v144h-144z"/></clipPath><clipPath id="12e0999432"><path d="m103.5 0c-39.766 0-72 32.234-72 72 0 39.766 32.234 72 72 72 39.766 0 72-32.234 72-72 0-39.766-32.234-72-72-72z"/></clipPath><clipPath id="ff1767cd20"><path d="m0.5 0h144v144h-144z"/></clipPath><clipPath id="68775b27e6"><path d="m72.5 0c-39.766 0-72 32.234-72 72 0 39.766 32.234 72 72 72 39.766 0 72-32.234 72-72 0-39.766-32.234-72-72-72z"/></clipPath><clipPath id="967b1ca997"><rect width="145" height="144"/></clipPath><clipPath id="6344cb8a01"><path d="m180 0h144v144h-144z"/></clipPath><clipPath id="2db6a0abd6"><path d="m252 0c-39.766 0-72 32.234-72 72 0 39.766 32.234 72 72 72 39.766 0 72-32.234 72-72 0-39.766-32.234-72-72-72z"/></clipPath><clipPath id="ee8444bc07"><path d="m0 0h144v144h-144z"/></clipPath><clipPath id="3c0a2ecd82"><path d="m72 0c-39.766 0-72 32.234-72 72 0 39.766 32.234 72 72 72 39.766 0 72-32.234 72-72 0-39.766-32.234-72-72-72z"/></clipPath><clipPath id="886ba6cf62"><rect width="144" height="144"/></clipPath><clipPath id="2cfd04c7da"><path d="m328.5 0h144v144h-144z"/></clipPath><clipPath id="9b60b8b4a2"><path d="m400.5 0c-39.766 0-72 32.234-72 72 0 39.766 32.234 72 72 72 39.766 0 72-32.234 72-72 0-39.766-32.234-72-72-72z"/></clipPath><clipPath id="5d130f6bbb"><path d="m0.5 0h144v144h-144z"/></clipPath><clipPath id="2b5599abba"><path d="m72.5 0c-39.766 0-72 32.234-72 72 0 39.766 32.234 72 72 72 39.766 0 72-32.234 72-72 0-39.766-32.234-72-72-72z"/></clipPath><clipPath id="a27b9fb08d"><rect width="145" height="144"/></clipPath></defs><g transform="translate(-31.5)" clip-path="url(#ee99ce914c)"><g clip-path="url(#12e0999432)"><g transform="translate(31)"><g clip-path="url(#967b1ca997)"><g clip-path="url(#ff1767cd20)"><g clip-path="url(#68775b27e6)"><path d="m0.5 0h144v144h-144z" fill="#13a4ec"/></g></g></g></g><path transform="matrix(.75 0 0 .75 31.5 2e-6)" d="m96-2.6667e-6c-53.021 0-96 42.979-96 96 0 53.021 42.979 96 96 96 53.021 0 96-42.979 96-96 0-53.021-42.979-96-96-96z" fill="none" stroke="#13a4ec" stroke-width="18"/></g></g><path d="m79.277 123.48-7.2812-7.2812 18.465-18.465-44.207-44.203-18.465 18.461-7.2773-7.2812 7.2773-7.5391-7.2773-7.2812 10.918-10.922-7.2773-7.543 7.2773-7.2773 7.543 7.2773 10.922-10.918 7.2812 7.2812 7.5391-7.2812 7.2812 7.2812-18.461 18.461 44.203 44.207 18.465-18.465 7.2812 7.2812-7.2812 7.543 7.2812 7.2812-10.922 10.918 7.2812 7.543-7.2812 7.2812-7.543-7.2812-10.918 10.922-7.2812-7.2812z" fill="#fff"/><g transform="translate(-31.5)" clip-path="url(#6344cb8a01)"><g clip-path="url(#2db6a0abd6)"><g transform="translate(180)"><g clip-path="url(#886ba6cf62)"><g clip-path="url(#ee8444bc07)"><g clip-path="url(#3c0a2ecd82)"><rect x="-290.88" y="-31.68" width="725.76" height="207.36" fill="#13a4ec"/></g></g></g></g><path transform="matrix(.75 0 0 .75 180 2e-6)" d="m96-2.6667e-6c-53.021 0-96 42.979-96 96 0 53.021 42.979 96 96 96s96-42.979 96-96c0-53.021-42.979-96-96-96z" fill="none" stroke="#13a4ec" stroke-width="18"/></g></g><path d="m168.49 118.8v-10.402c3.2969 0 5.7656-0.86718 7.4141-2.6016 1.6445-1.7344 4.8945-2.6016 9.75-2.6016s8.1914 0.86719 10.012 2.6016c1.8203 1.7344 4.2891 2.6016 7.4102 2.6016 3.1211 0 5.5898-0.86718 7.4102-2.6016 1.8203-1.7344 5.1602-2.6016 10.012-2.6016 4.8555 0 8.1914 0.86719 10.012 2.6016 1.8203 1.7344 4.2891 2.6016 7.4102 2.6016 3.1211 0 5.5938-0.86718 7.4102-2.6016 1.8203-1.7344 5.1602-2.6016 10.012-2.6016 4.8555 0 8.1055 0.86719 9.7539 2.6016 1.6445 1.7344 4.1172 2.6016 7.4102 2.6016v10.402c-5.1133 0-8.4727-0.86719-10.078-2.6016-1.6016-1.7344-3.9648-2.6016-7.0859-2.6016-3.1172 0-5.5898 0.86719-7.4102 2.6016-1.8203 1.7344-5.1562 2.6016-10.012 2.6016-4.8516 0-8.1914-0.86719-10.012-2.6016-1.8203-1.7344-4.2891-2.6016-7.4102-2.6016-3.1211 0-5.5898 0.86719-7.4102 2.6016-1.8203 1.7344-5.1562 2.6016-10.012 2.6016s-8.1914-0.86719-10.012-2.6016c-1.8203-1.7344-4.2891-2.6016-7.4102-2.6016-3.1211 0-5.4844 0.86719-7.0859 2.6016-1.6055 1.7344-4.9609 2.6016-10.078 2.6016zm0-23.406v-10.398c3.2969 0 5.7656-0.86719 7.4141-2.6016 1.6445-1.7344 4.8945-2.6016 9.75-2.6016s8.2109 0.86719 10.078 2.6016c1.8633 1.7344 4.3086 2.6016 7.3438 2.6016 3.1211 0 5.5898-0.86719 7.4102-2.6016 1.8203-1.7344 5.1602-2.6016 10.012-2.6016 4.8555 0 8.1914 0.86719 10.012 2.6016 1.8203 1.7344 4.2891 2.6016 7.4102 2.6016 3.1211 0 5.5938-0.86719 7.4102-2.6016 1.8203-1.7344 5.1602-2.6016 10.012-2.6016 4.8555 0 8.1055 0.86719 9.7539 2.6016 1.6445 1.7344 4.1172 2.6016 7.4102 2.6016v10.398c-5.1133 0-8.4727-0.86719-10.078-2.5977-1.6016-1.7344-3.9648-2.6016-7.0859-2.6016-3.1172 0-5.5234 0.86719-7.2148 2.6016-1.6914 1.7305-5.0938 2.5977-10.207 2.5977-4.9414 0-8.2969-0.86719-10.074-2.5977-1.7773-1.7344-4.2266-2.6016-7.3477-2.6016-3.293 0-5.7422 0.86719-7.3438 2.6016-1.6055 1.7305-4.9648 2.5977-10.078 2.5977s-8.5156-0.86719-10.207-2.5977c-1.6875-1.7344-4.0938-2.6016-7.2148-2.6016-3.1211 0-5.4844 0.86719-7.0859 2.6016-1.6055 1.7305-4.9609 2.5977-10.078 2.5977zm25.484-26.523 17.293-17.289-5.1992-5.2031c-2.8633-2.8594-5.8945-4.9414-9.1016-6.2383-3.207-1.3008-7.1523-1.9531-11.832-1.9531v-13c6.5 0 11.875 0.71484 16.121 2.1445 4.2461 1.4297 8.4062 4.1836 12.48 8.2578l33.285 33.281c-1.4727 0.95312-2.9023 1.7148-4.2891 2.2773s-2.9922 0.84375-4.8125 0.84375c-3.1211 0-5.5898-0.86719-7.4102-2.6016-1.8203-1.7305-5.1562-2.5977-10.012-2.5977-4.8516 0-8.1914 0.86719-10.012 2.5977-1.8203 1.7344-4.2891 2.6016-7.4102 2.6016-1.8203 0-3.4219-0.28125-4.8086-0.84375-1.3867-0.5625-2.8203-1.3242-4.293-2.2773zm50.969-43.684c3.6406 0 6.7148 1.2773 9.2305 3.8359 2.5117 2.5547 3.7695 5.6094 3.7695 9.1641 0 3.6406-1.2578 6.7188-3.7695 9.2305-2.5156 2.5156-5.5898 3.7734-9.2305 3.7734-3.6406 0-6.7188-1.2578-9.2344-3.7734-2.5117-2.5117-3.7695-5.5898-3.7695-9.2305 0-3.5547 1.2578-6.6094 3.7695-9.1641 2.5156-2.5586 5.5938-3.8359 9.2344-3.8359z" fill="#fff"/><g transform="translate(-31.5)" clip-path="url(#2cfd04c7da)"><g clip-path="url(#9b60b8b4a2)"><g transform="translate(328)"><g clip-path="url(#a27b9fb08d)"><g clip-path="url(#5d130f6bbb)"><g clip-path="url(#2b5599abba)"><path d="m0.5 0h144v144h-144z" fill="#13a4ec"/></g></g></g></g><path transform="matrix(.75 0 0 .75 328.5 2e-6)" d="m96-2.6667e-6c-53.021 0-96 42.979-96 96 0 53.021 42.979 96 96 96 53.021 0 96-42.979 96-96 0-53.021-42.979-96-96-96z" fill="none" stroke="#13a4ec" stroke-width="18"/></g></g><path d="m340.42 84.867c1.6445 1.6484 3.4648 2.8633 5.457 3.6406 1.9961 0.78125 4.0742 1.1719 6.2422 1.1719s4.2461-0.39063 6.2422-1.1719c1.9922-0.77734 3.8125-1.9922 5.4609-3.6406l4.6797-4.6797c1.6484-1.6445 2.8594-3.4648 3.6406-5.4609 0.78125-1.9922 1.168-4.0742 1.168-6.2383 0-2.168-0.38672-4.2266-1.168-6.1758-0.78125-1.9531-1.9922-3.75-3.6406-5.3984l-19.762-19.762c-1.043-1.0391-2.2774-1.5586-3.707-1.5586-1.4297 0-2.6641 0.51953-3.707 1.5586l-20.539 20.672c-1.043 1.0391-1.5625 2.2539-1.5625 3.6406 0 1.3867 0.51953 2.6016 1.5625 3.6406zm59.805 39.137-30.555-30.555c-2.5117 2.2539-5.3086 3.9023-8.3828 4.9414-3.0781 1.0391-6.1758 1.5586-9.2969 1.5586-3.4688 0-6.8281-0.64844-10.078-1.9492s-6.1758-3.25-8.7734-5.8516l-19.766-19.633c-1.4727-1.4727-2.5977-3.1836-3.3789-5.1328-0.78125-1.9531-1.1719-3.9219-1.1719-5.918 0-1.9922 0.39062-3.9648 1.1719-5.9141 0.78125-1.9531 1.9062-3.6641 3.3789-5.1367l20.676-20.672c1.4727-1.4727 3.1836-2.6016 5.1328-3.3828 1.9531-0.77734 3.9219-1.168 5.918-1.168 1.9922 0 3.9648 0.39062 5.9141 1.168 1.9492 0.78125 3.6641 1.9102 5.1367 3.3828l19.633 19.762c2.6016 2.6016 4.5508 5.5273 5.8516 8.7773 1.2969 3.25 1.9492 6.6094 1.9492 10.074 0 3.1211-0.54297 6.2188-1.625 9.2969-1.0859 3.0781-2.7539 5.8711-5.0078 8.3867l30.688 30.684zm4.8125-67.609c-5.0273 0-9.3203-1.7773-12.871-5.332-3.5547-3.5508-5.332-7.8438-5.332-12.871s1.7773-9.3164 5.332-12.871c3.5508-3.5547 7.8438-5.332 12.871-5.332 5.0274 0 9.3164 1.7773 12.871 5.332 3.5547 3.5547 5.332 7.8438 5.332 12.871s-1.7774 9.3203-5.332 12.871c-3.5547 3.5547-7.8438 5.332-12.871 5.332zm0-10.402c2.168 0 4.0078-0.75781 5.5234-2.2734 1.5195-1.5156 2.2773-3.3594 2.2773-5.5273 0-2.1641-0.75781-4.0078-2.2773-5.5234-1.5156-1.5195-3.3555-2.2773-5.5234-2.2773s-4.0078 0.75781-5.5273 2.2773c-1.5156 1.5156-2.2734 3.3594-2.2734 5.5234 0 2.168 0.75781 4.0117 2.2734 5.5273 1.5195 1.5156 3.3594 2.2734 5.5273 2.2734z" fill="#fff"/></svg>
            </div>
            <h2 className="text-lg font-bold">Drop-in Rec Finder</h2>
          </div>
          <a className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-100 transition-colors" href="#">
            <span className="material-symbols-outlined text-slate-500">
              info
            </span>
          </a>
        </header>

        {/* Main content area - Responsive layout */}
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          {/* Search Form - Full width on mobile, sidebar on desktop */}
          <aside className="w-full lg:w-[460px] flex-shrink-0 border-r-0 lg:border-r border-slate-200 bg-white flex flex-col min-h-0">
            <SearchForm
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={performSearch}
              onClearResults={clearSearchResults}
              isLoading={isLoading}
              allDropIns={allDropIns}
              courseTitles={allCourseTitles}
              locations={allLocations.map(loc => loc["Location Name"])}
              allLocations={allLocations}
            />
            <div className="flex-1 min-h-0 lg:block hidden">
              <SearchResults
                results={results}
                isLoading={isLoading}
                hasSearched={hasSearched}
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
              />
            </div>
          </aside>

          {/* Map - Full width on mobile, right side on desktop */}
          <main className="flex-1 min-h-0">
            <div className="relative h-full w-full">
              <LocationMap key={mapKey} locations={mapLocations} isLoading={isLoading} selectedLocation={selectedLocation} onLocationSelect={handleLocationSelect} />
            </div>
          </main>
        </div>

        {/* Mobile Results - Bottom sheet on mobile */}
        <div className="lg:hidden">
          <SearchResults
            results={results}
            isLoading={isLoading}
            hasSearched={hasSearched}
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
