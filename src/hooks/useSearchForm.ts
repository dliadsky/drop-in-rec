import { useState, useCallback, useEffect } from 'react';
import type { SearchFilters } from '../types';
import { getCurrentDate, getDefaultDate, getDefaultTime } from '../utils/dateTimeUtils';

export const useSearchForm = (
  filters: SearchFilters,
  onFiltersChange: (filters: SearchFilters) => void,
  onSearch: (searchFilters?: SearchFilters) => void
) => {
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
  
  // State to track if URL has been loaded
  const [urlLoaded, setUrlLoaded] = useState(false);

  // Sync search inputs with filters
  useEffect(() => {
    setSearchInputs({
      program: filters.courseTitle,
      location: '' // Keep location input empty for typing
    });
    setSelectedLocations(filters.location);
  }, [filters.courseTitle, filters.location]);

  const handleInputChange = useCallback((field: keyof SearchFilters, value: string) => {
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

  const handleSearchInputChange = useCallback((field: keyof typeof searchInputs, value: string) => {
    setSearchInputs(prev => ({ ...prev, [field]: value }));
    
    // Show dropdown when user types
    if (field === 'program') {
      const newFilters = { ...filters, courseTitle: value };
      onFiltersChange(newFilters);
      // Don't auto-search while typing, wait for selection or Enter
    } else if (field === 'location') {
      setSearchInputs(prev => ({ ...prev, [field]: value }));
      // Don't update filters while typing - only when location is selected
    }
  }, [filters, onFiltersChange, onSearch]);

  const handleClearField = useCallback((field: keyof typeof searchInputs) => {
    // Clear the field
    setSearchInputs(prev => ({ ...prev, [field]: '' }));
    
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

  const handleOptionSelect = useCallback((field: keyof typeof searchInputs, value: string) => {
    if (field === 'program') {
      setSearchInputs(prev => ({ ...prev, [field]: value }));
      const newFilters = { ...filters, courseTitle: value };
      onFiltersChange(newFilters);
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
    }
  }, [filters, onFiltersChange, onSearch, selectedLocations]);

  const handleRemoveLocation = useCallback((locationToRemove: string) => {
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
  const generateShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.subcategory) params.set('subcategory', filters.subcategory);
    if (filters.courseTitle) params.set('program', filters.courseTitle);
    if (filters.location.length > 0) params.set('locations', filters.location.join(','));
    if (filters.age) params.set('age', filters.age);
    
    const baseUrl = window.location.origin + window.location.pathname;
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }, [filters]);

  const loadFromUrl = useCallback(() => {
    if (urlLoaded) return; // Prevent multiple loads
    
    const params = new URLSearchParams(window.location.search);
    
    // Only create filters if there are URL parameters
    if (params.toString()) {
      const urlFilters: SearchFilters = {
        category: params.get('category') || '',
        subcategory: params.get('subcategory') || '',
        courseTitle: params.get('program') || '',
        location: params.get('locations') ? params.get('locations')!.split(',') : [],
        date: getDefaultDate(), // Use default date logic (same as initial app load)
        time: getDefaultTime(), // Use default time logic (same as initial app load)
        age: params.get('age') || ''
      };
      
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
  useEffect(() => {
    loadFromUrl();
  }, [loadFromUrl]);

  // Update URL when filters change (but not on initial load)
  useEffect(() => {
    if (!urlLoaded) return; // Don't update URL until after initial load
    
    const shareUrl = generateShareUrl();
    
    // Only update URL if it's different from current URL
    if (shareUrl !== window.location.href) {
      window.history.replaceState({}, '', shareUrl);
    }
  }, [filters, generateShareUrl, urlLoaded]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, field: keyof typeof searchInputs) => {
    if (e.key === 'Enter') {
      // Hide dropdown and trigger search
      if (field === 'program') {
        const newFilters = { ...filters, courseTitle: searchInputs.program };
        onSearch(newFilters);
      }
    }
  }, [onSearch, filters, searchInputs]);

  const handleClearAll = useCallback(() => {
    // Reset all filters to default values - use today's date, not tomorrow
    const defaultFilters: SearchFilters = {
      courseTitle: '',
      category: '',
      subcategory: '',
      date: getCurrentDate(), // Always use today, not getDefaultDate() which can be tomorrow
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
    
    // Update the filters and trigger search
    onFiltersChange(defaultFilters);
    onSearch(defaultFilters);
  }, [onFiltersChange, onSearch]);

  return {
    searchInputs,
    setSearchInputs,
    selectedLocations,
    setSelectedLocations,
    showSharePopover,
    setShowSharePopover,
    copyButtonText,
    handleInputChange,
    handleSearchInputChange,
    handleClearField,
    handleOptionSelect,
    handleRemoveLocation,
    handleCopyToClipboard,
    generateShareUrl,
    handleKeyPress,
    handleClearAll
  };
};
