import React, { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import LocationMap from './components/LocationMap';
import { getAllResources, getDayOfWeek, formatTimeForComparison, formatTimeStringForComparison, isDateInRange, normalizeDatePickerValue } from './services/api';
import { categorizeCourse, courseMatchesCategory, categories } from './services/categories';
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

// Helper function to get default date - if it's late in the day, default to tomorrow
const getDefaultDate = (): string => {
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
  
  // Otherwise, use today
  return getCurrentDate();
};

// Helper function to get default time - if it's late in the day or early morning, default to "Any Time"
const getDefaultTime = (): string => {
  const now = new Date();
  const hour = now.getHours();
  
  // If it's after 10 PM or before 6 AM, default to "Any Time"
  if (hour >= 22 || hour < 6) {
    return 'Any Time';
  }
  
  // Otherwise, use current time
  return getCurrentTime();
};


interface SearchFilters {
  courseTitle: string;
  category: string;
  subcategory: string;
  date: string;
  time: string;
  location: string[];
  age: string;
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
  ageRange?: string;
  "Age Min"?: string;
  "Age Max"?: string;
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
    date: getDefaultDate(),
    time: getDefaultTime(),
    location: [],
    age: ''
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Close modal when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAboutModal) {
        const target = event.target as Element;
        if (target.hasAttribute('data-modal-backdrop')) {
          setShowAboutModal(false);
        }
      }
    };

    if (showAboutModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAboutModal]);

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
        
        // Filter drop-ins to only include programs available in the upcoming week
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const todayStr = today.toISOString().split('T')[0];
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        
        const filteredDropIns = dropIns.filter(dropIn => {
          const firstDate = dropIn["First Date"];
          const lastDate = dropIn["Last Date"];
          
          // Check if the program runs during the next week
          return (firstDate <= nextWeekStr && lastDate >= todayStr);
        });
        
        // Extract unique course titles and locations from filtered data
        const uniqueCourseTitles = [...new Set(filteredDropIns.map(d => d["Course Title"]).filter(Boolean))].sort();
        
        
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
        setAllDropIns(filteredDropIns);
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

  // Trigger initial search when data is loaded (but not if URL has parameters)
  useEffect(() => {
    if (allDropIns.length > 0 && !hasSearched) {
      // Check if there are URL parameters - if so, let SearchForm handle the search
      const params = new URLSearchParams(window.location.search);
      if (params.toString()) {
        return;
      }
      performSearch();
    }
  }, [allDropIns.length, hasSearched]);

  // Filter course titles based on selected category and subcategory

  const clearSearchResults = () => {
    setResults([]);
    setHasSearched(false);
    setSelectedLocation(undefined);
    setSortOrder('alphabetical');
  };

  const handleLocationSelect = (location: string) => {
    // Toggle selection: if clicking the same location, deselect it
    const newSelectedLocation = selectedLocation === location ? undefined : location;
    setSelectedLocation(newSelectedLocation);
    
    // Trigger search refresh when location selection changes
    performSearch();
  };

  // Extract unique locations with coordinates for the map and location list
  const mapLocations = React.useMemo(() => {
    const uniqueLocations = new Map<string, { name: string; lat: number; lng: number; address?: string; url?: string }>();
    
    // Create a mapping from location name to location ID
    const locationNameToIdMap = new Map<string, string>();
    allLocations.forEach(loc => {
      locationNameToIdMap.set(loc["Location Name"], loc["Location ID"].toString());
    });
    
    // Helper function to add a location to the map
    const addLocationToMap = (locationName: string) => {
      if (!uniqueLocations.has(locationName)) {
        const locationId = locationNameToIdMap.get(locationName);
        
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
            
            // Get URL from locationURLMap using location ID
            const locationIdForURL = locationData ? locationData["Location ID"].toString() : locationId;
            const locationURL = locationURLMap.get(locationIdForURL) || undefined;
            
            uniqueLocations.set(locationName, {
              name: locationName,
              lat: coords.lat,
              lng: coords.lng,
              address: formattedAddress || undefined,
              url: locationURL
            });
          }
        }
      }
    };
    
    // Check if we have any active filters
    const hasActiveFilters = filters.courseTitle || filters.category || filters.subcategory || 
                            filters.location.length > 0 || filters.age || 
                            (filters.date && filters.date !== getDefaultDate()) || 
                            (filters.time && filters.time !== 'Any Time');
    
    // If we have searched (hasSearched is true), only show results and selected locations
    // If we haven't searched yet, show all locations with programs
    if (hasSearched || hasActiveFilters) {
      // Only show locations from results and selected locations
      // Add locations from results
      results.forEach(result => {
        addLocationToMap(result.location);
      });
      
      // Add selected locations (even if they don't have results)
      filters.location.forEach(selectedLocationName => {
        addLocationToMap(selectedLocationName);
      });
    } else {
      // No active filters - show all locations that have programs in the upcoming week
      const locationsWithPrograms = new Set<number>();
      allDropIns.forEach(dropIn => {
        locationsWithPrograms.add(dropIn["Location ID"]);
      });
      
      // Add locations that have programs in the upcoming week
      allLocations.forEach(location => {
        if (locationsWithPrograms.has(location["Location ID"])) {
          const locationName = location["Location Name"];
          const locationId = location["Location ID"].toString();
          const coords = locationCoordsMap.get(locationId);
          
          if (coords) {
            // Format address from Locations.json data
            let formattedAddress = '';
            const streetNo = location["Street No"] && location["Street No"] !== "None" ? location["Street No"] : '';
            const streetNoSuffix = location["Street No Suffix"] && location["Street No Suffix"] !== "None" ? location["Street No Suffix"] : '';
            const streetName = location["Street Name"] && location["Street Name"] !== "None" ? location["Street Name"] : '';
            const streetType = location["Street Type"] && location["Street Type"] !== "None" ? location["Street Type"] : '';
            const streetDirection = location["Street Direction"] && location["Street Direction"] !== "None" ? location["Street Direction"] : '';
            const postalCode = location["Postal Code"] && location["Postal Code"] !== "None" ? location["Postal Code"] : '';
            
            // Format: {Street Number}{Street No Suffix} {Street Name} {Street Type} {Street Direction}
            const streetAddress = [streetNo, streetNoSuffix, streetName, streetType, streetDirection]
              .filter(part => part && part !== "None")
              .join(' ');
            
            // Format: Toronto, ON  {Postal Code}
            const cityLine = postalCode ? `Toronto, ON  ${postalCode}` : 'Toronto, ON';
            
            formattedAddress = streetAddress ? `${streetAddress}\n${cityLine}` : cityLine;
            
            // Get URL from locationURLMap using location ID
            const locationId = location["Location ID"].toString();
            const locationURL = locationURLMap.get(locationId) || undefined;
            
            uniqueLocations.set(locationName, {
              name: locationName,
              lat: coords.lat,
              lng: coords.lng,
              address: formattedAddress || undefined,
              url: locationURL
            });
        }
      }
    });
    }
    
    return Array.from(uniqueLocations.values());
  }, [results, locationCoordsMap, allLocations, allDropIns, locationURLMap, filters.location, filters.courseTitle, filters.category, filters.subcategory, filters.age, filters.date, filters.time, hasSearched]);

  // Create a list of location names that should be available in the dropdown
  // Since allDropIns is already filtered to upcoming week, this will only show relevant locations
  const availableLocationNames = React.useMemo(() => {
    // Get all locations that have programs in the upcoming week
    const locationsWithPrograms = new Set<number>();
    allDropIns.forEach(dropIn => {
      locationsWithPrograms.add(dropIn["Location ID"]);
    });
    
    // Return location names that have programs
    return allLocations
      .filter(location => locationsWithPrograms.has(location["Location ID"]))
      .map(location => location["Location Name"]);
  }, [allDropIns, allLocations]);


  const performSearch = async (searchFilters?: SearchFilters) => {
    const currentFilters = searchFilters || filters;
    
    // Show all programs by default - only return empty if explicitly requested
    // (This allows the app to show all programs on initial load)

    setIsLoading(true);
    setHasSearched(true);

    try {
      let filteredResults = allDropIns;

      // Filter by category/subcategory first
      if (currentFilters.category) {
        // Use the new courseMatchesCategory function with age filtering
        filteredResults = filteredResults.filter(dropIn => {
          const courseTitle = dropIn["Course Title"];
          if (!courseTitle) return false;
          
          if (currentFilters.subcategory) {
            // Both category and subcategory specified - use additive age filtering
            return courseMatchesCategory(courseTitle, currentFilters.category, currentFilters.subcategory, dropIn["Age Min"], dropIn["Age Max"]);
          } else {
            // Only category specified
            return courseMatchesCategory(courseTitle, currentFilters.category, undefined, dropIn["Age Min"], dropIn["Age Max"]);
          }
        });
      } else if (currentFilters.subcategory) {
        // When no category is selected but a subcategory is, filter by that subcategory across all categories
        // Find which category this subcategory belongs to
        const parentCategory = categories.find(cat => 
          cat.subcategories.some(sub => sub.id === currentFilters.subcategory)
        );
        
        if (parentCategory) {
        filteredResults = filteredResults.filter(dropIn => {
            const courseTitle = dropIn["Course Title"];
            if (!courseTitle) return false;
            return courseMatchesCategory(courseTitle, parentCategory.id, currentFilters.subcategory, dropIn["Age Min"], dropIn["Age Max"]);
        });
        }
      }

      // Filter by specific course title (if selected)
      if (currentFilters.courseTitle) {
        filteredResults = filteredResults.filter(dropIn => 
          dropIn["Course Title"] === currentFilters.courseTitle
        );
      }

      // Filter by location
      if (currentFilters.location.length > 0) {
        // Find the location IDs for the selected location names
        const locationMap = new Map(allLocations.map(loc => [loc["Location Name"], loc["Location ID"]]));
        const selectedLocationIds = currentFilters.location
          .map(locationName => locationMap.get(locationName))
          .filter(id => id !== undefined);
        
        if (selectedLocationIds.length > 0) {
          filteredResults = filteredResults.filter(dropIn => 
            selectedLocationIds.includes(dropIn["Location ID"])
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

      // Filter by age (if age is provided)
      if (currentFilters.age) {
        const selectedAge = parseInt(currentFilters.age);
        filteredResults = filteredResults.filter(dropIn => {
          const ageMin = parseInt(dropIn["Age Min"]) || 0;
          const ageMax = dropIn["Age Max"] === "None" ? 999 : parseInt(dropIn["Age Max"]) || 999;
          
          // Check if the selected age falls within the program's age range
          return selectedAge >= ageMin && selectedAge <= ageMax;
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
        
        // Debug logging removed for performance
        
        // Get category information for this program
        const categorizations = categorizeCourse(dropIn["Course Title"], dropIn["Age Min"], dropIn["Age Max"]);
        const primaryCategory = categorizations.length > 0 ? categorizations[0] : null;
        
        // Calculate age range display
        const ageMin = dropIn["Age Min"];
        const ageMax = dropIn["Age Max"];
        let ageRange = '';
        if (ageMax === "None") {
          ageRange = `Ages ${ageMin}+`;
        } else {
          ageRange = `Ages ${ageMin}-${ageMax}`;
        }
        
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
          subcategory: primaryCategory?.subcategory,
          ageRange: ageRange,
          "Age Min": dropIn["Age Min"],
          "Age Max": dropIn["Age Max"]
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
    <div className="relative flex h-screen w-full flex-col bg-[#f6f7f8] dark:bg-slate-900 text-slate-800 dark:text-slate-200" style={{ minHeight: '100vh' }}>
      <div className="flex flex-1 flex-col min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-4 sm:px-6 py-3">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity hover:text-black dark:hover:text-white">
            <div className="h-8 w-24 text-[#13a4ec] flex-shrink-0">
              <img 
                src="drop-in-rec-logo.svg" 
                alt="Toronto Drop-in Recreation Finder Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-lg font-bold leading-tight text-slate-800 dark:text-slate-200">
              <span className="hidden sm:inline">Toronto Drop-in Recreation Finder</span>
              <span className="sm:hidden">
                Toronto Drop-in<br />
                Recreation Finder
              </span>
            </h2>
          </a>
          <button 
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={() => setShowAboutModal(true)}
          >
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
              info
            </span>
          </button>
        </header>

        {/* Main content area - Responsive layout */}
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          {/* Search Form - Full width on mobile, sidebar on desktop */}
          <aside className="w-full lg:w-[460px] flex-shrink-0 border-r-0 lg:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col min-h-0">
            <SearchForm
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={performSearch}
              onClearResults={clearSearchResults}
              isLoading={isLoading}
              allDropIns={allDropIns}
              courseTitles={allCourseTitles}
              locations={availableLocationNames}
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

          {/* Map and Results - Full width on mobile, right side on desktop */}
          <main className="flex-1 min-h-0 flex flex-col lg:block">
            {/* Map - Above results on mobile, full area on desktop */}
            <div className="relative h-[300px] lg:h-full w-full">
              <LocationMap 
                key={`${mapLocations.length}-${results.length}-${hasSearched}`}
                locations={mapLocations} 
                isLoading={isLoading} 
                selectedLocation={selectedLocation} 
                onLocationSelect={handleLocationSelect}
                selectedLocations={filters.location}
                locationHasResults={(locationName) => {
                  // Check if any results exist for this specific location
                  return results.some(result => result.location === locationName);
                }}
              />
        </div>

            {/* Mobile Results - Below map on mobile, hidden on desktop */}
            <div className="lg:hidden flex-1 min-h-0">
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
          </main>
        </div>
      </div>
      
      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-modal-backdrop>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-200">About Toronto Drop-in Recreation Finder</h2>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">What is this tool?</h3>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                  The Toronto Drop-in Recreation Finder helps you discover recreational programs and activities 
                  available across the city. Whether you're looking for sports, arts, fitness, or family activities, 
                  this tool connects you with programs that match your interests, schedule, and location.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">How to use it</h3>
                <ul className="text-gray-700 dark:text-slate-300 space-y-2">
                  <li className="flex items-start">
                    <span className="material-symbols-outlined text-[#13a4ec] mr-2 mt-0.5 text-sm">search</span>
                    <span><strong>Search by category:</strong> Browse programs by type (Sports, Arts, Fitness, etc.)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-symbols-outlined text-[#13a4ec] mr-2 mt-0.5 text-sm">schedule</span>
                    <span><strong>Filter by time:</strong> Find programs that fit your schedule</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-symbols-outlined text-[#13a4ec] mr-2 mt-0.5 text-sm">location_on</span>
                    <span><strong>Find nearby locations:</strong> Discover programs in your area</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-symbols-outlined text-[#13a4ec] mr-2 mt-0.5 text-sm">share</span>
                    <span><strong>Share your search:</strong> Save and share your favorite filter combinations</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">Data source</h3>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                  This tool uses <a className="text-[#13a4ec]" href="https://open.toronto.ca/catalogue/?search=recreation&sort=score%20desc" target="_blank">open data</a> from the City of Toronto's drop-in recreation programs and facilities. 
                  It does not include data about the City's registered recreation programming such as lessons and classes.
                  Data are retrieved nightly to ensure accuracy, but last-minute program changes and availability may not be accuractely reflected here. 
                  For the most current information, please contact the specific recreation centre.
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Built with 🖤 by <a className="text-[#13a4ec] hover:text-[#13a4ec]/80" href="https://purposeanalytics.ca" target="_blank">Purpose Analytics</a> for the Toronto community. 
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a 
                        href="https://www.linkedin.com/company/purpose-analytics" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-500 dark:text-slate-400 hover:text-[#0077b5] transition-colors"
                        title="Purpose Analytics LinkedIn"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                    </a>
                    <a 
                      href="https://github.com/dliadsky/drop-in-rec" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                      title="View on GitHub"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
        </div>
      </div>
        </div>
      )}
      </div>
  );
}

export default App;
