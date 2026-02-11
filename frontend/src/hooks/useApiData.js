import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import httpClient from '@/helpers/httpClient';

// Shared promise cache to handle concurrent requests to the same endpoint
const pendingPromises = new Map();

/**
 * Custom hook for fetching data from API (non-paginated)
 * Handles loading, error states, and request cancellation
 * 
 * @param {string} endpoint - API endpoint (e.g., '/dashboard-stats/')
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Custom error handler
 * @param {Function} options.transformData - Transform response data
 * @param {boolean} options.showToast - Show toast on error (default: true)
 * @param {boolean} options.autoFetch - Auto-fetch on mount (default: true)
 * @param {Array} options.dependencies - Dependencies for useEffect
 * @returns {Object} - { data, loading, error, fetchData, refetch }
 */
export const useApiData = (endpoint, options = {}) => {
  const {
    onSuccess,
    onError,
    transformData,
    showToast = true,
    autoFetch = true,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);
  
  // Store callbacks in refs to prevent infinite loops
  const transformDataRef = useRef(transformData);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const showToastRef = useRef(showToast);

  // Update refs when callbacks change
  useEffect(() => {
    transformDataRef.current = transformData;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    showToastRef.current = showToast;
  }, [transformData, onSuccess, onError, showToast]);

  /**
   * Check if error should be ignored (cancelled requests)
   */
  const shouldIgnoreError = (err) => {
    return (
      err.name === 'AbortError' ||
      err.code === 'ERR_CANCELED' ||
      err.message?.includes('cancelled') ||
      err.message?.includes('Duplicate request cancelled')
    );
  };

  /**
   * Fetch data from API
   */
  const fetchData = useCallback(async (params = {}) => {
    // Prevent concurrent fetches from the same hook instance
    if (fetchingRef.current) {
      return;
    }

    // Create a unique key for this request (endpoint + params)
    const requestKey = `${endpoint}${JSON.stringify(params)}`;
    
    // Check if there's already a pending request for this endpoint+params
    // This check is synchronous, so both components will see the same state
    let requestPromise = pendingPromises.get(requestKey);
    
    if (requestPromise) {
      // Another component is already fetching this, wait for it
      setLoading(true);
      try {
        const sharedData = await requestPromise;
        
        // Apply transform if needed
        let responseData = sharedData;
        if (transformDataRef.current) {
          responseData = transformDataRef.current(responseData);
        }
        
        setData(responseData);
        if (onSuccessRef.current) {
          onSuccessRef.current(responseData);
        }
        return responseData;
      } catch (err) {
        if (!shouldIgnoreError(err)) {
          const errorMessage = err.response?.data?.error || err.response?.data?.message || `Failed to fetch data from ${endpoint}`;
          setError(errorMessage);
          if (showToastRef.current) {
            toast.error(errorMessage, { autoClose: 3000 });
          }
          if (onErrorRef.current) {
            onErrorRef.current(err);
          }
        }
        setData(null);
        return null;
      } finally {
        setLoading(false);
      }
    }

    // No existing promise, create a new one
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    // Create and store the promise IMMEDIATELY (synchronously) before making the request
    // This ensures that if another component checks while we're setting up, it will find this promise
    requestPromise = (async () => {
      try {
        const response = await httpClient.get(endpoint, { params });
        return response.data;
      } catch (err) {
        // Remove from cache on error (unless it's a cancelled duplicate)
        if (!shouldIgnoreError(err)) {
          pendingPromises.delete(requestKey);
        }
        throw err;
      }
    })();
    
    // Store the promise IMMEDIATELY (synchronously, before the request starts)
    pendingPromises.set(requestKey, requestPromise);

    try {
      let responseData = await requestPromise;
      
      // Clean up the promise cache after successful fetch
      pendingPromises.delete(requestKey);

      // Transform data if transform function provided (use ref to get latest)
      if (transformDataRef.current) {
        responseData = transformDataRef.current(responseData);
      }

      setData(responseData);

      if (onSuccessRef.current) {
        onSuccessRef.current(responseData);
      }

      return responseData;
    } catch (err) {
      // Ignore cancelled/aborted errors - try to get data from shared promise
      if (shouldIgnoreError(err)) {
        // Check if there's a pending promise we can wait for
        if (pendingPromises.has(requestKey)) {
          try {
            const sharedData = await pendingPromises.get(requestKey);
            
            // Apply transform if needed
            let responseData = sharedData;
            if (transformDataRef.current) {
              responseData = transformDataRef.current(responseData);
            }
            
            setData(responseData);
            if (onSuccessRef.current) {
              onSuccessRef.current(responseData);
            }
            return responseData;
          } catch (sharedErr) {
            if (!shouldIgnoreError(sharedErr)) {
              const errorMessage = sharedErr.response?.data?.error || sharedErr.response?.data?.message || `Failed to fetch data from ${endpoint}`;
              setError(errorMessage);
              if (showToastRef.current) {
                toast.error(errorMessage, { autoClose: 3000 });
              }
            }
            setData(null);
            return null;
          }
        } else {
          // No shared promise, this was the first request that got cancelled
          // This shouldn't happen, but handle it gracefully
          setLoading(false);
          fetchingRef.current = false;
          return;
        }
      }

      // Clean up on real error
      pendingPromises.delete(requestKey);

      const errorMessage = err.response?.data?.error || err.response?.data?.message || `Failed to fetch data from ${endpoint}`;
      setError(errorMessage);

      if (showToastRef.current) {
        toast.error(errorMessage, { autoClose: 3000 });
      }

      if (onErrorRef.current) {
        onErrorRef.current(err);
      }

      setData(null);
      return null;
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [endpoint]); // Only depend on endpoint, not callbacks

  /**
   * Refetch data (alias for fetchData)
   */
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Track the last endpoint we fetched to prevent duplicate calls
  const lastFetchedEndpointRef = useRef(null);
  
  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      // Only fetch if endpoint changed or we haven't fetched yet
      if (lastFetchedEndpointRef.current !== endpoint) {
        lastFetchedEndpointRef.current = endpoint;
        fetchData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, autoFetch, ...dependencies]);

  return {
    data,
    loading,
    error,
    fetchData,
    refetch,
  };
};

// Default export for convenience
export default useApiData;

