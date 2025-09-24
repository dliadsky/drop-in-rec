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
            <div className="h-8 w-8 text-[#13a4ec]">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold">Drop-in Rec</h2>
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
