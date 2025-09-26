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


interface SearchFilters {
  courseTitle: string;
  category: string;
  subcategory: string;
  date: string;
  time: string;
  location: string;
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

  // State for autocomplete dropdowns
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Sync search inputs with filters
  React.useEffect(() => {
    setSearchInputs({
      program: filters.courseTitle,
      location: filters.location
    });
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
      setShowLocationDropdown(true); // Always show dropdown when typing
      const newFilters = { ...filters, location: value };
      onFiltersChange(newFilters);
      // Trigger search immediately for location changes to refresh map
      onSearch(newFilters);
    }
  }, [filters, onFiltersChange, onSearch]);

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
      newFilters.location = '';
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
    setSearchInputs(prev => ({ ...prev, [field]: value }));
    
    // Update filters and trigger search
    if (field === 'program') {
      const newFilters = { ...filters, courseTitle: value };
      onFiltersChange(newFilters);
      setShowProgramDropdown(false);
      onSearch(newFilters);
    } else if (field === 'location') {
      const newFilters = { ...filters, location: value };
      onFiltersChange(newFilters);
      setShowLocationDropdown(false);
      onSearch(newFilters);
    }
  }, [filters, onFiltersChange, onSearch]);

  const handleKeyPress = React.useCallback((e: React.KeyboardEvent, field: keyof typeof searchInputs) => {
    if (e.key === 'Enter') {
      // Hide dropdown and trigger search
      if (field === 'program') {
        setShowProgramDropdown(false);
        const newFilters = { ...filters, courseTitle: searchInputs.program };
        onSearch(newFilters);
      } else if (field === 'location') {
        setShowLocationDropdown(false);
        const newFilters = { ...filters, location: searchInputs.location };
        onSearch(newFilters);
      }
    }
  }, [onSearch, filters, searchInputs]);

  const handleClearAll = React.useCallback(() => {
    // Reset all filters to default values
    const defaultFilters: SearchFilters = {
      courseTitle: '',
      category: '',
      subcategory: '',
      date: getCurrentDate(),
      time: getCurrentTime(),
      location: '',
      age: ''
    };
    
    // Reset all search inputs
    setSearchInputs({
      location: '',
      program: ''
    });

    // Hide dropdowns
    setShowProgramDropdown(false);
    setShowLocationDropdown(false);
    
    // Update the filters
    onFiltersChange(defaultFilters);
    
    // Clear the search results
    onClearResults();
  }, [onFiltersChange, onClearResults]);

  // Filter options for autocomplete
  const filteredProgramOptions = React.useMemo(() => {
    // First filter by category/subcategory if selected
    let filteredByCategory = courseTitles;
    if (filters.category) {
      if (filters.subcategory) {
        // Filter by specific subcategory
        filteredByCategory = courseTitles.filter(title => 
          courseMatchesCategory(title, filters.category, filters.subcategory)
        );
      } else {
        // Filter by category (all subcategories)
        filteredByCategory = courseTitles.filter(title => 
          courseMatchesCategory(title, filters.category)
        );
      }
    }
    
    // Then filter by search text (if any)
    if (searchInputs.program) {
      filteredByCategory = filteredByCategory.filter(title => 
        title.toLowerCase().includes(searchInputs.program.toLowerCase())
      );
    }
    
    return filteredByCategory
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 30); // Limit to 30 options
  }, [courseTitles, searchInputs.program, filters.category, filters.subcategory]);

  const filteredLocationOptions = React.useMemo(() => {
    // Get locations that actually have programs (any programs, not just this week)
    const locationsWithPrograms = [...new Set(allDropIns.map(dropIn => {
      const locationId = dropIn["Location ID"];
      const location = allLocations.find(loc => loc["Location ID"] === locationId);
      return location?.["Location Name"];
    }).filter(Boolean))];
    
    // Filter to only include locations that have programs
    let filtered = locations.filter(location => 
      locationsWithPrograms.includes(location)
    );
    
    // Filter by search text (if any)
    if (searchInputs.location) {
      filtered = filtered.filter(location => 
        location.toLowerCase().includes(searchInputs.location.toLowerCase())
      );
    }
    
    return filtered
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 30); // Limit to 30 options
  }, [locations, searchInputs.location, allDropIns, allLocations]);

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

  // Generate day options for the next 7 days
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
      return courseMatchesCategory(courseTitle, categoryId, subcategoryId);
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
          <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] px-3 py-2.5 text-sm font-medium hover:bg-slate-200 transition-colors w-full">
            <span className="truncate">
              {filters.category ? filteredCategories.find(c => c.id === filters.category)?.name || 'Category' : 'Category'}
            </span>
            <span className="material-symbols-outlined text-base flex-shrink-0"> expand_more </span>
          </button>
          <select
            className="absolute inset-0 opacity-0 cursor-pointer"
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
          <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] px-3 py-2.5 text-sm font-medium hover:bg-slate-200 transition-colors w-full">
            <span className="truncate">
              {filters.subcategory ? filteredSubcategories.find(s => s.id === filters.subcategory)?.name || 'Subcategory' : 'Subcategory'}
            </span>
            <span className="material-symbols-outlined text-base flex-shrink-0"> expand_more </span>
          </button>
          <select
            className="absolute inset-0 opacity-0 cursor-pointer"
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
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"> search </span>
          <input 
            className="w-full rounded-lg bg-[#f6f7f8] py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] border-transparent" 
            placeholder="Find a program" 
            type="text"
            value={searchInputs.program}
            onChange={(e) => handleSearchInputChange('program', e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'program')}
            onFocus={() => setShowProgramDropdown(true)}
            onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
          />
          {searchInputs.program && (
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => handleClearField('program')}
            >
              <span className="material-symbols-outlined text-xl"> close </span>
            </button>
          )}
          
          {/* Program Autocomplete Dropdown */}
          {showProgramDropdown && filteredProgramOptions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredProgramOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm"
                  onClick={() => handleOptionSelect('program', option)}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base"> location_on </span>
          <input 
            className="w-full rounded-lg bg-[#f6f7f8] py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] border-transparent" 
            placeholder="Search by location" 
            type="text"
            value={searchInputs.location}
            onChange={(e) => handleSearchInputChange('location', e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'location')}
            onFocus={() => setShowLocationDropdown(true)}
            onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
          />
          {searchInputs.location && (
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => handleClearField('location')}
            >
              <span className="material-symbols-outlined text-xl"> close </span>
            </button>
          )}
          
          {/* Location Autocomplete Dropdown */}
          {showLocationDropdown && filteredLocationOptions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredLocationOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm"
                  onClick={() => handleOptionSelect('location', option)}
                >
                  {option}
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
            <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] px-3 py-2.5 text-sm font-medium hover:bg-slate-200 transition-colors w-full">
              <span className="truncate">
                {filters.date ? dayOptions.find(d => d.value === filters.date)?.label || 'Day' : 'Day'}
              </span>
              <span className="material-symbols-outlined text-base flex-shrink-0"> expand_more </span>
            </button>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer"
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
            <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] px-3 py-2.5 text-sm font-medium hover:bg-slate-200 transition-colors w-full">
              <span className="truncate">
                {filters.time && filters.time !== 'Any Time' ? formatTimeToAMPM(filters.time) : 'Any Time'}
              </span>
              <span className="material-symbols-outlined text-base flex-shrink-0"> expand_more </span>
            </button>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer"
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
            <button className="flex items-center justify-between gap-1.5 rounded-lg bg-[#f6f7f8] px-3 py-2.5 text-sm font-medium hover:bg-slate-200 transition-colors w-full">
              <span className="truncate">
                {filters.age ? (filters.age === '99' ? 'Age 99+' : `Age ${filters.age}`) : 'Any Age'}
              </span>
              <span className="material-symbols-outlined text-base flex-shrink-0"> expand_more </span>
            </button>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer"
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

      {/* Clear All Button */}
      <button 
        className="text-sm font-medium text-[#13a4ec] hover:text-[#13a4ec]/80 transition-colors"
        onClick={handleClearAll}
      >
        Clear All Filters
      </button>

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
