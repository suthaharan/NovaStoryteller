import axios from 'axios';
import { getCookie, deleteCookie } from 'cookies-next';

// Get API URL from environment variable
// In production (Django serving React): VITE_API_URL = '/api' (relative, same origin)
// In development (Vite dev server): VITE_API_URL = 'http://localhost:8000/api' (full URL)
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Auth session key (must match useAuthContext.jsx)
const authSessionKey = '_Ace_AUTH_KEY_';

// Request queue to prevent duplicate concurrent requests
// This helps reduce MySQL connections by canceling duplicate requests
const pendingRequests = new Map();

// Module-level cache to track recent requests (prevents duplicates even across remounts)
// Key: URL, Value: timestamp
const recentRequests = new Map();
const REQUEST_CACHE_DURATION = 2000; // 2 seconds - ignore duplicate requests within this window (handles StrictMode remounts)

// Create axios instance with base URL
const httpClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Include cookies (needed for CSRF token)
});

// Request interceptor - Add auth token and cancel duplicate requests
httpClient.interceptors.request.use(
  (config) => {
    // Cancel duplicate GET requests to prevent too many MySQL connections
    // Only cancel if it's a GET request (safe to cancel) and same URL is already pending
    if (config.method?.toLowerCase() === 'get') {
      // Normalize URL to ensure consistent matching (handle query param order differences)
      let requestKey = config.url || '';
      // If URL has query params, normalize them by sorting
      if (requestKey.includes('?')) {
        const [path, queryString] = requestKey.split('?');
        if (queryString) {
          // Sort query params for consistent matching
          const params = new URLSearchParams(queryString);
          const sortedParams = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
          requestKey = `${path}?${sortedParams}`;
        }
      }
      const now = Date.now();
      
      // Check if this exact request was made very recently (within cache duration)
      if (recentRequests.has(requestKey)) {
        const lastRequestTime = recentRequests.get(requestKey);
        const timeDiff = now - lastRequestTime;
        if (timeDiff < REQUEST_CACHE_DURATION) {
          // This is a duplicate request within the cache window - cancel it
          const controller = new AbortController();
          controller.abort();
          config.signal = controller.signal;
          return Promise.reject(new Error('Duplicate request cancelled (recent cache)'));
        } else {
          // Cache expired, remove old entry
          recentRequests.delete(requestKey);
        }
      }
      
      // Check if the same request is already in flight
      if (pendingRequests.has(requestKey)) {
        // Cancel THIS new request (not the previous one that's already in flight)
        const controller = new AbortController();
        controller.abort();
        config.signal = controller.signal;
        return Promise.reject(new Error('Duplicate request cancelled (already pending)'));
      }
      
      // Mark this request as recent (will be cleaned up after cache duration)
      recentRequests.set(requestKey, now);
      
      // Clean up old cache entries (older than cache duration)
      // Use a longer timeout to ensure cleanup happens after the cache window expires
      setTimeout(() => {
        const cachedTime = recentRequests.get(requestKey);
        // Only delete if it's the same entry (not a newer one)
        if (cachedTime === now) {
          recentRequests.delete(requestKey);
        }
      }, REQUEST_CACHE_DURATION + 100); // Add small buffer
      
      // Create AbortController for this request and track it
      const controller = new AbortController();
      config.signal = controller.signal;
      pendingRequests.set(requestKey, controller);
    }
    
    // Get token from cookie (where useAuthContext stores it)
    let token = null;
    try {
      const sessionCookie = getCookie(authSessionKey);
      if (sessionCookie) {
        const sessionData = typeof sessionCookie === 'string' ? JSON.parse(sessionCookie) : sessionCookie;
        token = sessionData?.token;
      }
    } catch (e) {
      // If cookie parsing fails, try localStorage as fallback
      token = localStorage.getItem('token') || localStorage.getItem('authToken');
    }
    
    // Fallback to localStorage if cookie doesn't have token
    if (!token) {
      token = localStorage.getItem('token') || localStorage.getItem('authToken');
    }
    
    if (token) {
      // Django REST Framework Token authentication uses "Token <token>" format
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Add CSRF token if available (for Django session auth)
    // Try to get from cookie first (Django sets csrftoken cookie)
    let csrfToken = getCookie('csrftoken');
    // Fallback to form element if cookie not found
    if (!csrfToken) {
      csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally and cleanup request tracking
httpClient.interceptors.response.use(
  (response) => {
    // Remove from pending requests (only for GET requests)
    if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
      pendingRequests.delete(response.config.url);
    }
    
    // Return response as-is (not just data, so we can access status, headers, etc.)
    return response;
  },
  (error) => {
    // Remove from pending requests if config exists (only for GET requests)
    if (error.config?.method?.toLowerCase() === 'get' && error.config.url) {
      pendingRequests.delete(error.config.url);
    }
    
    // Don't handle AbortError (cancelled requests) as errors
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      // Clear localStorage tokens
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      
      // Clear cookie session (must match useAuthContext.jsx)
      deleteCookie(authSessionKey);
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/auth/sign-in') {
        window.location.href = '/auth/sign-in?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
    
    return Promise.reject(error);
  }
);

// Export both the instance and individual methods for convenience
// Store a reference to the original post method before wrapping
const originalPost = httpClient.post;

const wrappedPost = function(...args) {
  // Call the original post method, not the wrapped one
  return originalPost.apply(httpClient, args);
};

const exported = {
  get: httpClient.get,
  post: wrappedPost,
  put: httpClient.put,
  patch: httpClient.patch,
  delete: httpClient.delete,
  // Export the instance for custom requests
  instance: httpClient,
};

export default exported;
