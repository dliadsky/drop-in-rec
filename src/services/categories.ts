// Category mapping for Toronto recreation programs

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  icon: string; // Material symbol icon for the category
}

export interface Subcategory {
  id: string;
  name: string;
  keywords: string[];
  exclusions?: string[]; // Keywords that should prevent matching if present in the title
  isFallback?: boolean; // If true, only matches when no other subcategory in the same category matches
  icon?: string; // Material symbol icon for the subcategory (optional, falls back to category icon)
}

export const categories: Category[] = [
  {
    id: 'arts-crafts',
    name: 'Arts & Crafts',
    icon: 'palette',
    subcategories: [
      { id: 'visual-arts', name: 'Visual Arts', keywords: ['painting', 'drawing', 'photography', 'visual art'], exclusions: ['arthritis', 'arthritic'], icon: 'palette' },
      { id: 'crafts', name: 'Crafts', keywords: ['craft', 'sewing', 'knitting', 'crochet', 'quilting', 'decoupage'], icon: 'palette' },
      { id: 'music', name: 'Music', keywords: ['music', 'band', 'choir', 'drumming', 'karaoke', 'drum', 'open mic'], exclusions: ['no music'], icon: 'music_note' },
      { id: 'dance', name: 'Dance', keywords: ['dance', 'tango', 'ballroom', 'hip hop', 'line dance', 'vogue'], icon: 'taunt' },
      { id: 'creative-writing', name: 'Creative Writing', keywords: ['creative writing', 'writing'], icon: 'edit' },
      { id: 'other-arts', name: 'Other Arts Programs', keywords: ['art', 'bunka', 'colouring', 'jewellery making'], exclusions: ['arthritis', 'martial arts'], isFallback: true, icon: 'palette' }
    ]
  },
  {
    id: 'family',
    name: 'Family',
    icon: 'family_restroom',
    subcategories: [
      { id: 'family-swim', name: 'Family Swim', keywords: ['family swim'  ], icon: 'pool' },
      { id: 'family-sports', name: 'Family Sports', keywords: ['basketball with family', 'badminton with family', 'pickleball with family', 'soccer with family', 'volleyball with family', 'tennis with family', 'table-tennis with family', 'skate with family', 'multi-sport with family'], icon: 'family_restroom' },
      { id: 'family-arts', name: 'Family Arts', keywords: ['family arts'], icon: 'palette' },
      { id: 'early-years', name: 'Early Years', keywords: ['early years', 'preschool', 'caregiver'], exclusions: ['leisure Skate: child with caregiver'], icon: 'child_care' },
      { id: 'other-family-programs', name: 'Other Family Programs', keywords: ['family'], isFallback: true, icon: 'family_restroom' }
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    icon: 'fitness_center',
    subcategories: [
      { id: 'yoga', name: 'Yoga', keywords: ['yoga'], icon: 'self_improvement' },
      { id: 'pilates', name: 'Pilates', keywords: ['pilates'], icon: 'self_improvement' },
      { id: 'cardio', name: 'Cardio', keywords: ['cardio'], icon: 'cardio_load' },
      { id: 'zumba', name: 'Zumba', keywords: ['zumba'], icon: 'taunt' },
      { id: 'strength', name: 'Strength Training', keywords: ['strength', 'weight'], icon: 'fitness_center' },
      { id: 'hiit', name: 'HIIT', keywords: ['hiit', 'boot camp'], icon: 'fitness_center' },
      { id: 'gentle-fitness', name: 'Gentle Fitness', keywords: ['gentle', 'mobility', ': chair', 'osteofit', 'tai chi', 'qigong'], icon: 'person_celebrate' },
      { id: 'walking', name: 'Walking', keywords: ['walk', 'running track'], icon: 'directions_walk' },
      { id: 'other-fitness', name: 'Other Fitness & Wellness', keywords: ['fitness', 'wellness', 'cycle', 'fit', 'pedal', 'meditation'], isFallback: true, icon: 'fitness_center' }
    ]
  },
  {
    id: 'games',
    name: 'Games & Recreation',
    icon: 'toys',
    subcategories: [
      { id: 'club', name: 'Clubs', keywords: ['club'], icon: 'groups' },
      { id: 'board-games', name: 'Board Games', keywords: ['board games', ': board', 'chess'], icon: 'toys_and_games' },
      { id: 'card-games', name: 'Card Games', keywords: ['cards', 'euchre', 'bridge', 'cribbage'], icon: 'playing_cards' },
      { id: 'billiards', name: 'Billiards & Pool', keywords: ['billiards', 'snooker', 'pool'], icon: 'counter_8' },
      { id: 'darts', name: 'Darts', keywords: ['darts'], icon: 'target' },
      { id: 'video-games', name: 'Video Games', keywords: ['video game', 'gaming'], icon: 'videogame_asset' },
      { id: 'bingo', name: 'Bingo', keywords: ['bingo'], icon: 'casino' },
      { id: 'other-games', name: 'Other Games & Recreation', keywords: ['games', 'archery', 'bocce', 'bowling'], isFallback: true, icon: 'toys_and_games' }
    ]
  },
  {
    id: 'skating',
    name: 'Skating & Ice Sports',
    icon: 'sports',
    subcategories: [        
      { id: 'hockey', name: 'Hockey', keywords: ['hockey', 'shinny'], icon: 'sports_hockey' },
      { id: 'leisure-skate', name: 'Leisure Skate', keywords: ['leisure skate'], icon: 'ice_skating' },
      { id: 'figure-skating', name: 'Figure Skating', keywords: ['figure skating'], icon: 'ice_skating' },
      { id: 'roller-skating', name: 'Roller Skating', keywords: ['roller skating'], icon: 'roller_skating' },
      { id: 'other-skating', name: 'Other Skating & Ice Sports', keywords: ['skate', 'skating'], isFallback: true, icon: 'ice_skating' }
    ]
  },
  {
    id: 'specialized',
    name: 'Specialized Programs',
    icon: 'support',
    subcategories: [
      { id: 'adapted', name: 'Adapted Programs', keywords: ['adapted', 'parasport'], icon: 'accessible' },
      { id: 'senior', name: 'Senior Programs', keywords: ['older adult', 'bingo'], icon: 'sports' },
      { id: 'lgbtq', name: 'LGBTQ+ Programs', keywords: ['lgbtq', '2slgbtq'], icon: 'group' },
      { id: 'women-only', name: 'Women Only', keywords: ['women only', '(women)', 'girls'], icon: 'woman' }
    ]
  },
  {
    id: 'sports',
    name: 'Sports & Athletics',
    icon: 'sports',
    subcategories: [
      { id: 'basketball', name: 'Basketball', keywords: ['basketball'], icon: 'sports_basketball' },
      { id: 'badminton', name: 'Badminton', keywords: ['badminton'], icon: 'badminton' },
      { id: 'pickleball', name: 'Pickleball', keywords: ['pickleball'], icon: 'pickleball' },
      { id: 'soccer', name: 'Soccer', keywords: ['soccer'], icon: 'sports_soccer' },
      { id: 'volleyball', name: 'Volleyball', keywords: ['volleyball'], icon: 'sports_volleyball' },
      { id: 'table-tennis', name: 'Table Tennis', keywords: ['table tennis'], icon: 'padel' },
      { id: 'hockey', name: 'Hockey', keywords: ['hockey', 'shinny'], icon: 'sports_hockey' },
      { id: 'multi-sport', name: 'Multi-Sport', keywords: ['multi-sport', 'multi sport'], icon: 'sports' },
      { id: 'other-sports', name: 'Other Sports & Athletics', keywords: ['sport', 'baseball', 'dodgeball', 'tennis', 'skateboarding', 'cricket', 'golf'], isFallback: true, icon: 'sports' }
    ]
  },
  {
    id: 'swimming',
    name: 'Swimming & Aquatics',
    icon: 'pool',
    subcategories: [
      { id: 'lane-swim', name: 'Lane Swim', keywords: ['lane swim'], icon: 'pool' },
      { id: 'leisure-swim', name: 'Leisure Swim', keywords: ['leisure swim'], icon: 'pool' },
      { id: 'family-swim', name: 'Family Swim', keywords: ['family swim'], icon: 'pool' },
      { id: 'aquatic-fitness', name: 'Aquatic Fitness', keywords: ['aquatic fitness', 'water fitness', 'water'], icon: 'pool' },
      { id: 'other-swimming', name: 'Other Swimming', keywords: ['swim', 'aquatic'], isFallback: true, icon: 'pool' }
    ]
  },
  {
    id: 'youth',
    name: 'Youth Programs',
    icon: 'group',
    subcategories: [
      { id: 'youth-clubs', name: 'Youth Clubs', keywords: ['youth club', 'teen club', 'zone', 'homework'], icon: 'groups' },
     { id: 'youth-arts', name: 'Youth Arts', keywords: ['youth art', 'youth craft', 'youth music', 'youth dance', 'youth creative', 'child art', 'child craft', 'child music', 'child dance', 'kids art', 'kids craft', 'kids music', 'kids dance'], icon: 'palette' },
      { id: 'youth-leadership', name: 'Youth Leadership', keywords: ['youth leadership', 'youth council'], icon: 'group' },
      { id: 'other-youth', name: 'Other Youth Programs', keywords: ['youth', 'teen'], isFallback: true, icon: 'group' }
    ]
  },
];


// Function to categorize a course title - returns all matches with hierarchical keyword matching
export const categorizeCourse = (courseTitle: string, ageMin?: string, ageMax?: string): Array<{ category: string; subcategory: string }> => {
  const lowerTitle = courseTitle.toLowerCase();
  const matches: Array<{ category: string; subcategory: string; keywordLength: number }> = [];
  const matchedPrograms = new Set<string>(); // Track which programs have been matched
  
  // Check for age-based categorization first
  if (ageMin) {
    const minAge = parseInt(ageMin);
    
    // If the program is specifically for seniors (60+), categorize as Senior Programs
    if (minAge >= 60) {
      const matchKey = 'specialized-senior';
      if (!matchedPrograms.has(matchKey)) {
        matches.push({ 
          category: 'specialized', 
          subcategory: 'senior', 
          keywordLength: 999 // High priority for age-based matching
        });
        matchedPrograms.add(matchKey);
      }
    }
  }
  
  // Check for youth age ranges - categorize as Youth Programs
  if (ageMax) {
    const maxAge = ageMax === "None" ? 999 : parseInt(ageMax);
    
    // If the program's maximum age is between 13-24, categorize as Youth Programs
    if (maxAge >= 13 && maxAge <= 24) {
      const matchKey = 'youth-other-youth';
      if (!matchedPrograms.has(matchKey)) {
        matches.push({ 
          category: 'youth', 
          subcategory: 'other-youth', 
          keywordLength: 998 // High priority for age-based matching
        });
        matchedPrograms.add(matchKey);
      }
    }
  }
  
  // Check for early years age ranges - categorize as Early Years
  if (ageMax) {
    const maxAge = ageMax === "None" ? 999 : parseInt(ageMax);
    
    // If the program's maximum age is between 0-6, categorize as Early Years
    if (maxAge >= 0 && maxAge <= 6) {
      const matchKey = 'family-early-years';
      if (!matchedPrograms.has(matchKey)) {
        matches.push({ 
          category: 'family', 
          subcategory: 'early-years', 
          keywordLength: 997 // High priority for age-based matching
        });
        matchedPrograms.add(matchKey);
      }
    }
  }
  
  // First pass: Try specific keywords (longer phrases) - prioritize by keyword length
  const allSubcategories: Array<{ category: any; subcategory: any; keyword: string }> = [];
  
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      if (subcategory.keywords.length === 0) {
        continue;
      }
      
      // Skip fallback subcategories from main matching - they will be handled specially
      if (subcategory.isFallback) {
        continue;
      }
      
      for (const keyword of subcategory.keywords) {
        allSubcategories.push({ category, subcategory, keyword });
      }
    }
  }
  
  // Sort by keyword length (longest first) to prioritize specific matches
  allSubcategories.sort((a, b) => b.keyword.length - a.keyword.length);
  
  // Check for matches in order of specificity
  for (const { category, subcategory, keyword } of allSubcategories) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      // Check for exclusions - if any exclusion keyword is present, skip this match
      if (subcategory.exclusions && subcategory.exclusions.some((exclusion: string) => 
        lowerTitle.includes(exclusion.toLowerCase())
      )) {
        continue;
      }
      
      // Special case: exclude walking matches if acqua fitness is present
      if (subcategory.id === 'walking' && (lowerTitle.includes('acqua fitness') || lowerTitle.includes('aquatic fitness'))) {
        continue;
      }
      
      const matchKey = `${category.id}-${subcategory.id}`;
      if (!matchedPrograms.has(matchKey)) {
        matches.push({ 
          category: category.id, 
          subcategory: subcategory.id, 
          keywordLength: keyword.length 
        });
        matchedPrograms.add(matchKey);
      }
    }
  }
  
  // Handle fallback subcategories - only match if no other subcategory in the same category matched
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      if (!subcategory.isFallback || subcategory.keywords.length === 0) {
        continue;
      }
      
      // Check if any other subcategory in this category has already matched
      const hasOtherMatchInCategory = matches.some(match => 
        match.category === category.id && match.subcategory !== subcategory.id
      );
      
      if (!hasOtherMatchInCategory) {
        // Check if this fallback subcategory's keywords match
        for (const keyword of subcategory.keywords) {
          if (lowerTitle.includes(keyword.toLowerCase())) {
            // Check for exclusions - if any exclusion keyword is present, skip this match
            if (subcategory.exclusions && subcategory.exclusions.some((exclusion: string) => 
              lowerTitle.includes(exclusion.toLowerCase())
            )) {
              continue;
            }
            
            const matchKey = `${category.id}-${subcategory.id}`;
            if (!matchedPrograms.has(matchKey)) {
              matches.push({ 
                category: category.id, 
                subcategory: subcategory.id, 
                keywordLength: keyword.length 
              });
              matchedPrograms.add(matchKey);
            }
            break; // Only need one keyword match for fallback
          }
        }
      }
    }
  }
  
  // If still no matches found, don't assign to any category
  // This will prevent programs from showing up in category filters
  if (matches.length === 0) {
    // Return empty array - no categorization
    return [];
  }
  
  // Return matches without the keywordLength property
  return matches.map(match => ({ 
    category: match.category, 
    subcategory: match.subcategory 
  }));
};

// Function to check if a course title matches a specific category/subcategory
export const courseMatchesCategory = (courseTitle: string, categoryId: string, subcategoryId?: string, ageMin?: string, ageMax?: string): boolean => {
  const categorizations = categorizeCourse(courseTitle, ageMin, ageMax);
  
  if (subcategoryId) {
    return categorizations.some(cat => cat.category === categoryId && cat.subcategory === subcategoryId);
  } else {
    return categorizations.some(cat => cat.category === categoryId);
  }
};

// Function to get all subcategories for a given category
export const getSubcategoriesForCategory = (categoryId: string): Subcategory[] => {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return [];
  
  return category.subcategories.sort((a, b) => {
    // Check if either subcategory is an "other" type (contains "other" in name or is a fallback)
    const aIsOther = a.name.toLowerCase().includes('other') || a.isFallback;
    const bIsOther = b.name.toLowerCase().includes('other') || b.isFallback;
    
    // If one is "other" and the other isn't, "other" goes to bottom
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    
    // If both are "other" or both are not "other", sort alphabetically
    return a.name.localeCompare(b.name);
  });
};

// Function to get all subcategories from all categories
export const getAllSubcategories = (): Subcategory[] => {
  const allSubcategories: Subcategory[] = [];
  categories.forEach(category => {
    allSubcategories.push(...category.subcategories);
  });
  // Remove duplicates based on id
  const uniqueSubcategories = allSubcategories.filter((subcategory, index, self) => 
    index === self.findIndex(s => s.id === subcategory.id)
  );
  return uniqueSubcategories.sort((a, b) => {
    // Check if either subcategory is an "other" type (contains "other" in name or is a fallback)
    const aIsOther = a.name.toLowerCase().includes('other') || a.isFallback;
    const bIsOther = b.name.toLowerCase().includes('other') || b.isFallback;
    
    // If one is "other" and the other isn't, "other" goes to bottom
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    
    // If both are "other" or both are not "other", sort alphabetically
    return a.name.localeCompare(b.name);
  });
};

// Function to get all course titles that match a category and subcategory
export const getCourseTitlesForCategory = (
  allCourseTitles: string[],
  categoryId: string,
  subcategoryId: string,
  ageMin?: string,
  ageMax?: string
): string[] => {
  if (categoryId === 'all' || !categoryId) {
    return allCourseTitles;
  }
  
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return [];
  
  // If no subcategory is selected, return all titles for this category
  if (!subcategoryId || subcategoryId === '') {
    return allCourseTitles.filter(title => courseMatchesCategory(title, categoryId, undefined, ageMin, ageMax));
  }
  
  const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
  if (!subcategory) return [];
  
  if (subcategory.keywords.length === 0) {
    // For "General" subcategory, return all titles that don't match other categories
    return allCourseTitles.filter(title => courseMatchesCategory(title, categoryId, undefined, ageMin, ageMax));
  }
  
  return allCourseTitles.filter(title => courseMatchesCategory(title, categoryId, subcategoryId, ageMin, ageMax));
};

// Function to get the icon for a category and subcategory
export const getCategoryIcon = (categoryId: string, subcategoryId?: string): string => {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return 'sports'; // Default fallback
  
  // If subcategory is specified, try to get its icon
  if (subcategoryId) {
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (subcategory && subcategory.icon) {
      return subcategory.icon;
    }
  }
  
  // Fall back to category icon
  return category.icon;
};
