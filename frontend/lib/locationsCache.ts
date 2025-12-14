// Global cache for locations to avoid reloading on every component mount
let locationsCache: any[] | null = null;
let locationsCachePromise: Promise<any[]> | null = null;

export const getLocations = async (api: any): Promise<any[]> => {
  // If already cached, return immediately
  if (locationsCache) {
    return locationsCache;
  }

  // If already loading, return the existing promise
  if (locationsCachePromise) {
    return locationsCachePromise;
  }

  // Start loading
  locationsCachePromise = (async () => {
    try {
      console.log('locationsCache: Fetching locations from API...');
      console.log('locationsCache: API object:', api);
      console.log('locationsCache: listLocations method:', typeof api.listLocations);
      
      // Call API directly with error handling and timeout
      let response;
      try {
        console.log('locationsCache: Calling api.listLocations()...');
        
        // Add timeout wrapper
        const apiCall = api.listLocations();
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
        );
        
        response = await Promise.race([apiCall, timeout]) as any;
        console.log('locationsCache: Got response, status:', response?.status);
      } catch (apiError: any) {
        console.error('locationsCache: API call failed:', apiError);
        console.error('locationsCache: API error details:', {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          stack: apiError.stack
        });
        throw apiError;
      }
      const data = response.data;
      
      console.log('locationsCache: API response:', { 
        isArray: Array.isArray(data), 
        hasResults: !!data.results,
        resultsLength: data.results?.length || 0,
        dataKeys: Object.keys(data || {}),
        dataType: typeof data
      });
      
      let allLocations: any[] = [];
      
      if (Array.isArray(data)) {
        allLocations = data;
        console.log('locationsCache: Data is array, length:', allLocations.length);
      } else if (data && data.results && Array.isArray(data.results)) {
        allLocations = data.results;
        console.log('locationsCache: Data has results array, length:', allLocations.length);
      } else {
        console.warn('locationsCache: Unexpected data format:', data);
      }
      
      console.log('locationsCache: Parsed locations count:', allLocations.length);
      
      // Cache the result
      locationsCache = allLocations;
      locationsCachePromise = null;
      
      console.log('locationsCache: Caching complete, returning', allLocations.length, 'locations');
      return allLocations;
    } catch (error: any) {
      console.error('locationsCache: Error loading locations:', error);
      console.error('locationsCache: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      locationsCachePromise = null;
      // If 401, try without auth
      if (error.response?.status === 401) {
        console.log('locationsCache: Got 401, retrying without auth...');
        try {
          const axios = require('axios');
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await axios.get(`${API_URL}/api/locations/`);
          const data = response.data;
          const allLocations: any[] = Array.isArray(data) ? data : (data.results || []);
          console.log('locationsCache: Retry successful, got', allLocations.length, 'locations');
          locationsCache = allLocations;
          return allLocations;
        } catch (retryError) {
          console.error('locationsCache: Failed to load locations (retry):', retryError);
          throw retryError;
        }
      }
      throw error;
    }
  })();

  return locationsCachePromise;
};

export const clearLocationsCache = () => {
  locationsCache = null;
  locationsCachePromise = null;
};


