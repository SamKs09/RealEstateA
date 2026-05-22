import Constants from 'expo-constants';

// API Configuration and Base Setup

const DEFAULT_DEV_API_PORT = '3000';
const LEGACY_FALLBACK_DEV_HOST = '192.168.100.32';
const PRODUCTION_API_URL = 'https://your-production-url.com/api';

const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const extractHost = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const withoutProtocol = value.replace(/^[a-z]+:\/\//i, '');
  const hostSegment = withoutProtocol.split('/')[0];
  const host = hostSegment.split(':')[0];
  return host || null;
};

const resolveExpoDevHost = (): string | null => {
  const constants = Constants as any;

  return extractHost(
    constants.expoConfig?.hostUri
      ?? constants.expoGoConfig?.debuggerHost
      ?? constants.manifest2?.extra?.expoClient?.hostUri
      ?? constants.manifest?.debuggerHost
      ?? null
  );
};

const resolveApiBaseUrl = (): string => {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envBaseUrl) {
    return normalizeApiBaseUrl(envBaseUrl);
  }

  if (__DEV__) {
    const devHost = resolveExpoDevHost() ?? LEGACY_FALLBACK_DEV_HOST;
    return normalizeApiBaseUrl(`http://${devHost}:${DEFAULT_DEV_API_PORT}`);
  }

  return PRODUCTION_API_URL;
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: resolveApiBaseUrl(),

  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

console.log(`🌐 API Service: Using base URL ${API_CONFIG.BASE_URL}`);

// API Response Types
export interface ApiResponse<T = any> {
  offers?: any[] | null;
  success: boolean;
  message: string;
  data?: T;
  token?: string;
  access_token?: string; // Support for your backend's token format
}

export interface ApiError {
  success: false;
  message: string;
  errors?: any;
}

// HTTP Methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const looksLikeHeaders = (value: any): value is Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    return false;
  }

  return keys.every((key) => {
    const normalized = key.toLowerCase();
    return normalized === 'content-type'
      || normalized === 'accept'
      || normalized === 'authorization'
      || normalized === 'accept-language'
      || normalized === 'x-language'
      || normalized.startsWith('x-');
  });
};

// Base API Class
class ApiService {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = API_CONFIG.HEADERS;
  }

  // Set custom timeout for specific requests
  setCustomTimeout(timeout: number) {
    this.timeout = timeout;
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log('🔑 API Service: Auth token set successfully');
  }

  // Remove authentication token
  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
    console.log('🔓 API Service: Auth token removed');
  }

  // Set the language for API requests (sends Accept-Language and x-language headers)
  setLanguage(langCode: string) {
    this.defaultHeaders['Accept-Language'] = langCode;
    this.defaultHeaders['x-language'] = langCode;
    console.log(`🌐 API Service: Language set to ${langCode}`);
  }

  // Get current auth token (for debugging)
  getAuthToken(): string | undefined {
    return this.defaultHeaders['Authorization'];
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    method: HttpMethod = 'GET',
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      let headers = { ...this.defaultHeaders, ...customHeaders };

      const config: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
        // Check if data is FormData - don't stringify it and remove Content-Type header
        if (data instanceof FormData) {
          config.body = data as any;
          // Remove Content-Type header to let browser set it with boundary
          delete headers['Content-Type'];
          config.headers = headers;
        } else {
          config.body = JSON.stringify(data);
        }
      }

      console.log(`🌐 API Request: ${method} ${url}`, {
        data: data instanceof FormData ? 'FormData' : (data || 'none'),
        hasAuthToken: !!headers['Authorization'],
        authTokenPreview: headers['Authorization']?.substring(0, 20) + '...',
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch {
        console.error(`❌ API JSON Parse Error: ${method} ${url}`, responseText.substring(0, 200));
        throw {
          success: false,
          message: `Invalid JSON response from server: ${response.status}`,
          status: response.status,
          responseText: responseText.substring(0, 500),
        };
      }

      console.log(`📡 API Response: ${method} ${url}`, result);

      if (!response.ok) {
        throw {
          success: false,
          message: result.message || 'Network request failed',
          status: response.status,
          ...result,
        };
      }

      return result;
    } catch (error: any) {
      // Don't log errors for logout endpoint (expected with expired tokens)
      if (endpoint !== '/auth/logout' && !error.responseText) {
        console.error(`❌ API Error: ${method} ${endpoint}`, error);
      }

      if (error.name === 'AbortError') {
        throw {
          success: false,
          message: 'Request timeout',
        };
      }

      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, headers);
  }

  // POST request
  async post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', data, headers);
  }

  // PUT request
  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', data, headers);
  }

  // DELETE request
  async delete<T>(endpoint: string, dataOrHeaders?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const requestData = looksLikeHeaders(dataOrHeaders) ? undefined : dataOrHeaders;
    const requestHeaders = looksLikeHeaders(dataOrHeaders) ? dataOrHeaders : headers;
    return this.request<T>(endpoint, 'DELETE', requestData, requestHeaders);
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', data, headers);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

// Export base URL for image URLs
export const API_URL = API_CONFIG.BASE_URL.replace('/api', '');

// Helper function to convert relative URLs to full URLs
export const getFullImageUrl = (path: string | undefined | null): string | undefined => {
  if (!path) {
    console.log('⚠️ getFullImageUrl: No path provided');
    return undefined;
  }

  // If it's already a full URL (including external URLs like Unsplash)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      
      // If it's from our backend server, replace the domain with the current API_URL
      if (url.hostname === 'localhost' || url.hostname.includes('192.168.') || url.hostname.includes('127.0.0.1')) {
        const pathname = url.pathname;
        const fullUrl = `${API_URL}${pathname}`;
        console.log(`🔄 getFullImageUrl (replacing domain): ${path} -> ${fullUrl}`);
        return fullUrl;
      }
      
      // External URLs (like Unsplash) - return as-is
      console.log(`✅ getFullImageUrl (external URL, keeping as-is): ${path}`);
      return path;
    } catch (error) {
      console.log('⚠️ getFullImageUrl: Error parsing URL:', error);
      return path;
    }
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // Return full URL
  const fullUrl = `${API_URL}/${cleanPath}`;
  console.log(`🔄 getFullImageUrl (adding domain): ${path} -> ${fullUrl}`);
  return fullUrl;
};