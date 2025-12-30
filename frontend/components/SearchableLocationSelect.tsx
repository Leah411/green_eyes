import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { getLocations, clearLocationsCache } from '../lib/locationsCache';

interface Location {
  id: number;
  name: string;
  name_he: string;
  location_type: string;
  region: string;
}

interface SearchableLocationSelectProps {
  value: number | null;
  onChange: (locationId: number | null) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableLocationSelect({
  value,
  onChange,
  placeholder = '-- בחר עיר --',
  className = '',
}: SearchableLocationSelectProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all locations from API (with caching)
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        
        // Clear cache on first load to ensure fresh data
        clearLocationsCache();
        
        // Use cached locations if available (will load from API if cache is empty)
        const allLocations = await getLocations(api);
        
        console.log('SearchableLocationSelect: Loaded locations from DB:', allLocations.length);
        console.log('SearchableLocationSelect: Sample locations:', allLocations.slice(0, 10));
        
        if (allLocations.length > 0) {
          setLocations(allLocations);
          setFilteredLocations(allLocations);
          console.log('SearchableLocationSelect: All locations set successfully:', allLocations.length);
        } else {
          console.warn('SearchableLocationSelect: No locations loaded from DB!');
        }
      } catch (error: any) {
        console.error('Failed to load locations from DB:', error);
        console.error('Error details:', error.response?.data || error.message);
        alert('שגיאה בטעינת המיקומים מה-DB. אנא רענן את הדף.');
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  // Find selected location when value changes
  useEffect(() => {
    if (value && locations.length > 0) {
      const location = locations.find((loc) => loc.id === value);
      setSelectedLocation(location || null);
      if (location) {
        setSearchTerm(location.name_he || location.name);
      } else {
        setSearchTerm('');
      }
    } else {
      setSelectedLocation(null);
      setSearchTerm('');
    }
  }, [value, locations]);

  // Filter locations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Show all locations when no search term
      setFilteredLocations(locations);
      console.log('SearchableLocationSelect: Showing all locations:', locations.length);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = locations.filter(
      (location) =>
        (location.name_he && location.name_he.toLowerCase().includes(term)) ||
        (location.name && location.name.toLowerCase().includes(term))
    );
    console.log('SearchableLocationSelect: Filtered locations:', filtered.length, 'out of', locations.length);
    setFilteredLocations(filtered);
  }, [searchTerm, locations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
    if (!term) {
      onChange(null);
      setSelectedLocation(null);
    }
  };

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    setSearchTerm(location.name_he || location.name);
    onChange(location.id);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedLocation(null);
    onChange(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`} dir="rtl">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-4 py-2 border rounded-lg text-right pr-10"
          dir="rtl"
        />
        {selectedLocation && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="נקה בחירה"
          >
            ×
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400"
          aria-label="פתח/סגור רשימה"
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-2 text-center text-gray-500">טוען...</div>
          ) : filteredLocations.length === 0 ? (
            <div className="px-4 py-2 text-center text-gray-500">
              {searchTerm ? 'לא נמצאו תוצאות' : `אין מיקומים זמינים (נטענו ${locations.length} מיקומים)`}
            </div>
          ) : (
            <>
              {!searchTerm && (
                <div className="px-4 py-2 text-xs text-gray-500 text-center border-b sticky top-0 bg-white">
                  מציג {filteredLocations.length} מיקומים מתוך {locations.length} זמינים
                </div>
              )}
              <ul className="py-1" dir="rtl">
                {filteredLocations.map((location) => (
                  <li
                    key={location.id}
                    onClick={() => handleSelectLocation(location)}
                    className={`px-4 py-2 cursor-pointer hover:bg-green-50 transition-colors ${
                      selectedLocation?.id === location.id ? 'bg-green-100 font-semibold' : ''
                    }`}
                  >
                    <div className="text-right">
                      <div className="font-medium">
                        {location.name_he || location.name}
                      </div>
                      {location.name_he && location.name !== location.name_he && (
                        <div className="text-xs text-gray-500">{location.name}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

