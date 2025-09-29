import React, { useState, useMemo, useCallback } from 'react';
import { categories, getSubcategoriesForCategory, getAllSubcategories, courseMatchesCategory } from '../services/categories';

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

// Helper function to get default date - if it's late in the day (after 8 PM), default to tomorrow
const getDefaultDate = (): string => {
  const now = new Date();
  const hour = now.getHours();
  
  // If it's after 8 PM, default to tomorrow
  if (hour >= 20) {
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

interface SearchFormProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: (searchFilters?: SearchFilters) => void;
  onClearResults: () => void;
  isLoading: boolean;
  allDropIns: any[]; // Add drop-in data for availability filtering
  courseTitles: string[];
  locations: string[];
  allLocations: any[]; // Add all locations data for filtering
}


const SearchForm: React.FC<SearchFormProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClearResults,
  isLoading,
  allDropIns,
  courseTitles,
  locations,
  allLocations
}) => {
  // State for search inputs
  const [searchInputs, setSearchInputs] = useState({
    location: '',
    program: ''
  });
  
  // State for selected locations
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  // State for share popover
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy to clipboard');
  
  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSharePopover) {
        const target = event.target as Element;
        if (!target.closest('.share-popover-container')) {
          setShowSharePopover(false);
        }
      }
    };

    if (showSharePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSharePopover]);
  
  // State to track if URL has been loaded
  const [urlLoaded, setUrlLoaded] = useState(false);

  // State for autocomplete dropdowns
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // State for infinite scrolling
  const [programDropdownPage, setProgramDropdownPage] = useState(1);
  const [locationDropdownPage, setLocationDropdownPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  // Sync search inputs with filters
  React.useEffect(() => {
    setSearchInputs({
      program: filters.courseTitle,
      location: '' // Keep location input empty for typing
    });
    setSelectedLocations(filters.location);
  }, [filters.courseTitle, filters.location]);

  const handleInputChange = React.useCallback((field: keyof SearchFilters, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    
    // If category changes, reset subcategory
    if (field === 'category') {
      newFilters.subcategory = '';
    }
    
    onFiltersChange(newFilters);
    
    // Auto-search after selection changes (except for program text input)
    if (field !== 'courseTitle') {
      onSearch(newFilters);
    }
  }, [filters, onFiltersChange, onSearch]);


  const handleSearchInputChange = React.useCallback((field: keyof typeof searchInputs, value: string) => {
    setSearchInputs(prev => ({ ...prev, [field]: value }));
    
    // Show dropdown when user types
    if (field === 'program') {
      setShowProgramDropdown(true); // Always show dropdown when typing
      const newFilters = { ...filters, courseTitle: value };
      onFiltersChange(newFilters);
      // Don't auto-search while typing, wait for selection or Enter
    } else if (field === 'location') {
      setSearchInputs(prev => ({ ...prev, [field]: value }));
      setShowLocationDropdown(true); // Always show dropdown when typing
      // Don't update filters while typing - only when location is selected
    }
  }, [filters, onFiltersChange, onSearch]);

  // Debounced search input change for better performance
  const [debouncedProgramInput, setDebouncedProgramInput] = React.useState('');
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProgramInput(searchInputs.program);
    }, 150); // 150ms debounce
    
    return () => clearTimeout(timer);
  }, [searchInputs.program]);

  // Reset pagination when search changes
  React.useEffect(() => {
    setProgramDropdownPage(1);
  }, [debouncedProgramInput, filters.category, filters.subcategory]);

  React.useEffect(() => {
    setLocationDropdownPage(1);
  }, [searchInputs.location]);

  const handleClearField = React.useCallback((field: keyof typeof searchInputs) => {
    // Clear the field
    setSearchInputs(prev => ({ ...prev, [field]: '' }));
    
    // Hide the dropdown
    if (field === 'program') {
      setShowProgramDropdown(false);
    } else if (field === 'location') {
      setShowLocationDropdown(false);
    }
    
    // Update filters and trigger search
    const newFilters = { ...filters };
    if (field === 'program') {
      newFilters.courseTitle = '';
      } else if (field === 'location') {
        newFilters.location = [];
        setSelectedLocations([]);
      }
    
    onFiltersChange(newFilters);
    onSearch(newFilters);
    
    // Remove focus from the input field
    const inputElement = document.querySelector(`input[placeholder="${field === 'program' ? 'Find a program' : 'Search by location'}"]`) as HTMLInputElement;
    if (inputElement) {
      inputElement.blur();
    }
  }, [filters, onFiltersChange, onSearch]);

  const handleOptionSelect = React.useCallback((field: keyof typeof searchInputs, value: string) => {
    if (field === 'program') {
      setSearchInputs(prev => ({ ...prev, [field]: value }));
      const newFilters = { ...filters, courseTitle: value };
      onFiltersChange(newFilters);
      setShowProgramDropdown(false);
      onSearch(newFilters);
    } else if (field === 'location') {
      // Add location to selected locations if not already selected
      if (!selectedLocations.includes(value)) {
        const newSelectedLocations = [...selectedLocations, value];
        setSelectedLocations(newSelectedLocations);
        const newFilters = { ...filters, location: newSelectedLocations };
        onFiltersChange(newFilters);
        onSearch(newFilters);
      }
      setSearchInputs(prev => ({ ...prev, location: '' })); // Clear input
      setShowLocationDropdown(false);
    }
  }, [filters, onFiltersChange, onSearch, selectedLocations]);

  const handleRemoveLocation = React.useCallback((locationToRemove: string) => {
    const newSelectedLocations = selectedLocations.filter(loc => loc !== locationToRemove);
    setSelectedLocations(newSelectedLocations);
    const newFilters = { ...filters, location: newSelectedLocations };
    onFiltersChange(newFilters);
    onSearch(newFilters);
  }, [selectedLocations, filters, onFiltersChange, onSearch]);

  // Copy to clipboard function
  const handleCopyToClipboard = async () => {
    const shareUrl = generateShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyButtonText('Copied!');
      setTimeout(() => {
        setCopyButtonText('Copy to clipboard');
      }, 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Bookmark/Share functionality
  const generateShareUrl = React.useCallback(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.subcategory) params.set('subcategory', filters.subcategory);
    if (filters.courseTitle) params.set('program', filters.courseTitle);
    if (filters.location.length > 0) params.set('locations', filters.location.join(','));
    // if (filters.date) params.set('date', filters.date);
    // if (filters.time) params.set('time', filters.time);
    if (filters.age) params.set('age', filters.age);
    
    const baseUrl = window.location.origin + window.location.pathname;
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }, [filters]);

  const loadFromUrl = React.useCallback(() => {
    if (urlLoaded) return; // Prevent multiple loads
    
    const params = new URLSearchParams(window.location.search);
    
    const urlFilters: SearchFilters = {
      category: params.get('category') || '',
      subcategory: params.get('subcategory') || '',
      courseTitle: params.get('program') || '',
      location: params.get('locations') ? params.get('locations')!.split(',') : [],
      date: params.get('date') || getDefaultDate(),
      time: params.get('time') || getDefaultTime(),
      age: params.get('age') || ''
    };
    
    // Only update if there are URL parameters
    if (params.toString()) {
      onFiltersChange(urlFilters);
      onSearch(urlFilters);
      
      // Update selected locations
      setSelectedLocations(urlFilters.location);
      
      // Update search inputs
      setSearchInputs({
        location: '',
        program: urlFilters.courseTitle
      });
    }
    
    setUrlLoaded(true);
  }, [onFiltersChange, onSearch, urlLoaded]);

  // Load filters from URL on component mount
  React.useEffect(() => {
    loadFromUrl();
  }, [loadFromUrl]);

  // Update URL when filters change (but not on initial load)
  React.useEffect(() => {
    if (!urlLoaded) return; // Don't update URL until after initial load
    
    const shareUrl = generateShareUrl();
    
    // Only update URL if it's different from current URL
    if (shareUrl !== window.location.href) {
      window.history.replaceState({}, '', shareUrl);
    }
  }, [filters, generateShareUrl, urlLoaded]);


  const handleKeyPress = React.useCallback((e: React.KeyboardEvent, field: keyof typeof searchInputs) => {
    if (e.key === 'Enter') {
      // Hide dropdown and trigger search
      if (field === 'program') {
        setShowProgramDropdown(false);
        const newFilters = { ...filters, courseTitle: searchInputs.program };
        onSearch(newFilters);
        } else if (field === 'location') {
          setShowLocationDropdown(false);
          // Don't update filters on Enter for location - only when location is selected
        }
    }
  }, [onSearch, filters, searchInputs]);

  const handleClearAll = React.useCallback(() => {
    // Reset all filters to default values
    const defaultFilters: SearchFilters = {
      courseTitle: '',
      category: '',
      subcategory: '',
      date: getDefaultDate(),
      time: getDefaultTime(),
      location: [],
      age: ''
    };
    
    // Reset all search inputs
    setSearchInputs({
      location: '',
      program: ''
    });
    
    // Reset selected locations
    setSelectedLocations([]);

    // Hide dropdowns
    setShowProgramDropdown(false);
    setShowLocationDropdown(false);
    
    // Update the filters
    onFiltersChange(defaultFilters);
    
    // Clear the search results
    onClearResults();
  }, [onFiltersChange, onClearResults]);


  // Pre-compute locations that have programs (memoized separately for performance)
  const locationsWithPrograms = React.useMemo(() => {
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
  const categoryFilteredPrograms = React.useMemo(() => {
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
  const allFilteredPrograms = React.useMemo(() => {
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
  const filteredProgramOptions = React.useMemo(() => {
    const startIndex = 0;
    const endIndex = programDropdownPage * ITEMS_PER_PAGE;
    return allFilteredPrograms.slice(startIndex, endIndex);
  }, [allFilteredPrograms, programDropdownPage]);


  // Get all filtered locations (without pagination)
  const allFilteredLocations = React.useMemo(() => {
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
  const filteredLocationOptions = React.useMemo(() => {
    const startIndex = 0;
    const endIndex = locationDropdownPage * ITEMS_PER_PAGE;
    return allFilteredLocations.slice(startIndex, endIndex);
  }, [allFilteredLocations, locationDropdownPage]);

  // Handle scroll for infinite loading
  const handleProgramDropdownScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    if (isNearBottom && filteredProgramOptions.length < allFilteredPrograms.length) {
      setProgramDropdownPage(prev => prev + 1);
    }
  }, [filteredProgramOptions.length, allFilteredPrograms.length]);

  const handleLocationDropdownScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    if (isNearBottom && filteredLocationOptions.length < allFilteredLocations.length) {
      setLocationDropdownPage(prev => prev + 1);
    }
  }, [filteredLocationOptions.length, allFilteredLocations.length]);

  // Helper function to convert 24-hour time to 12-hour AM/PM format
  const formatTimeToAMPM = (time24: string): string => {
    if (time24 === 'Any Time') return time24;
    
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const generateTimeOptions = () => {
    const times = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if the selected date is today
    const today = new Date();
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`; // YYYY-MM-DD format in local timezone
    const isToday = filters.date === todayString;
    
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
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
    return ['Any Time', ...times];
  };

  const timeOptions = React.useMemo(() => generateTimeOptions(), [filters.date]);

  // Auto-update time if it becomes invalid (in the past)
  React.useEffect(() => {
    if (timeOptions.length > 0 && !timeOptions.includes(filters.time)) {
      // Current time is not in the valid options, set to the first available time
      // But don't change if it's already "Any Time" to avoid duplicates
      if (filters.time !== 'Any Time') {
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

  // Helper function to check if a category has programs available in the next week
  const hasProgramsInNextWeek = useCallback((categoryId: string, subcategoryId?: string) => {
    if (!allDropIns.length) return true; // Show all if no data loaded yet
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    // Get the category to check its subcategories
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return true;
    
    // Check if any programs in this category are available in the next week
    return allDropIns.some(dropIn => {
      // Check if the program runs during the next week
      const firstDate = dropIn["First Date"];
      const lastDate = dropIn["Last Date"];
      
      if (!firstDate) return false;
      
      // Program is available if it starts before or during next week AND ends after or during next week
      const programAvailable = firstDate <= nextWeekStr && (!lastDate || lastDate >= todayStr);
      
      if (!programAvailable) return false;
      
      // Check if the program matches the category keywords
      const courseTitle = dropIn["Course Title"];
      if (!courseTitle) return false;
      
      // Use the new courseMatchesCategory function to check if this program matches the category/subcategory
      // Pass age parameters to include age-based categorization
      return courseMatchesCategory(courseTitle, categoryId, subcategoryId, dropIn["Age Min"], dropIn["Age Max"]);
    });
  }, [allDropIns]);

  // Filtered options based on availability
  const filteredCategories = useMemo(() => {
    // Filter by availability in next week
    return categories
      .filter(cat => hasProgramsInNextWeek(cat.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hasProgramsInNextWeek]);

  const filteredSubcategories = useMemo(() => {
    let subcategories = filters.category 
      ? getSubcategoriesForCategory(filters.category)
      : getAllSubcategories();
    
    // Filter by availability in next week
    if (filters.category) {
      // When a specific category is selected, filter subcategories for that category
      subcategories = subcategories.filter(sub => hasProgramsInNextWeek(filters.category, sub.id));
    } else {
      // When no category is selected, filter subcategories that have programs in any category
      subcategories = subcategories.filter(sub => {
        // Find which category this subcategory belongs to
        const parentCategory = categories.find(cat => 
          cat.subcategories.some(subcat => subcat.id === sub.id)
        );
        return parentCategory ? hasProgramsInNextWeek(parentCategory.id, sub.id) : false;
      });
    }
    
    // Don't sort here - the functions in categories.ts already handle proper sorting with "other" at bottom
    return subcategories;
  }, [filters.category, hasProgramsInNextWeek]);



  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Search Inputs */}
      

      {/* Filter Buttons - Responsive Layout */}
      <div className="space-y-2">
        {/* Category Button - Full Width */}
        <div className="relative">
          <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] dark:bg-slate-700 px-3 py-2.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-full text-gray-900 dark:text-slate-200">
            <span className="truncate">
              {filters.category ? filteredCategories.find(c => c.id === filters.category)?.name || 'Category' : 'All Categories'}
            </span>
            <span className="material-symbols-outlined text-base flex-shrink-0 text-gray-600 dark:text-slate-400"> expand_more </span>
          </button>
          <select
            className="absolute inset-0 opacity-0 cursor-pointer bg-transparent text-gray-900 dark:text-slate-200"
            value={filters.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Button - Full Width */}
        <div className="relative">
          <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] dark:bg-slate-700 px-3 py-2.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-full text-gray-900 dark:text-slate-200">
            <span className="truncate">
              {filters.subcategory ? filteredSubcategories.find(s => s.id === filters.subcategory)?.name || 'Subcategory' : 'All Subcategories'}
            </span>
            <span className="material-symbols-outlined text-base flex-shrink-0 text-gray-600 dark:text-slate-400"> expand_more </span>
          </button>
          <select
            className="absolute inset-0 opacity-0 cursor-pointer bg-transparent text-gray-900 dark:text-slate-200"
            value={filters.subcategory}
            onChange={(e) => handleInputChange('subcategory', e.target.value)}
          >
            <option value="">All Subcategories</option>
            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
        {/* Program Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"> search </span>
          <input 
            className="w-full rounded-lg bg-[#f6f7f8] dark:bg-slate-700 py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] border-transparent" 
            placeholder="Find a program" 
            type="text"
            value={searchInputs.program}
            onChange={(e) => handleSearchInputChange('program', e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'program')}
            onFocus={() => setShowProgramDropdown(true)}
            onBlur={() => setTimeout(() => setShowProgramDropdown(false), 150)}
          />
          {searchInputs.program && (
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
              onClick={() => handleClearField('program')}
            >
              <span className="material-symbols-outlined text-xl"> close </span>
            </button>
          )}
          
          {/* Program Autocomplete Dropdown */}
          {showProgramDropdown && (filteredProgramOptions.length > 0 || allFilteredPrograms.length > 0) && (
            <div 
              className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto"
              onScroll={handleProgramDropdownScroll}
            >
              {filteredProgramOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-900 dark:text-slate-200"
                  onMouseDown={(e) => {
                    e.preventDefault() // Prevent input from losing focus
                    handleOptionSelect('program', option);
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location Search Input */}
        <div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base"> location_on </span>
            <input 
              className="w-full rounded-lg bg-[#f6f7f8] dark:bg-slate-700 py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] border-transparent" 
              placeholder="Search by location" 
              type="text"
              value={searchInputs.location}
              onChange={(e) => handleSearchInputChange('location', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'location')}
              onFocus={() => setShowLocationDropdown(true)}
              onClick={() => setShowLocationDropdown(true)}
              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
            />
            {searchInputs.location && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                onClick={() => handleClearField('location')}
              >
                <span className="material-symbols-outlined text-xl"> close </span>
              </button>
            )}
            
            {/* Location Autocomplete Dropdown */}
            {showLocationDropdown && (filteredLocationOptions.length > 0 || allFilteredLocations.length > 0) && (
              <div 
                className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                onScroll={handleLocationDropdownScroll}
              >
                {filteredLocationOptions.map((option, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-900 dark:text-slate-200"
                    onMouseDown={(e) => {
                      e.preventDefault() // Prevent input from losing focus
                      handleOptionSelect('location', option);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected Locations */}
          {selectedLocations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedLocations
                .slice()
                .sort((a, b) => a.localeCompare(b))
                .map((location, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-[#13a4ec]/10 text-[#13a4ec] px-1.5 py-0.5 rounded text-xs"
                >
                  <span className="truncate max-w-40">{location}</span>
                  <button
                    onClick={() => handleRemoveLocation(location)}
                    className="text-[#13a4ec]/60 hover:text-[#13a4ec] flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Day, Time, and Age Buttons - Three Column Layout */}
        <div className="grid grid-cols-3 gap-2">
          {/* Day Button */}
          <div className="relative">
            <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] dark:bg-slate-700 px-3 py-2.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-full text-gray-900 dark:text-slate-200">
              <span className="truncate">
                {filters.date ? dayOptions.find(d => d.value === filters.date)?.label || 'Day' : 'Day'}
              </span>
              <span className="material-symbols-outlined text-base flex-shrink-0 text-gray-600 dark:text-slate-400"> expand_more </span>
            </button>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer bg-transparent text-gray-900 dark:text-slate-200"
              value={filters.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            >
              {dayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Button */}
          <div className="relative">
            <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] dark:bg-slate-700 px-3 py-2.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-full text-gray-900 dark:text-slate-200">
              <span className="truncate">
                {filters.time && filters.time !== 'Any Time' ? formatTimeToAMPM(filters.time) : 'Any Time'}
              </span>
              <span className="material-symbols-outlined text-base flex-shrink-0 text-gray-600 dark:text-slate-400"> expand_more </span>
            </button>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer bg-transparent text-gray-900 dark:text-slate-200"
              value={filters.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {formatTimeToAMPM(time)}
                </option>
              ))}
            </select>
          </div>

          {/* Age Button */}
          <div className="relative">
            <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] dark:bg-slate-700 px-3 py-2.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-full text-gray-900 dark:text-slate-200">
              <span className="truncate">
                {filters.age ? (filters.age === '99' ? 'Age 99+' : `Age ${filters.age}`) : 'Any Age'}
              </span>
              <span className="material-symbols-outlined text-base flex-shrink-0 text-gray-600 dark:text-slate-400"> expand_more </span>
            </button>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer bg-transparent text-gray-900 dark:text-slate-200"
              value={filters.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
            >
              <option value="">Any Age</option>
              {Array.from({ length: 100 }, (_, i) => (
                <option key={i} value={i.toString()}>
                  {i === 99 ? '99+' : i.toString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Share and Clear Filters Controls */}
      <div className="flex justify-between items-center">
        <div className="relative share-popover-container">
          <button 
            className="flex items-center gap-1 text-sm font-medium text-[#13a4ec] hover:text-[#13a4ec]/80 transition-colors"
            onClick={() => setShowSharePopover(!showSharePopover)}
          >
            <span className="material-symbols-outlined text-base">share</span>
            Share
          </button>
          
          {/* Share Popover */}
          {showSharePopover && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg z-30 min-w-80">
              {/* Caret/Arrow pointing up to the text */}
              <div className="absolute -top-1 left-10 transform w-2 h-2 bg-white dark:bg-slate-800 border-l border-t border-gray-300 dark:border-slate-600 rotate-45"></div>
              
              {/* Close button */}
              <button
                className="absolute top-2 right-2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300"
                onClick={() => setShowSharePopover(false)}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-slate-200 mb-2">Share this link:</h3>
                <div className="mb-1">
                  <input
                    type="text"
                    value={generateShareUrl()}
                    readOnly
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                  />
                </div>
                <button
                  className="text-xs text-[#13a4ec] hover:text-[#13a4ec]/80 underline"
                  onClick={handleCopyToClipboard}
                >
                  {copyButtonText}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="text-sm font-medium text-[#13a4ec] hover:text-[#13a4ec]/80 transition-colors"
          onClick={handleClearAll}
        >
          Clear All Filters
        </button>
      </div>

      {/* Hidden Search Button - triggered by form submission or Enter key */}
      <button
        onClick={() => onSearch()}
        disabled={isLoading}
        className="hidden"
        type="submit"
      >
        Search
      </button>

    </div>
  );
};

export default SearchForm;
