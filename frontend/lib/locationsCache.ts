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
      // Request large page size to get all locations in one request
      let response;
      try {
        console.log('locationsCache: Calling api.listLocations() with large page_size (10000)...');
        
        // Request a very large page size to get all locations in one request
        // The API now supports page_size up to 10000
        const apiCall = api.listLocations({ page_size: 10000 });
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
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
        hasNext: !!data.next,
        count: data.count,
        dataKeys: Object.keys(data || {}),
        dataType: typeof data
      });
      
      let allLocations: any[] = [];
      
      // Handle paginated response
      if (data && data.results && Array.isArray(data.results)) {
        allLocations = [...data.results];
        const totalCount = data.count || allLocations.length;
        console.log('locationsCache: Data has results array, initial length:', allLocations.length, 'total count:', totalCount);
        
        // With page_size=10000, we should get all locations in one request
        // But if pagination still exists, load remaining pages
        let nextUrl = data.next;
        let page = 2;
        const maxPages = 5; // Safety limit (shouldn't need more with page_size=10000)
        let pagesLoaded = 1;
        
        // Only load more pages if we didn't get all locations
        if (nextUrl && allLocations.length < totalCount) {
          console.log(`locationsCache: Still need more locations (have ${allLocations.length} of ${totalCount}), loading additional pages...`);
          
          while (nextUrl && allLocations.length < totalCount && pagesLoaded < maxPages) {
            try {
              console.log(`locationsCache: Loading page ${page}... (have ${allLocations.length} of ${totalCount})`);
              const nextResponse = await api.listLocations({ page, page_size: 10000 });
              const nextData = nextResponse.data;
              
              if (nextData.results && Array.isArray(nextData.results) && nextData.results.length > 0) {
                allLocations = [...allLocations, ...nextData.results];
                nextUrl = nextData.next;
                page++;
                pagesLoaded++;
                console.log(`locationsCache: Page ${page - 1} loaded, now have ${allLocations.length} locations`);
                
                // If we got all locations, stop
                if (allLocations.length >= totalCount) {
                  console.log('locationsCache: Got all locations, stopping pagination');
                  break;
                }
              } else {
                console.log('locationsCache: No more results, stopping pagination');
                nextUrl = null;
              }
            } catch (pageError: any) {
              console.error(`locationsCache: Error loading page ${page}:`, pageError);
              // Continue with what we have instead of stopping completely
              nextUrl = null;
            }
          }
        }
        
        console.log('locationsCache: Total locations loaded:', allLocations.length, 'expected:', totalCount);
        
        if (allLocations.length < totalCount) {
          console.warn(`locationsCache: Warning - Only loaded ${allLocations.length} out of ${totalCount} locations`);
        } else {
          console.log('locationsCache: Successfully loaded all locations in', pagesLoaded, 'page(s)');
        }
      } else if (Array.isArray(data)) {
        // Non-paginated response (array)
        allLocations = data;
        console.log('locationsCache: Data is array, length:', allLocations.length);
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


