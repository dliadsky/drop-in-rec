import React, { useEffect, useRef, useState } from 'react';

interface Location {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  url?: string;
}

interface LocationMapProps {
  locations: Location[];
  isLoading: boolean;
  selectedLocation?: string;
  onLocationSelect?: (location: string) => void;
  selectedLocations?: string[];
  locationHasResults?: (locationName: string) => boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({ locations, isLoading, selectedLocation, onLocationSelect, selectedLocations = [], locationHasResults }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<Map<string, any>>(new Map());
  const [mapboxLoaded, setMapboxLoaded] = useState(false);


  // Wait for Mapbox to load
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    const checkMapLibre = () => {
      if (typeof (window as any).maplibregl !== 'undefined') {
        setMapboxLoaded(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkMapLibre, 100);
      } else {
        setMapboxLoaded(false);
      }
    };
    checkMapLibre();
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || !mapboxLoaded || map.current) return;

    try {
      // Detect dark mode preference
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const mapStyle = isDarkMode 
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' 
        : 'https://tiles.openfreemap.org/styles/positron';
      
      map.current = new (window as any).maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-79.3832, 43.6532], // Default to Toronto center
        zoom: 10
      });

      // Add navigation controls
      map.current.addControl(new (window as any).maplibregl.NavigationControl());
      
      // Force resize after map loads to ensure proper rendering
      map.current.on('load', () => {
        setTimeout(() => {
          if (map.current) {
            map.current.resize();
          }
        }, 100);
      });
      
      // Listen for dark mode changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleDarkModeChange = (e: MediaQueryListEvent) => {
        if (map.current) {
          const newStyle = e.matches 
            ? 'https://tiles.openfreemap.org/styles/dark-matter' 
            : 'https://tiles.openfreemap.org/styles/positron';
          map.current.setStyle(newStyle);
        }
      };
      
      mediaQuery.addEventListener('change', handleDarkModeChange);
      
      // Store the listener for cleanup
      (map.current as any)._darkModeListener = { mediaQuery, handleDarkModeChange };
      
      // Add simple resize handler
      const handleResize = () => {
        if (map.current) {
          map.current.resize();
        }
      };
      
      window.addEventListener('resize', handleResize);
      (map.current as any)._resizeHandler = handleResize;
      
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, [mapboxLoaded]);

  // Update markers and center map when locations change
  useEffect(() => {
    if (!map.current || !mapboxLoaded) return;

    // Always clear existing markers first
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // If no locations, just return without modifying the map
    if (locations.length === 0) {
      return;
    }

    // Add markers for each location
    locations.forEach((location) => {
      try {
        if (!location.lat || !location.lng) {
          return;
        }

        const isSelected = selectedLocation === location.name;
        const isInSelectedLocations = selectedLocations.includes(location.name);
        
        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        
        if (isSelected) {
          // Currently selected marker - check if it has results to determine color
          const hasResultsForLocation = locationHasResults ? locationHasResults(location.name) : false;
          const isInSelectedLocations = selectedLocations.includes(location.name);
          
          // Check if mobile screen (less than 10240px)
          const isMobile = window.innerWidth < 1024;
          
          let color, size;
          if (isInSelectedLocations && !hasResultsForLocation) {
            // Selected location with no results - darker gray and larger
            color = 'rgb(128, 128, 128)';
            size = isMobile ? '22px' : '26px';
          } else {
            // Selected location with results or not in selected locations - blue
            color = 'rgb(20, 161, 255)';
            size = isMobile ? '22px' : '26px';
          }
          
          markerElement.style.cssText = `
            width: ${size};
            height: ${size};
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s ease;
          `;
        } else if (isInSelectedLocations) {
          // Selected location - light blue if has results for this specific location, gray if no results
          const hasResultsForLocation = locationHasResults ? locationHasResults(location.name) : false;
          const color = hasResultsForLocation ? 'rgb(149, 214, 247)' : 'rgb(180, 180, 180)';
          const isMobile = window.innerWidth < 1024;
          const size = isMobile ? '16px' : '20px';
          
          markerElement.style.cssText = `
            width: ${size};
            height: ${size};
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s ease;
          `;
        } else {
          // Default marker - light blue
          const isMobile = window.innerWidth < 1024;
          const size = isMobile ? '16px' : '20px';
          
          markerElement.style.cssText = `
            width: ${size};
            height: ${size};
            background-color:rgb(149, 214, 247);
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s ease;
          `;
        }

        const marker = new (window as any).maplibregl.Marker({ element: markerElement })
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new (window as any).maplibregl.Popup().setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-base text-slate-800 dark:text-slate-800">${location.name}</h3>
                ${location.address ? `<p class="mt-1 text-sm text-slate-500 dark:text-slate-500 whitespace-pre-line">${location.address}</p>` : ''}
                ${location.url ? `
                  <a class="p-1 mt-4 inline-flex items-center justify-center line-height-1 w-full bg-[#13a4ec]/10 dark:bg-[#13a4ec]/20 text-gray-700 dark:text-gray-700 text-sm font-medium px-4 rounded-lg hover:text-black dark:hover:text-white hover:bg-[#13a4ec]/1 dark:hover:bg-[#13a4ec]/30 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#13a4ec] focus:ring-offset-2 transition-all duration-200 ease-in-out" href="${location.url}" target="_blank" rel="noopener noreferrer">
                    <span>View on City Website</span>
                    <span class="material-symbols-outlined ml-2 text-base transition-transform duration-200 ease-in-out group-hover:translate-x-1">arrow_right_alt</span>
                  </a>
                ` : ''}
              </div>
            `)
          )
          .addTo(map.current);

        // Add click handler to marker
        markerElement.addEventListener('click', (e) => {
          e.stopPropagation();
          onLocationSelect?.(location.name);
          // Also open the popup immediately
          marker.togglePopup();
        });

        markers.current.set(location.name, marker);
      } catch (error) {
        // Silently handle marker creation errors
      }
    });

    // Fit map to show all markers
    if (locations.length > 0) {
      try {
        if (locations.length === 1) {
          // Center on single location
          const location = locations[0];
          if (location.lat && location.lng) {
            map.current.setCenter([location.lng, location.lat]);
            map.current.setZoom(12);
          }
        } else {
          // Fit bounds for multiple locations
          const bounds = new (window as any).maplibregl.LngLatBounds();
          locations.forEach(location => {
            if (location.lat && location.lng) {
              bounds.extend([location.lng, location.lat]);
            }
          });
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }
      } catch (error) {
        // Silently handle bounds fitting errors
      }
    }

  }, [locations, mapboxLoaded, selectedLocation]);

  // Handle popup opening when location is selected
  useEffect(() => {
    if (!map.current || !selectedLocation || !mapboxLoaded) return;

    const selectedMarker = markers.current.get(selectedLocation);
    if (selectedMarker) {
      // Close any existing popups first
      markers.current.forEach(marker => {
        if (marker.getPopup().isOpen()) {
          marker.togglePopup();
        }
      });
      // Open the popup for the selected marker
      selectedMarker.togglePopup();
    }
  }, [selectedLocation, mapboxLoaded]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up markers
      markers.current.forEach(marker => marker.remove());
      markers.current.clear();
      
      // Clean up map
      if (map.current) {
        // Remove dark mode listener
        const darkModeListener = (map.current as any)._darkModeListener;
        if (darkModeListener) {
          darkModeListener.mediaQuery.removeEventListener('change', darkModeListener.handleDarkModeChange);
        }
        
        // Remove resize handler
        const resizeHandler = (map.current as any)._resizeHandler;
        if (resizeHandler) {
          window.removeEventListener('resize', resizeHandler);
        }
        
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Loading map...
        </div>
      </div>
    );
  }

  if (!mapboxLoaded) {
    return (
      <div className="w-full h-full bg-gray-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Loading map...
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-slate-400">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">No locations to display</p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full h-full min-h-[300px] lg:min-h-0 relative">
      {/* Header positioned absolutely over the map */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200">
          Locations ({locations.length})
        </h3>
      </div>
      
      {/* Map fills the entire container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default LocationMap;
