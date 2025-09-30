import { useState, useCallback, useMemo, useEffect } from 'react';
import { courseMatchesCategory } from '../services/categories';

export const useAutocomplete = (
  allDropIns: any[],
  courseTitles: string[],
  locations: string[],
  allLocations: any[],
  filters: any,
  searchInputs: { location: string; program: string }
) => {
  // State for autocomplete dropdowns
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // State for infinite scrolling
  const [programDropdownPage, setProgramDropdownPage] = useState(1);
  const [locationDropdownPage, setLocationDropdownPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  // Debounced search input change for better performance
  const [debouncedProgramInput, setDebouncedProgramInput] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProgramInput(searchInputs.program);
    }, 150); // 150ms debounce
    
    return () => clearTimeout(timer);
  }, [searchInputs.program]);

  // Reset pagination when search changes
  useEffect(() => {
    setProgramDropdownPage(1);
  }, [debouncedProgramInput, filters.category, filters.subcategory]);

  useEffect(() => {
    setLocationDropdownPage(1);
  }, [searchInputs.location]);

  // Pre-compute locations that have programs (memoized separately for performance)
  const locationsWithPrograms = useMemo(() => {
    const locationSet = new Set<string>();
    allDropIns.forEach(dropIn => {
      const locationId = dropIn["Location ID"];
      const location = allLocations.find(loc => loc["Location ID"] === locationId);
      if (location?.["Location Name"]) {
        locationSet.add(location["Location Name"]);
      }
    });
    return locationSet;
  }, [allDropIns, allLocations]);

  // Pre-filter by category/subcategory (expensive operation, memoized separately)
  const categoryFilteredPrograms = useMemo(() => {
    if (!filters.category) {
      return courseTitles;
    }
    
    if (filters.subcategory) {
      // Filter by specific subcategory - need to check against actual drop-in data for age filtering
      return allDropIns
        .filter(dropIn => {
          const courseTitle = dropIn["Course Title"];
          if (!courseTitle) return false;
          return courseMatchesCategory(courseTitle, filters.category, filters.subcategory, dropIn["Age Min"], dropIn["Age Max"]);
        })
        .map(dropIn => dropIn["Course Title"])
        .filter((title, index, self) => self.indexOf(title) === index); // Remove duplicates
    } else {
      // Filter by category (all subcategories)
      return courseTitles.filter(title => 
        courseMatchesCategory(title, filters.category)
      );
    }
  }, [courseTitles, filters.category, filters.subcategory, allDropIns]);

  // Get all filtered programs (without pagination)
  const allFilteredPrograms = useMemo(() => {
    let filtered = categoryFilteredPrograms;
    
    // Filter by search text (if any) - this is fast
    if (debouncedProgramInput) {
      const searchLower = debouncedProgramInput.toLowerCase();
      filtered = filtered.filter(title => 
        title.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered.sort((a, b) => a.localeCompare(b));
  }, [categoryFilteredPrograms, debouncedProgramInput]);

  // Get paginated program options
  const filteredProgramOptions = useMemo(() => {
    const startIndex = 0;
    const endIndex = programDropdownPage * ITEMS_PER_PAGE;
    return allFilteredPrograms.slice(startIndex, endIndex);
  }, [allFilteredPrograms, programDropdownPage]);

  // Get all filtered locations (without pagination)
  const allFilteredLocations = useMemo(() => {
    // Filter to only include locations that have programs
    let filtered = locations.filter(location => 
      locationsWithPrograms.has(location)
    );
    
    // Filter by search text (if any)
    if (searchInputs.location) {
      filtered = filtered.filter(location => 
        location.toLowerCase().includes(searchInputs.location.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => a.localeCompare(b));
  }, [locations, searchInputs.location, locationsWithPrograms]);

  // Get paginated location options
  const filteredLocationOptions = useMemo(() => {
    const startIndex = 0;
    const endIndex = locationDropdownPage * ITEMS_PER_PAGE;
    return allFilteredLocations.slice(startIndex, endIndex);
  }, [allFilteredLocations, locationDropdownPage]);

  // Handle scroll for infinite loading
  const handleProgramDropdownScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    if (isNearBottom && filteredProgramOptions.length < allFilteredPrograms.length) {
      setProgramDropdownPage(prev => prev + 1);
    }
  }, [filteredProgramOptions.length, allFilteredPrograms.length]);

  const handleLocationDropdownScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    if (isNearBottom && filteredLocationOptions.length < allFilteredLocations.length) {
      setLocationDropdownPage(prev => prev + 1);
    }
  }, [filteredLocationOptions.length, allFilteredLocations.length]);

  return {
    showProgramDropdown,
    setShowProgramDropdown,
    showLocationDropdown,
    setShowLocationDropdown,
    filteredProgramOptions,
    filteredLocationOptions,
    allFilteredPrograms,
    allFilteredLocations,
    handleProgramDropdownScroll,
    handleLocationDropdownScroll
  };
};
