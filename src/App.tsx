import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import LocationMap from './components/LocationMap';
import AppHeader from './components/AppHeader';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import { useAppData } from './hooks/useAppData';
import { useSearchLogic } from './hooks/useSearchLogic';

function App() {
  const { 
    allCourseTitles, 
    allDropIns, 
    allLocations, 
    locationURLMap, 
    locationAddressMap, 
    locationCoordsMap, 
    isInitialLoading, 
    error 
  } = useAppData();

  const {
    filters,
    setFilters,
    results,
    isLoading,
    hasSearched,
    selectedLocation,
    sortOrder,
    setSortOrder,
    mapLocations,
    availableLocationNames,
    performSearch,
    handleLocationSelect
  } = useSearchLogic(allDropIns, allLocations, locationURLMap, locationAddressMap, locationCoordsMap);

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <div className="relative flex min-h-screen lg:h-screen w-full flex-col bg-[#f6f7f8] dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <div className="flex flex-1 flex-col min-h-0">
        {/* Header */}
        <AppHeader onAboutClick={() => {}} />

        {/* Main content area - Responsive layout */}
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          {/* Search Form - Full width on mobile, sidebar on desktop */}
          <aside className="w-full lg:w-[460px] flex-shrink-0 border-r-0 lg:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col min-h-0">
            <SearchForm
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={performSearch}
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
                onSortOrderChange={(sortOrder: 'alphabetical' | 'earliest' | 'latest' | 'open-longest') => setSortOrder(sortOrder)}
              />
            </div>
          </aside>

          {/* Map and Results - Full width on mobile, right side on desktop */}
          <main className="flex-1 min-h-0 flex flex-col lg:block">
            {/* Map - Above results on mobile, full area on desktop */}
            <div className="relative h-[300px] lg:h-full w-full">
              <LocationMap 
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
      </div>
  );
}

export default App;
