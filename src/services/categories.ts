// Category mapping for Toronto recreation programs

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  keywords: string[];
  isFallback?: boolean; // If true, only matches when no other subcategory in the same category matches
}

export const categories: Category[] = [
  {
    id: 'arts-crafts',
    name: 'Arts & Crafts',
    subcategories: [
      { id: 'visual-arts', name: 'Visual Arts', keywords: ['painting', 'drawing', 'photography', 'visual art'] },
      { id: 'crafts', name: 'Crafts', keywords: ['craft', 'sewing', 'knitting', 'crochet', 'quilting', 'decoupage'] },
      { id: 'music', name: 'Music', keywords: ['music', 'band', 'choir', 'drumming', 'karaoke', 'drum', 'open mic'] },
      { id: 'dance', name: 'Dance', keywords: ['dance', 'tango', 'ballroom', 'hip hop', 'line dance', 'vogue'] },
      { id: 'creative-writing', name: 'Creative Writing', keywords: ['creative writing', 'writing'] },
      { id: 'other-arts', name: 'Other Arts Programs', keywords: ['art', 'bunka', 'colouring', 'jewellery making'], isFallback: true }
    ]
  },
  {
    id: 'family',
    name: 'Family',
    subcategories: [
      { id: 'family-swim', name: 'Family Swim', keywords: ['family swim', 'swim: family'] },
      { id: 'family-sports', name: 'Family Sports', keywords: ['basketball with family', 'badminton with family', 'pickleball with family', 'soccer with family', 'volleyball with family', 'tennis with family', 'table-tennis with family', 'skate with family', 'multi-sport with family'] },
      { id: 'family-arts', name: 'Family Arts', keywords: ['family arts'] },
      { id: 'early-years', name: 'Early Years', keywords: ['early years', 'preschool'] },
      { id: 'other-family-programs', name: 'Other Family Programs', keywords: ['family'], isFallback: true }
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    subcategories: [
      { id: 'yoga', name: 'Yoga', keywords: ['yoga'] },
      { id: 'pilates', name: 'Pilates', keywords: ['pilates'] },
      { id: 'cardio', name: 'Cardio', keywords: ['cardio'] },
      { id: 'zumba', name: 'Zumba', keywords: ['zumba'] },
      { id: 'strength', name: 'Strength Training', keywords: ['strength', 'weight'] },
      { id: 'hiit', name: 'HIIT', keywords: ['hiit', 'boot camp'] },
      { id: 'gentle-fitness', name: 'Gentle Fitness', keywords: ['gentle', 'mobility', ': chair', 'osteofit', 'tai chi', 'qigong'] },
      { id: 'walking', name: 'Walking', keywords: ['walk', 'running track'] },
      { id: 'other-fitness', name: 'Other Fitness & Wellness', keywords: ['fitness', 'wellness', 'cycle', 'fit', 'pedal', 'meditation'],  isFallback: true }
    ]
  },
  {
    id: 'games',
    name: 'Games & Recreation',
    subcategories: [
      { id: 'board-games', name: 'Board Games', keywords: ['board games', ': board', 'chess'] },
      { id: 'card-games', name: 'Card Games', keywords: ['cards', 'euchre', 'bridge', 'cribbage'] },
      { id: 'billiards', name: 'Billiards & Pool', keywords: ['billiards', 'snooker', 'pool'] },
      { id: 'darts', name: 'Darts', keywords: ['darts'] },
      { id: 'video-games', name: 'Video Games', keywords: ['video game', 'gaming'] },
      { id: 'bingo', name: 'Bingo', keywords: ['bingo'] },
      { id: 'other-games', name: 'Other Games & Recreation', keywords: ['games', 'archery', 'bocce', 'bowling'], isFallback: true }
    ]
  },
  {
    id: 'skating',
    name: 'Skating & Ice Sports',
    subcategories: [        
      { id: 'hockey', name: 'Hockey', keywords: ['hockey', 'shinny'] },
      { id: 'leisure-skate', name: 'Leisure Skate', keywords: ['leisure skate'] },
      { id: 'figure-skating', name: 'Figure Skating', keywords: ['figure skating'] },
      { id: 'roller-skating', name: 'Roller Skating', keywords: ['roller skating'] },
      { id: 'other-skating', name: 'Other Skating & Ice Sports', keywords: ['skate', 'skating'], isFallback: true }
    ]
  },
  {
    id: 'specialized',
    name: 'Specialized Programs',
    subcategories: [
      { id: 'adapted', name: 'Adapted Programs', keywords: ['adapted', 'parasport'] },
      { id: 'senior', name: 'Senior Programs', keywords: ['senior', 'older adult', 'bingo'] },
      { id: 'lgbtq', name: 'LGBTQ+ Programs', keywords: ['lgbtq', '2slgbtq'] },
      { id: 'women-only', name: 'Women Only', keywords: ['women only', '(women)', 'girls'] }
    ]
  },
  {
    id: 'sports',
    name: 'Sports & Athletics',
    subcategories: [
      { id: 'basketball', name: 'Basketball', keywords: ['basketball'] },
      { id: 'badminton', name: 'Badminton', keywords: ['badminton'] },
      { id: 'pickleball', name: 'Pickleball', keywords: ['pickleball'] },
      { id: 'soccer', name: 'Soccer', keywords: ['soccer'] },
      { id: 'volleyball', name: 'Volleyball', keywords: ['volleyball'] },
      { id: 'table-tennis', name: 'Table Tennis', keywords: ['table tennis'] },
      { id: 'hockey', name: 'Hockey', keywords: ['hockey', 'shinny'] },
      { id: 'multi-sport', name: 'Multi-Sport', keywords: ['multi-sport', 'multi sport'] },
      { id: 'other-sports', name: 'Other Sports & Athletics', keywords: ['sport', 'baseball', 'dodgeball', 'tennis', 'skateboarding', 'cricket', 'golf'], isFallback: true }
    ]
  },
  {
    id: 'swimming',
    name: 'Swimming & Aquatics',
    subcategories: [
      { id: 'lane-swim', name: 'Lane Swim', keywords: ['lane swim'] },
      { id: 'leisure-swim', name: 'Leisure Swim', keywords: ['leisure swim'] },
      { id: 'family-swim', name: 'Family Swim', keywords: ['family swim', 'family', 'caregiver'] },
      { id: 'aquatic-fitness', name: 'Aquatic Fitness', keywords: ['aquatic fitness', 'water fitness', 'water'] },
      { id: 'other-swimming', name: 'Other Swimming', keywords: ['swim', 'aquatic'], isFallback: true }
    ]
  },
  {
    id: 'youth',
    name: 'Youth Programs',
    subcategories: [
      { id: 'youth-clubs', name: 'Youth Clubs', keywords: ['youth club', 'teen club', 'club', 'zone'] },
      { id: 'youth-sports', name: 'Youth Sports', keywords: ['youth sport', 'youth basketball', 'youth soccer', 'youth hockey', 'youth volleyball', 'youth tennis', 'youth badminton', 'youth table tennis', 'youth multi-sport', 'youth shinny', 'child sport', 'kids sport'] },
      { id: 'youth-arts', name: 'Youth Arts', keywords: ['youth art', 'youth craft', 'youth music', 'youth dance', 'youth creative', 'child art', 'child craft', 'child music', 'child dance', 'kids art', 'kids craft', 'kids music', 'kids dance'] },
      { id: 'youth-leadership', name: 'Youth Leadership', keywords: ['youth leadership', 'youth council'] },
      { id: 'other-youth', name: 'Other Youth Programs', keywords: ['youth', 'teen'], isFallback: true }
    ]
  },
];

// Function to categorize a course title - returns all matches with hierarchical keyword matching
export const categorizeCourse = (courseTitle: string): Array<{ category: string; subcategory: string }> => {
  const lowerTitle = courseTitle.toLowerCase();
  const matches: Array<{ category: string; subcategory: string; keywordLength: number }> = [];
  const matchedPrograms = new Set<string>(); // Track which programs have been matched
  
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
  
  // If still no matches found, default to "Other" category with "General" subcategory
  if (matches.length === 0) {
    matches.push({ category: 'other', subcategory: 'general', keywordLength: 0 });
  }
  
  // Return matches without the keywordLength property
  return matches.map(match => ({ 
    category: match.category, 
    subcategory: match.subcategory 
  }));
};

// Function to check if a course title matches a specific category/subcategory
export const courseMatchesCategory = (courseTitle: string, categoryId: string, subcategoryId?: string): boolean => {
  const categorizations = categorizeCourse(courseTitle);
  
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
  subcategoryId: string
): string[] => {
  if (categoryId === 'all' || !categoryId) {
    return allCourseTitles;
  }
  
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return [];
  
  // If no subcategory is selected, return all titles for this category
  if (!subcategoryId || subcategoryId === '') {
    return allCourseTitles.filter(title => courseMatchesCategory(title, categoryId));
  }
  
  const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
  if (!subcategory) return [];
  
  if (subcategory.keywords.length === 0) {
    // For "General" subcategory, return all titles that don't match other categories
    return allCourseTitles.filter(title => courseMatchesCategory(title, categoryId));
  }
  
  return allCourseTitles.filter(title => courseMatchesCategory(title, categoryId, subcategoryId));
};
