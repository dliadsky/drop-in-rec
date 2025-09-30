import { useMemo, useCallback } from 'react';
import { categories, getSubcategoriesForCategory, getAllSubcategories, courseMatchesCategory } from '../services/categories';

export const useCategoryFilter = (allDropIns: any[], filters: any) => {
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

  return {
    filteredCategories,
    filteredSubcategories
  };
};
