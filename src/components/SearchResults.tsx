import React from 'react';

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

// Helper function to format date for display without timezone issues
const formatDateForDisplay = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to create Google Maps directions URL using location name and address
const createGoogleMapsURL = (locationName: string, address: string): string => {
  const fullDestination = `${locationName}, ${address}, Toronto, ON, Canada`;
  const encodedAddress = encodeURIComponent(fullDestination);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
};

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  onLocationSelect?: (location: string) => void;
  selectedLocation?: string;
  sortOrder: 'alphabetical' | 'earliest' | 'latest';
  onSortOrderChange: (sortOrder: 'alphabetical' | 'earliest' | 'latest') => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading, hasSearched, onLocationSelect, selectedLocation, sortOrder, onSortOrderChange }) => {
  const selectedCardRef = React.useRef<HTMLDivElement>(null);

  // Scroll to selected card when location is selected
  React.useEffect(() => {
    if (selectedLocation && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedLocation]);

  // Sort results based on sort order
  const sortedResults = React.useMemo(() => {
    const sorted = [...results].sort((a, b) => {
      switch (sortOrder) {
        case 'alphabetical':
          return a.location.localeCompare(b.location);
        case 'earliest':
          return a.startTime.localeCompare(b.startTime);
        case 'latest':
          return b.endTime.localeCompare(a.endTime);
        default:
          return 0;
      }
    });
    return sorted;
  }, [results, sortOrder]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg text-gray-600">Loading results...</span>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg">Enter your search criteria above to find drop-in recreation programs</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709" />
          </svg>
          <p className="text-lg">No programs found matching your criteria</p>
          <p className="text-sm mt-2">Try adjusting your search filters</p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-800">
          Results ({results.length})
        </h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-select" className="text-sm text-gray-600">
            Sort:
          </label>
          <select
            id="sort-select"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'alphabetical' | 'earliest' | 'latest')}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="earliest">Open Earliest</option>
            <option value="latest">Open Latest</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {sortedResults.map((result, index) => (
          <div 
            key={index} 
            ref={selectedLocation === result.location ? selectedCardRef : null}
            className={`border rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer ${
              selectedLocation === result.location 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => onLocationSelect?.(result.location)}
          >
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm leading-tight">{result.courseTitle}</h4>
                <p className="text-xs text-gray-500">Program</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-800 text-sm">
                    {result.location}
                </p>
                <p className="text-xs text-gray-500">Location</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{formatDateForDisplay(result.date)}</p>
                    <p className="text-xs text-gray-500">Date</p>
                </div>
                <div className="text-right">
                    <p className="font-medium text-gray-800 text-sm">{result.startTime} - {result.endTime}</p>
                    <p className="text-xs text-gray-500">Time</p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="mt-3 flex flex-wrap gap-1">
              {result.locationAddress && (
                 <a
                      href={result.locationURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Link to City of Toronto
                </a>
              )}

              {result.locationAddress && (
                <a
                  href={createGoogleMapsURL(result.location, result.locationAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Directions
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
