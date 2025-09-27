// Category mapping for Toronto recreation programs

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  fallbackIcon: string; // Fallback icon for programs in this category
  ageRequirement?: { min?: number; max?: number }; // Age requirements for this category
}

export interface Subcategory {
  id: string;
  name: string;
  keywords: string[];
  exclusions?: string[]; // Keywords that should prevent matching if present in the title
  isFallback?: boolean; // If true, only matches when no other subcategory in the same category matches
  ageRequirement?: { min?: number; max?: number }; // Age requirements for this subcategory
}


// Program icon mappings for specific program names
export const programIconMappings: Array<{ keywords: string[]; icon: string }> = [
  // Sports
  { keywords: ['basketball'], icon: 'sports_basketball' },
  { keywords: ['soccer'], icon: 'sports_soccer' },
  { keywords: ['volleyball'], icon: 'sports_volleyball' },
  { keywords: ['badminton'], icon: 'badminton' },
  { keywords: ['pickleball'], icon: 'pickleball' },
  { keywords: ['table tennis'], icon: 'padel' },
  { keywords: ['squash'], icon: 'sports_tennis' },
  { keywords: ['hockey', 'shinny'], icon: 'sports_hockey' },
  { keywords: ['cricket'], icon: 'sports_cricket' },
  { keywords: ['multi-sport'], icon: 'directions_run' },
  
  // Swimming & Aquatics
  { keywords: ['swimming', 'swim', 'aquatic fitness'], icon: 'pool' },
  
  // Fitness & Wellness
  { keywords: ['yoga'], icon: 'self_improvement' },
  { keywords: ['pilates'], icon: 'self_improvement' },
  { keywords: ['tai chi'], icon: 'taunt' },
  { keywords: ['strength', 'gym'], icon: 'fitness_center' },
  { keywords: ['walk'], icon: 'directions_walk' },
  { keywords: ['open space'], icon: 'crop_square' },
  
  // Arts & Crafts
  { keywords: ['dance', 'zumba', 'ballroom', 'vogue'], icon: 'taunt' },
  { keywords: ['music'], icon: 'music_note' },
  { keywords: ['photography'], icon: 'photo_camera' },
  
  // Games & Recreation
  { keywords: ['archery'], icon: 'target' },
  { keywords: ['club'], icon: 'groups' },
  { keywords: ['bocce'], icon: 'scatter_plot' },
  { keywords: ['bowling'], icon: 'circle' },
  { keywords: ['bingo'], icon: 'casino' },
  { keywords: ['chess'], icon: 'chess_knight' },
  { keywords: ['cards'], icon: 'playing_cards' },
  { keywords: ['chop it', 'cooking'], icon: 'chef_hat' },
  { keywords: ['snooker'], icon: 'counter_8' },
  { keywords: ['darts'], icon: 'target' },
  { keywords: ['game'], icon: 'Ifl' },
  { keywords: ['skateboard'], icon: 'skateboarding' },
  { keywords: ['lunch'], icon: 'flatware' },
  { keywords: ['movie'], icon: 'movie' },
  { keywords: ['study time'], icon: 'dictionary' },
  { keywords: ['hair'], icon: 'self_care' },
  { keywords: ['video game', 'gaming'], icon: 'videogame_asset' }
];

export const categories: Category[] = [
  {
    id: 'arts-crafts',
    name: 'Arts & Crafts',
    fallbackIcon: 'palette',
    subcategories: [
      { id: 'visual-arts', name: 'Visual Arts', keywords: ['painting', 'drawing', 'photography', 'visual art', 'design', 'colouring', 'stained glass'], exclusions: ['arthritis', 'arthritic'] },
      { id: 'crafts', name: 'Crafts', keywords: ['craft', 'sewing', 'knitting', 'crochet', 'quilting', 'decoupage', 'paper tole', 'bunka', 'carving'] },
      { id: 'music', name: 'Music', keywords: ['music', 'band', 'choir', 'drumming', 'karaoke', 'drum', 'open mic'], exclusions: ['no music'] },
      { id: 'dance', name: 'Dance', keywords: ['dance', 'tango', 'ballroom', 'hip hop', 'line dance', 'vogue'] },
      { id: 'creative-writing', name: 'Creative Writing', keywords: ['creative writing', 'writing'] },
      { id: 'other-arts', name: 'Other Arts Programs', keywords: ['art', 'bunka', 'colouring', 'jewellery making'], exclusions: ['arthritis', 'martial arts'], isFallback: true }
    ]
  },
  {
    id: 'family',
    name: 'Family Programs',
    fallbackIcon: 'family_restroom',
    ageRequirement: { max: 6 },
    subcategories: [
      { id: 'family-swim', name: 'Family Swim', keywords: ['family swim'] },
      { id: 'family-sports', name: 'Family Sports', keywords: ['with family'] },
      { id: 'family-arts', name: 'Family Arts', keywords: ['family arts'] },
      { id: 'early-years', name: 'Early Years', keywords: ['early years', 'preschool', 'caregiver', 'soccer'], exclusions: ['leisure Skate: child with caregiver'] , ageRequirement: { max: 6 }},
      { id: 'other-family-programs', name: 'Other Family Programs', keywords: ['family'], ageRequirement: { max: 6 }, isFallback: true }
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    fallbackIcon: 'cardio_load',
    subcategories: [
      { id: 'yoga', name: 'Yoga', keywords: ['yoga'] },
      { id: 'pilates', name: 'Pilates', keywords: ['pilates'] },
      { id: 'cardio', name: 'Cardio', keywords: ['cardio'] },
      { id: 'zumba', name: 'Zumba', keywords: ['zumba'] },
      { id: 'strength', name: 'Strength Training', keywords: ['strength', 'weight', 'gym'] },
      { id: 'hiit', name: 'HIIT', keywords: ['hiit', 'boot camp'] },
      { id: 'gentle-fitness', name: 'Gentle Fitness', keywords: ['gentle', 'mobility', ': chair', 'osteofit', 'tai chi', 'qigong'] },
      { id: 'walking', name: 'Walking', keywords: ['walk', 'running track'], exclusions: ['aquatic fitness'] },
      { id: 'other-fitness', name: 'Other Fitness & Wellness', keywords: ['fitness', 'wellness', 'cycle', 'fit', 'pedal', 'meditation'], isFallback: true }
    ]
  },
  {
    id: 'games',
    name: 'Games & Recreation',
    fallbackIcon: 'toys_and_games',
    subcategories: [
      { id: 'club', name: 'Clubs', keywords: ['club'] },
      { id: 'board-games', name: 'Board Games', keywords: ['board games', 'games: board', 'chess'] },
      { id: 'card-games', name: 'Card Games', keywords: ['cards', 'euchre', 'bridge', 'cribbage'] },
      { id: 'billiards', name: 'Billiards & Pool', keywords: ['billiards', 'snooker', 'pool'] },
      { id: 'darts', name: 'Darts', keywords: ['darts'] },
      { id: 'video-games', name: 'Video Games', keywords: ['video game', 'gaming'] },
      { id: 'bingo', name: 'Bingo', keywords: ['bingo'] },
      { id: 'other-games', name: 'Other Games & Recreation', keywords: ['game', 'archery', 'bocce', 'bowling'], isFallback: true }
    ]
  },
  {
    id: 'older-adult',
    name: 'Older Adult Programs',
    fallbackIcon: 'group',    
    ageRequirement: { min: 60 },
    subcategories: [
      { id: 'older-adult-arts-crafts', name: 'Older Adult Arts & Crafts', keywords: ['painting', 'drawing', 'photography', 'visual art', 'design', 'colouring', 'craft', 'sewing', 'knitting', 'crochet', 'quilting', 'decoupage', 'paper tole', 'bunka', 'stained glass', 'carving', 'writing', 'music', 'band', 'choir', 'drumming', 'karaoke', 'drum', 'open mic', 'dance', 'tango', 'ballroom'], exclusions: ['dart'], ageRequirement: { min: 60 } },
      { id: 'older-adult-games', name: 'Older Adult Games & Recreation', keywords: ['club', 'bingo', 'bocce', 'game', 'cards', 'bowling', 'dance', 'bridge', 'euchre', 'cribbage', 'billiards', 'pool', 'snooker', 'darts', 'archery', 'bowling', 'karaoke', 'dance', 'tango', 'ballroom', 'hip hop', 'line dance', 'vogue'], ageRequirement: { min: 60 } },
      { id: 'older-adult-swimming', name: 'Older Adult Swimming & Aquatics', keywords: ['swim', 'aquatic'], ageRequirement: { min: 60 } },
      { id: 'older-adult-fitness', name: 'Older Adult Fitness & Wellness', keywords: ['yoga', 'pilates', 'zumba', 'tai chi', 'fit', 'strength', 'walk', 'cardio'], ageRequirement: { min: 60 } },
      { id: 'older-adult-sports', name: 'Older Adult Sports', keywords: ['pickleball', 'basketball', 'badminton', 'volleyball', 'soccer', 'tennis', 'table tennis', 'multi-sport', 'hockey', 'shinny', 'sport', 'baseball', 'dodgeball', 'tennis', 'skateboarding', 'cricket', 'golf'], ageRequirement: { min: 60 } },  
      { id: 'older-adult-skating', name: 'Older Adult Skating & Ice Sports', keywords: ['shinny', 'skate', 'hockey'], exclusions: ['ball hockey', 'skateboard'], ageRequirement: { min: 60 } },     
      { id: 'other-older-adult', name: 'Other Older Adult Programs', keywords: ['older adult', 'osteo'], ageRequirement: { min: 60 },  isFallback: true }
    ]
  },
  {
    id: 'skating',
    name: 'Skating & Ice Sports',
    fallbackIcon: 'ice_skating',
    subcategories: [        
      { id: 'hockey', name: 'Hockey', keywords: ['hockey', 'shinny'], exclusions: ['ball hockey'] },
      { id: 'leisure-skate', name: 'Leisure Skate', keywords: ['leisure skate'] },
      { id: 'figure-skating', name: 'Figure Skating', keywords: ['figure skating'] },
      { id: 'roller-skating', name: 'Roller Skating', keywords: ['roller skating'] },
      { id: 'other-skating', name: 'Other Skating & Ice Sports', keywords: ['skate', 'skating'], isFallback: true }
    ]
  },
  {
    id: 'specialized',
    name: 'Specialized Programs',
    fallbackIcon: 'support',
    subcategories: [
      { id: 'adapted', name: 'Adapted Programs', keywords: ['adapted', 'parasport'] },
      { id: 'lgbtq', name: 'LGBTQ+ Programs', keywords: ['lgbtq', '2slgbtq'] },
      { id: 'women-only', name: 'Women Only', keywords: ['women only', '(women)', 'girls'] }
    ]
  },
  {
    id: 'sports',
    name: 'Sports & Athletics',
    fallbackIcon: 'sports',
    subcategories: [
      { id: 'basketball', name: 'Basketball', keywords: ['basketball'] },
      { id: 'badminton', name: 'Badminton', keywords: ['badminton'] },
      { id: 'pickleball', name: 'Pickleball', keywords: ['pickleball'] },
      { id: 'soccer', name: 'Soccer', keywords: ['soccer'] },
      { id: 'volleyball', name: 'Volleyball', keywords: ['volleyball'] },
      { id: 'table-tennis', name: 'Table Tennis', keywords: ['table tennis'] },
      { id: 'hockey', name: 'Hockey', keywords: ['hockey', 'shinny'] },
      { id: 'multi-sport', name: 'Multi-Sport', keywords: ['multi-sport', 'multi sport'] },
      { id: 'other-sports', name: 'Other Sports & Athletics', keywords: ['sport', 'baseball', 'dodgeball', 'tennis', 'squash', 'skateboarding', 'cricket', 'golf'], isFallback: true }
    ]
  },
  {
    id: 'swimming',
    name: 'Swimming & Aquatics',
    fallbackIcon: 'pool',
    subcategories: [
      { id: 'lane-swim', name: 'Lane Swim', keywords: ['lane swim'] },
      { id: 'leisure-swim', name: 'Leisure Swim', keywords: ['leisure swim'] },
      { id: 'family-swim', name: 'Family Swim', keywords: ['family swim'] },
      { id: 'aquatic-fitness', name: 'Aquatic Fitness', keywords: ['aquatic fitness', 'water fitness', 'water'] },
      { id: 'other-swimming', name: 'Other Swimming', keywords: ['swim', 'aquatic'], isFallback: true }
    ]
  },
  {
    id: 'youth',
    name: 'Youth Programs',
    fallbackIcon: 'group',
    ageRequirement: { min: 13, max: 24 },
    subcategories: [
      { id: 'youth-clubs', name: 'Youth Clubs', keywords: ['club', 'zone', 'homework'], ageRequirement: { min: 13, max: 24 } },
      { id: 'youth-enhanced', name: 'Enhanced Youth Spaces Programming', keywords: ['amped', 'chop', 'building skills', 'stomp', 'social environmental'], ageRequirement: { min: 13, max: 24 } },
      { id: 'youth-arts', name: 'Youth Arts', keywords: ['art', 'music', 'dance', 'craft'], ageRequirement: { min: 13, max: 24 } },
      { id: 'youth-fitness', name: 'Youth Fitness & Wellness', keywords: ['gym', 'cardio', 'wellness'], ageRequirement: { min: 13, max: 24 } },
      { id: 'youth-leadership', name: 'Youth Leadership', keywords: ['youth leadership', 'youth council'], ageRequirement: { min: 13, max: 24 } },
      { id: 'youth-sports', name: 'Youth Sports', keywords: ['sport', 'baseball', 'basketball', 'volleyball', 'badminton', 'soccer', 'dodgeball', 'tennis', 'skateboarding', 'cricket', 'golf', 'hockey', 'shinny'], ageRequirement: { min: 13, max: 24 } },
      { id: 'youth-skating', name: 'Youth Skating & Ice Sports', keywords: ['shinny', 'skate', 'hockey'], exclusions: ['ball hockey', 'skateboard'] , ageRequirement: { min: 13, max: 24 } },
      { id: 'other-youth', name: 'Other Youth Programs', keywords: ['youth', 'teen', 'young'], ageRequirement: { min: 13, max: 24 }, isFallback: true }
    ]
  },
];


// Function to categorize a course title - returns all matches with hierarchical keyword matching
export const categorizeCourse = (courseTitle: string, ageMin?: string, ageMax?: string): Array<{ category: string; subcategory: string }> => {
  const lowerTitle = courseTitle.toLowerCase();
  const matches: Array<{ category: string; subcategory: string }> = [];
  const matchedPrograms = new Set<string>(); // Track which programs have been matched
  
  // Check for age-based categorization first (but with lower priority than specific sports)
  if (ageMin) {
    const minAge = parseInt(ageMin);
    
    // If the program is specifically for seniors (60+), categorize as Senior Programs
    if (minAge >= 60) {
      const matchKey = 'specialized-senior';
      if (!matchedPrograms.has(matchKey)) {
        matches.push({ 
          category: 'specialized', 
          subcategory: 'senior'
        });
        matchedPrograms.add(matchKey);
      }
    }
  }
  
  // Check for youth age ranges - categorize as Youth Programs (but only if no specific sport match)
  if (ageMax) {
    const maxAge = ageMax === "None" ? 999 : parseInt(ageMax);
    
    // If the program's maximum age is between 13-24, categorize as Youth Programs
    if (maxAge >= 13 && maxAge <= 24) {
      const matchKey = 'youth-other-youth';
      if (!matchedPrograms.has(matchKey)) {
        matches.push({ 
          category: 'youth', 
          subcategory: 'other-youth'
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
          subcategory: 'early-years'
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
      
      const matchKey = `${category.id}-${subcategory.id}`;
      if (!matchedPrograms.has(matchKey)) {
        matches.push({ 
          category: category.id, 
          subcategory: subcategory.id
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
                subcategory: subcategory.id
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
  
  // Return matches
  return matches.map(match => ({ category: match.category, subcategory: match.subcategory }));
};

// Function to check if a course title matches a specific category/subcategory
export const courseMatchesCategory = (courseTitle: string, categoryId: string, subcategoryId?: string, ageMin?: string, ageMax?: string): boolean => {
  if (subcategoryId) {
    // Find the specific subcategory
    const category = categories.find(cat => cat.id === categoryId);
    const subcategory = category?.subcategories.find(sub => sub.id === subcategoryId);
    
    if (!subcategory) {
      return false;
    }
    
    const lowerTitle = courseTitle.toLowerCase();
    
    // Check for exclusions first (if any exclusions match, reject immediately)
    if (subcategory.exclusions && subcategory.exclusions.some((exclusion: string) => 
      lowerTitle.includes(exclusion.toLowerCase())
    )) {
      return false;
    }
    
    // For fallback subcategories, check if any other specific subcategory would match
    if (subcategory.isFallback && category) {
      // Parse age once for efficiency
      const courseAgeMin = ageMin ? parseInt(ageMin) : 0;
      const courseAgeMax = ageMax === "None" ? 999 : (ageMax ? parseInt(ageMax) : 999);
      
      // Check if this fallback subcategory has age requirements
      let meetsFallbackAgeRequirement = true;
      if (subcategory.ageRequirement) {
        const { min: requiredMin, max: requiredMax } = subcategory.ageRequirement;
        if (requiredMin && courseAgeMin < requiredMin) meetsFallbackAgeRequirement = false;
        if (requiredMax && courseAgeMax > requiredMax) meetsFallbackAgeRequirement = false;
      }
      
      // If fallback has age requirements and doesn't meet them, reject
      if (subcategory.ageRequirement && !meetsFallbackAgeRequirement) {
        return false;
      }
      
      // If fallback has no age requirements, check keyword matching
      if (!subcategory.ageRequirement) {
        const matchesKeywords = subcategory.keywords.some(keyword => 
          lowerTitle.includes(keyword.toLowerCase())
        );
        
        if (!matchesKeywords) {
          return false;
        }
      }
      
      // For fallback subcategories with age requirements, allow programs that meet age requirements
      // even if they don't match keywords (as long as no other specific subcategory would match)
      
      // Get other non-fallback subcategories once
      const otherSubcategories = category.subcategories.filter(sub => 
        !sub.isFallback && sub.id !== subcategoryId && sub.keywords.length > 0
      );
      
      // Early exit if no other subcategories to check
      if (otherSubcategories.length === 0) {
        return true;
      }
      
      for (const otherSub of otherSubcategories) {
        // Quick keyword check first (most likely to fail)
        const otherMatchesKeywords = otherSub.keywords.some(keyword => 
          lowerTitle.includes(keyword.toLowerCase())
        );
        
        if (!otherMatchesKeywords) continue;
        
        // Check exclusions (quick check)
        const hasExclusions = otherSub.exclusions && otherSub.exclusions.some((exclusion: string) => 
          lowerTitle.includes(exclusion.toLowerCase())
        );
        
        if (hasExclusions) continue;
        
        // Check age requirements (only if needed)
        if (otherSub.ageRequirement) {
          const { min: requiredMin, max: requiredMax } = otherSub.ageRequirement;
          
          if (requiredMin && courseAgeMin < requiredMin) continue;
          if (requiredMax && courseAgeMax > requiredMax) continue;
        }
        
        // Another specific subcategory would match, so this fallback shouldn't match
        return false;
      }
    }
    
    // For non-fallback subcategories, check keyword matching
    if (!subcategory.isFallback) {
      const matchesKeywords = subcategory.keywords.some(keyword => 
        lowerTitle.includes(keyword.toLowerCase())
      );
      
      if (!matchesKeywords) {
        return false;
      }
    }
    
    // Check if the subcategory has age requirements
    if (subcategory.ageRequirement) {
      // Parse the course's age requirements
      const courseAgeMin = ageMin ? parseInt(ageMin) : 0;
      const courseAgeMax = ageMax === "None" ? 999 : (ageMax ? parseInt(ageMax) : 999);
      
      // Check if the course's age range meets the subcategory's age requirements
      const { min: requiredMin, max: requiredMax } = subcategory.ageRequirement;
      
      // For senior-sports: course must be for ages 60+ (courseAgeMin >= 60)
      if (requiredMin && courseAgeMin < requiredMin) {
        return false;
      }
      
      // For youth programs: course must be for ages under the max (courseAgeMax <= requiredMax)
      if (requiredMax && courseAgeMax > requiredMax) {
        return false;
      }
    }
    
    return true;
  } else {
    // For category-only matching, check if any subcategory in the category matches
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return false;
    
    // Check category age requirements first
    if (category.ageRequirement) {
      const courseAgeMin = ageMin ? parseInt(ageMin) : 0;
      const courseAgeMax = ageMax === "None" ? 999 : (ageMax ? parseInt(ageMax) : 999);
      const { min: requiredMin, max: requiredMax } = category.ageRequirement;
      
      if (requiredMin && courseAgeMin < requiredMin) return false;
      if (requiredMax && courseAgeMax > requiredMax) return false;
    }
    
    // Check if any subcategory in this category matches
    for (const subcategory of category.subcategories) {
      if (courseMatchesCategory(courseTitle, categoryId, subcategory.id, ageMin, ageMax)) {
        return true;
      }
    }
    
    return false;
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



// Function to get the icon for a specific program title
export const getProgramIcon = (programTitle: string, ageMin?: string, ageMax?: string): string => {
  const lowerTitle = programTitle.toLowerCase();
  
  // Check for specific program icon mappings first
  for (const mapping of programIconMappings) {
    if (mapping.keywords.some(keyword => lowerTitle.includes(keyword))) {
      return mapping.icon;
    }
  }
  
  // Find the best matching category using the new logic
  for (const category of categories) {
    // Check each subcategory first (more specific)
    for (const subcategory of category.subcategories) {
      if (courseMatchesCategory(programTitle, category.id, subcategory.id, ageMin, ageMax)) {
        // Use the category's fallback icon for subcategories
        return category.fallbackIcon;
      }
    }
    
    // Check if it matches the category without subcategory (less specific)
    if (courseMatchesCategory(programTitle, category.id, undefined, ageMin, ageMax)) {
      return category.fallbackIcon;
    }
  }
  
  // Final fallback
  return 'sports';
};



