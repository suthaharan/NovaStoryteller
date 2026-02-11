import { useState, useEffect, useCallback, useRef } from 'react';
import { usePaginatedData } from './usePaginatedData';
import { useApiData } from './useApiData';

/**
 * Custom hook for fetching paginated data with filters (search, category, status)
 * Handles debounced search and filter changes
 * 
 * @param {string} endpoint - API endpoint (e.g., '/news/')
 * @param {string} categoriesEndpoint - Categories API endpoint (e.g., '/news-categories/')
 * @param {Object} options - Configuration options
 * @param {number} options.defaultPageSize - Default page size (default: 10)
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 500)
 * @param {Function} options.onError - Custom error handler
 * @param {Function} options.transformData - Transform response data
 * @param {boolean} options.showToast - Show toast on error (default: true)
 * @returns {Object} - { data, loading, error, pagination, categories, searchQuery, selectedCategory, selectedStatus, setSearchQuery, setSelectedCategory, setSelectedStatus, handlePageChange, handlePageSizeChange, refetch }
 */
export const useFilteredPaginatedData = (endpoint, categoriesEndpoint, options = {}) => {
  const {
    defaultPageSize = 10,
    debounceMs = 500,
    onError,
    transformData,
    showToast = true,
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const isInitialMount = useRef(true);

  // Fetch categories
  const { data: categoriesData, loading: categoriesLoading } = useApiData(categoriesEndpoint, {
    transformData: (data) => data.results || data || [],
    showToast: false,
    autoFetch: true,
  });

  const categories = categoriesData || [];

  // Use paginated data hook
  const {
    data,
    loading,
    error,
    pagination,
    fetchData,
    handlePageChange: baseHandlePageChange,
    handlePageSizeChange,
  } = usePaginatedData(endpoint, {
    defaultPageSize,
    onError,
    transformData,
    showToast,
  });

  // Initial fetch on mount
  useEffect(() => {
    if (isInitialMount.current) {
      const filterParams = {};
      if (searchQuery) filterParams.search = searchQuery;
      if (selectedCategory) filterParams.category_id = selectedCategory;
      if (selectedStatus) filterParams.status = selectedStatus;
      fetchData(1, defaultPageSize, filterParams);
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle page changes (not on initial mount)
  useEffect(() => {
    if (!isInitialMount.current) {
      const filterParams = {};
      if (searchQuery) filterParams.search = searchQuery;
      if (selectedCategory) filterParams.category_id = selectedCategory;
      if (selectedStatus) filterParams.status = selectedStatus;
      fetchData(pagination.currentPage, pagination.pageSize, filterParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage]);

  // Debounced filter changes (search, category, status)
  useEffect(() => {
    if (isInitialMount.current) return;

    const timer = setTimeout(() => {
      const filterParams = {};
      if (searchQuery) filterParams.search = searchQuery;
      if (selectedCategory) filterParams.category_id = selectedCategory;
      if (selectedStatus) filterParams.status = selectedStatus;
      
      // Reset to page 1 when filters change
      fetchData(1, pagination.pageSize, filterParams);
    }, debounceMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedStatus]);

  /**
   * Fetch data with current filters
   */
  const refetch = useCallback((page = 1) => {
    const filterParams = {};
    if (searchQuery) filterParams.search = searchQuery;
    if (selectedCategory) filterParams.category_id = selectedCategory;
    if (selectedStatus) filterParams.status = selectedStatus;
    return fetchData(page, pagination.pageSize, filterParams);
  }, [fetchData, pagination.pageSize, searchQuery, selectedCategory, selectedStatus]);

  /**
   * Handle page change with filters
   */
  const handlePageChange = useCallback((newPage) => {
    const filterParams = {};
    if (searchQuery) filterParams.search = searchQuery;
    if (selectedCategory) filterParams.category_id = selectedCategory;
    if (selectedStatus) filterParams.status = selectedStatus;
    fetchData(newPage, pagination.pageSize, filterParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchData, pagination.pageSize, searchQuery, selectedCategory, selectedStatus]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
  }, []);

  return {
    data,
    loading: loading || categoriesLoading,
    error,
    pagination,
    categories,
    searchQuery,
    selectedCategory,
    selectedStatus,
    setSearchQuery,
    setSelectedCategory,
    setSelectedStatus,
    handlePageChange,
    handlePageSizeChange,
    refetch,
    clearFilters,
  };
};

