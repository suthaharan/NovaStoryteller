import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import httpClient from '@/helpers/httpClient';

/**
 * Custom hook for fetching paginated data from API
 * Handles loading, error states, pagination, and request cancellation
 * 
 * @param {string} endpoint - API endpoint (e.g., '/stories/')
 * @param {Object} options - Configuration options
 * @param {number} options.defaultPageSize - Default page size (default: 10)
 * @param {Function} options.onError - Custom error handler
 * @param {Function} options.transformData - Transform response data before setting state
 * @param {boolean} options.showToast - Show toast on error (default: true)
 * @returns {Object} - { data, loading, error, pagination, fetchData, handlePageChange, handlePageSizeChange }
 */
export const usePaginatedData = (endpoint, options = {}) => {
  const {
    defaultPageSize = 10,
    onError,
    transformData,
    showToast = true,
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: defaultPageSize,
    total: 0,
    totalPages: 1,
  });

  const fetchingRef = useRef(false);

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
   * Fetch data from API with pagination
   */
  const fetchData = useCallback(async (page = 1, pageSize = defaultPageSize, additionalParams = {}) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page.toString(),
        page_size: pageSize.toString(),
        ...additionalParams,
      };

      const response = await httpClient.get(endpoint, { params });

      if (response.data) {
        let results = response.data.results || response.data;
        const count = response.data.count || (Array.isArray(results) ? results.length : 0);
        const currentPage = response.data.current_page || page;
        const pageSizeFromResponse = response.data.page_size || pageSize;
        const totalPages = Math.ceil(count / pageSizeFromResponse);

        // Transform data if transform function provided
        if (transformData) {
          results = transformData(results);
        }

        setData(Array.isArray(results) ? results : []);
        setPagination({
          currentPage,
          pageSize: pageSizeFromResponse,
          total: count,
          totalPages,
        });

        return {
          data: results,
          total: count,
          page: currentPage,
          pageSize: pageSizeFromResponse,
          totalPages,
        };
      }

      // Fallback for empty responses
      setData([]);
      setPagination({
        currentPage: 1,
        pageSize: defaultPageSize,
        total: 0,
        totalPages: 1,
      });

      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: defaultPageSize,
        totalPages: 1,
      };
    } catch (err) {
      // Ignore cancelled/aborted errors
      if (shouldIgnoreError(err)) {
        return;
      }

      const errorMessage = err.response?.data?.error || err.response?.data?.message || `Failed to fetch data from ${endpoint}`;
      setError(errorMessage);

      if (showToast) {
        toast.error(errorMessage, { autoClose: 3000 });
      }

      if (onError) {
        onError(err);
      }

      setData([]);
      setPagination({
        currentPage: 1,
        pageSize: defaultPageSize,
        total: 0,
        totalPages: 1,
      });

      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: defaultPageSize,
        totalPages: 1,
      };
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [endpoint, defaultPageSize, transformData, onError, showToast]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((newPage) => {
    fetchData(newPage, pagination.pageSize);
  }, [fetchData, pagination.pageSize]);

  /**
   * Handle page size change
   */
  const handlePageSizeChange = useCallback((newPageSize) => {
    fetchData(1, newPageSize); // Reset to page 1 when changing page size
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    pagination,
    fetchData,
    handlePageChange,
    handlePageSizeChange,
  };
};

