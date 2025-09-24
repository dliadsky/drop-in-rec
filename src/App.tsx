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
  const [courseTitles, setCourseTitles] = useState<string[]>([]);
  const [allCourseTitles, setAllCourseTitles] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
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
        
        // Get unique location names by matching Location ID with locations data
        const locationMap = new Map(locations.map(loc => [loc["Location ID"], loc["Location Name"]]));
        const uniqueLocationNames = [...new Set(dropIns.map(d => locationMap.get(d["Location ID"])).filter(Boolean))].sort() as string[];
        
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
        
        
        setCourseTitles(uniqueCourseTitles);
        setAllCourseTitles(uniqueCourseTitles);
        setLocations(uniqueLocationNames);
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
  useEffect(() => {
    if (filters.category) {
      // When a specific category is selected, filter by that category and subcategory
      const filteredTitles = getCourseTitlesForCategory(
        allCourseTitles,
        filters.category,
        filters.subcategory // Pass the actual subcategory value (empty string means "all subcategories")
      );
      setCourseTitles(filteredTitles);
    } else if (filters.subcategory) {
      // When no category is selected but a subcategory is, filter by that subcategory across all categories
      const filteredTitles = allCourseTitles.filter(title => {
        // Check if this title matches the selected subcategory in any category
        const categorizations = categorizeCourse(title);
        return categorizations.some(cat => cat.subcategory === filters.subcategory);
      });
      setCourseTitles(filteredTitles);
    } else {
      // Show all course titles when neither category nor subcategory is selected
      setCourseTitles(allCourseTitles);
    }
  }, [filters.category, filters.subcategory, allCourseTitles]);

  const clearSearchResults = () => {
    setResults([]);
    setHasSearched(false);
    setSelectedLocation(undefined);
    setSortOrder('alphabetical');
    setMapKey(prev => prev + 1); // Force map remount
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
  };

  // Extract unique locations with coordinates for the map
  const mapLocations = React.useMemo(() => {
    const uniqueLocations = new Map<string, { name: string; lat: number; lng: number; address?: string }>();
    
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
            uniqueLocations.set(result.location, {
              name: result.location,
              lat: coords.lat,
              lng: coords.lng,
              address: result.locationAddress || undefined
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

  const performSearch = async () => {
    if (!filters.date && !filters.courseTitle && !filters.location && !filters.time && !filters.category) {
      setResults([]);
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      let filteredResults = allDropIns;

      // Filter by category/subcategory first
      if (filters.category) {
        const categoryFilteredTitles = getCourseTitlesForCategory(
          allCourseTitles,
          filters.category,
          filters.subcategory // Pass the actual subcategory value (empty string means "all subcategories")
        );
        
        filteredResults = filteredResults.filter(dropIn => 
          categoryFilteredTitles.includes(dropIn["Course Title"])
        );
      } else if (filters.subcategory) {
        // When no category is selected but a subcategory is, filter by that subcategory across all categories
        filteredResults = filteredResults.filter(dropIn => {
          const categorizations = categorizeCourse(dropIn["Course Title"]);
          return categorizations.some(cat => cat.subcategory === filters.subcategory);
        });
      }

      // Filter by specific course title (if selected)
      if (filters.courseTitle) {
        filteredResults = filteredResults.filter(dropIn => 
          dropIn["Course Title"] === filters.courseTitle
        );
      }

      // Filter by location
      if (filters.location) {
        // Find the location ID for the selected location name
        const locationMap = new Map(allLocations.map(loc => [loc["Location Name"], loc["Location ID"]]));
        const selectedLocationId = locationMap.get(filters.location);
        
        if (selectedLocationId) {
          filteredResults = filteredResults.filter(dropIn => 
            dropIn["Location ID"] === selectedLocationId
          );
        }
      }

      // Filter by date (if date is provided)
      if (filters.date) {
        if (filters.date === 'this-week') {
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
          const normalizedDate = normalizeDatePickerValue(filters.date);
          filteredResults = filteredResults.filter(dropIn => 
            isDateInRange(normalizedDate, dropIn["Date Range"])
          );
        }
      }

      // Filter by time (if time is provided and not "Any Time")
      if (filters.time && filters.time !== 'Any Time') {
        const targetTime = formatTimeStringForComparison(filters.time);
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
        
        const resultDate = filters.date && filters.date !== 'this-week' ? normalizeDatePickerValue(filters.date) : dropIn["First Date"];
        
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
        
        return {
          courseTitle: dropIn["Course Title"],
          location: locationName,
          dayOfWeek: getDayOfWeek(dropIn["First Date"]),
          startTime: startTime,
          endTime: endTime,
          date: resultDate,
          locationURL: locationURL,
          locationAddress: locationAddress
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Toronto Drop-in Recreation
          </h1>
          <p className="text-lg text-gray-600">
            Find drop-in recreation programs by date, time, and location
          </p>
        </header>

        <SearchForm
          filters={filters}
          onFiltersChange={setFilters}
          courseTitles={courseTitles}
          locations={locations}
          onSearch={performSearch}
          onClearResults={clearSearchResults}
          isLoading={isLoading}
          allDropIns={allDropIns}
        />

        {/* Main content area with sidebar layout */}
        <div className="flex gap-6 mt-8">
          {/* Left sidebar - Search Results */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg shadow-lg p-4" style={{ height: 'calc(100vh - 200px)' }}>
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

          {/* Right side - Map */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg shadow-lg p-4" style={{ height: 'calc(100vh - 200px)' }}>
              <LocationMap key={mapKey} locations={mapLocations} isLoading={isLoading} selectedLocation={selectedLocation} onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
