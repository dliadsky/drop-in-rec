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
}

interface SearchFormProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  courseTitles: string[];
  locations: string[];
  onSearch: () => void;
  onClearResults: () => void;
  isLoading: boolean;
  allDropIns: any[]; // Add drop-in data for availability filtering
}

// Searchable dropdown component - defined outside to prevent re-creation
const SearchableDropdown = React.memo(({ 
  id, 
  label, 
  value, 
  searchValue, 
  onValueChange, 
  onSearchChange, 
  options, 
  placeholder 
}: {
  id: string;
  label: string;
  value: string;
  searchValue: string;
  onValueChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  options: Array<{ id: string; name: string } | string>;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Get the display name for the selected value
  const getDisplayName = useCallback((val: string) => {
    if (!val) return '';
    const option = options.find(opt => {
      const optionValue = typeof opt === 'string' ? opt : opt.id;
      return optionValue === val;
    });
    return option ? (typeof option === 'string' ? option : option.name) : val;
  }, [options]);

  const handleOptionClick = useCallback((optionValue: string, optionName: string) => {
    onValueChange(optionValue);
    onSearchChange(optionName);
    setIsOpen(false);
  }, [onValueChange, onSearchChange]);

  const handleInputChange = useCallback((inputValue: string) => {
    onSearchChange(inputValue);
    // Clear the selected value if user is typing
    if (inputValue !== getDisplayName(value)) {
      onValueChange('');
    }
    setIsOpen(true);
  }, [onSearchChange, onValueChange, getDisplayName, value]);

  const handleFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClickOutside = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          id={id}
          value={searchValue || getDisplayName(value)}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">No options found</div>
            ) : (
              options.map((option) => {
                const optionValue = typeof option === 'string' ? option : option.id;
                const optionName = typeof option === 'string' ? option : option.name;
                const isSelected = optionValue === value;
                return (
                  <div
                    key={optionValue}
                    className={`px-3 py-2 cursor-pointer ${
                      isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleOptionClick(optionValue, optionName)}
                  >
                    {optionName}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={handleClickOutside}
        />
      )}
    </div>
  );
});

const SearchForm: React.FC<SearchFormProps> = ({
  filters,
  onFiltersChange,
  courseTitles,
  locations,
  onSearch,
  onClearResults,
  isLoading,
  allDropIns
}) => {
  // State for search inputs (only for location now)
  const [searchInputs, setSearchInputs] = useState({
    location: ''
  });

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
  }, [filters, onFiltersChange]);

  const handleSearchInputChange = React.useCallback((field: keyof typeof searchInputs, value: string) => {
    setSearchInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClearAll = React.useCallback(() => {
    // Reset all filters to default values
    const defaultFilters: SearchFilters = {
      courseTitle: '',
      category: '',
      subcategory: '',
      date: getCurrentDate(),
      time: getCurrentTime(),
      location: ''
    };
    
    // Reset all search inputs
    setSearchInputs({
      location: ''
    });
    
    // Update the filters
    onFiltersChange(defaultFilters);
    
    // Clear the search results
    onClearResults();
  }, [onFiltersChange, onClearResults]);

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

  const filteredCourseTitles = useMemo(() => {
    // courseTitles is already filtered by App.tsx based on category/subcategory selection
    // Just sort them alphabetically
    return [...courseTitles].sort((a, b) => a.localeCompare(b));
  }, [courseTitles]);

  const filteredLocations = useMemo(() => {
    if (!searchInputs.location) return locations.sort((a, b) => a.localeCompare(b));
    return locations
      .filter(location => location.toLowerCase().includes(searchInputs.location.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  }, [locations, searchInputs.location]);


  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Drop-in Recreation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Category Dropdown */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Dropdown */}
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory
          </label>
          <select
            id="subcategory"
            value={filters.subcategory}
            onChange={(e) => handleInputChange('subcategory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Subcategories</option>
            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Title Dropdown */}
        <div>
          <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Program
          </label>
          <select
            id="courseTitle"
            value={filters.courseTitle}
            onChange={(e) => handleInputChange('courseTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Programs</option>
            {filteredCourseTitles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {/* Day Selector */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Day
          </label>
          <select
            id="date"
            value={filters.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {dayOptions.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Picker */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
            Open at
          </label>
          <select
            id="time"
            value={filters.time}
            onChange={(e) => handleInputChange('time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* Location Searchable Dropdown */}
        <SearchableDropdown
          id="location"
          label="Location"
          value={filters.location}
          searchValue={searchInputs.location}
          onValueChange={(value) => handleInputChange('location', value)}
          onSearchChange={(value) => handleSearchInputChange('location', value)}
          options={filteredLocations}
          placeholder="Search locations..."
        />
      </div>

      {/* Search and Clear Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg transition duration-200 ease-in-out transform disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Programs
            </div>
          )}
        </button>
        
        <button
          onClick={handleClearAll}
          disabled={isLoading}
          className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition duration-200 ease-in-out transform disabled:transform-none"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear All
          </div>
        </button>
      </div>
    </div>
  );
};

export default SearchForm;
